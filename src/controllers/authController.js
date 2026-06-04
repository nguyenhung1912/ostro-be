import bcrypt from "bcrypt";
import User from "../models/User.js";
import Session from "../models/Session.js";
import { OAuth2Client } from "google-auth-library";
import {
  normalizeString,
  normalizeUsername,
  normalizeEmail,
  generateUniqueUsername,
  createAccessToken,
  createSession,
  getDuplicateUserMessage,
  getDuplicateKeyMessage,
  hashRefreshToken,
  findSessionByRefreshToken,
} from "../services/authService.js";

const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000;
const REFRESH_COOKIE_NAME = "refreshToken";
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  path: "/",
};

export const signUp = async (req, res) => {
  try {
    const { username, password, email, firstName, lastName } = req.body;
    const normalizedUsername = normalizeUsername(username);
    const normalizedEmail = normalizeEmail(email);
    const normalizedFirstName = normalizeString(firstName);
    const normalizedLastName = normalizeString(lastName);
    const normalizedPassword = typeof password === "string" ? password : "";

    if (
      !normalizedUsername ||
      !normalizedPassword ||
      !normalizedEmail ||
      !normalizedFirstName ||
      !normalizedLastName
    ) {
      return res.status(400).json({
        message: "Tên đăng nhập, mật khẩu, email, họ và tên là bắt buộc",
      });
    }

    const duplicate = await User.findOne({
      $or: [{ username: normalizedUsername }, { email: normalizedEmail }],
    })
      .select("username email")
      .lean();

    if (duplicate) {
      return res.status(409).json({
        message: getDuplicateUserMessage(
          duplicate,
          normalizedUsername,
          normalizedEmail,
        ),
      });
    }

    const hashedPassword = await bcrypt.hash(normalizedPassword, 10);
    const count = await User.countDocuments();
    const role = count === 0 ? "admin" : "user";

    await User.create({
      username: normalizedUsername,
      hashedPassword,
      email: normalizedEmail,
      displayName: `${normalizedLastName} ${normalizedFirstName}`,
      role,
    });

    return res.sendStatus(201);
  } catch (err) {
    const duplicateMessage = getDuplicateKeyMessage(err);
    if (duplicateMessage)
      return res.status(409).json({ message: duplicateMessage });

    console.error("Lỗi khi đăng ký", err);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const signIn = async (req, res) => {
  try {
    const { username, password } = req.body;
    const normalizedUsername = normalizeUsername(username);
    const normalizedPassword = typeof password === "string" ? password : "";

    if (!normalizedUsername || !normalizedPassword) {
      return res
        .status(400)
        .json({ message: "Tên đăng nhập hoặc mật khẩu không hợp lệ" });
    }

    const user = await User.findOne({ username: normalizedUsername }).select(
      "+hashedPassword",
    );

    if (!user) {
      return res
        .status(401)
        .json({ message: "Tên đăng nhập hoặc mật khẩu không đúng" });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: "Tài khoản của bạn đã bị khóa." });
    }

    const passwordCorrect = await bcrypt.compare(
      normalizedPassword,
      user.hashedPassword,
    );

    if (!passwordCorrect) {
      return res
        .status(401)
        .json({ message: "Tên đăng nhập hoặc mật khẩu không đúng" });
    }

    const accessToken = createAccessToken(user._id);
    const refreshToken = await createSession(user._id);

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      ...REFRESH_COOKIE_OPTIONS,
      maxAge: REFRESH_TOKEN_TTL,
    });

    return res.status(200).json({
      message: `Đăng nhập thành công! Xin chào ${user.displayName}`,
      accessToken,
    });
  } catch (err) {
    console.error("Lỗi khi đăng nhập", err);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const googleSignIn = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: "Thiếu token Google" });
    }

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res
        .status(401)
        .json({ message: "Token Google không hợp lệ hoặc thiếu email" });
    }

    const { email, sub: googleId, name, picture } = payload;
    const normalizedEmail = normalizeEmail(email);

    let user = await User.findOne({
      $or: [{ googleId }, { email: normalizedEmail }],
    });

    if (user) {
      if (user.isBanned) {
        return res
          .status(403)
          .json({ message: "Tài khoản của bạn đã bị khóa." });
      }
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      const username = await generateUniqueUsername(normalizedEmail);
      const count = await User.countDocuments();
      const role = count === 0 ? "admin" : "user";
      user = await User.create({
        username,
        email: normalizedEmail,
        displayName: name || username,
        googleId,
        avatarUrl: picture,
        role,
      });
    }

    const accessToken = createAccessToken(user._id);
    const refreshToken = await createSession(user._id);

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      ...REFRESH_COOKIE_OPTIONS,
      maxAge: REFRESH_TOKEN_TTL,
    });

    return res.status(200).json({
      message: `Đăng nhập thành công! Xin chào ${user.displayName}`,
      accessToken,
    });
  } catch (err) {
    console.error("Lỗi khi đăng nhập bằng Google", err);
    return res
      .status(500)
      .json({ message: "Lỗi xác thực Google. Vui lòng thử lại sau." });
  }
};

export const signOut = async (req, res) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (token) {
      const tokenHash = hashRefreshToken(token);
      await Session.deleteOne({ refreshToken: tokenHash });
    }

    res.clearCookie(REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS);
    return res.sendStatus(204);
  } catch (err) {
    console.error("Lỗi khi đăng xuất", err);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ message: "Token không tồn tại" });
    }

    const session = await findSessionByRefreshToken(token);
    if (!session) {
      return res
        .status(403)
        .json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }

    const accessToken = createAccessToken(session.userId);
    return res.status(200).json({ accessToken });
  } catch (err) {
    console.error("Lỗi khi làm mới token", err);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
