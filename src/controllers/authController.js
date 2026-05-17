import bcrypt from "bcrypt";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Session from "../models/Session.js";

const ACCESS_TOKEN_TTL = "30m";
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; // 14 ngày
const REFRESH_COOKIE_NAME = "refreshToken";
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  path: "/",
};

const normalizeString = (value) =>
  typeof value === "string" ? value.trim() : "";

const normalizeUsername = (username) => normalizeString(username).toLowerCase();
const normalizeEmail = (email) => normalizeString(email).toLowerCase();

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

if (!ACCESS_TOKEN_SECRET) {
  throw new Error("Biến môi trường ACCESS_TOKEN_SECRET là bắt buộc");
}

const createAccessToken = (userId) =>
  jwt.sign({ userId: userId.toString() }, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });

const hashRefreshToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const findSessionByRefreshToken = (token) => {
  const tokenHash = hashRefreshToken(token);

  return Session.findOne({ refreshToken: tokenHash });
};

const getDuplicateUserMessage = (duplicateUser, username, email) => {
  if (duplicateUser?.username === username) {
    return "Tên đăng nhập đã tồn tại";
  }

  if (duplicateUser?.email === email) {
    return "Email đã tồn tại";
  }

  return "Người dùng đã tồn tại";
};

const getDuplicateKeyMessage = (err) => {
  if (err?.code !== 11000) {
    return null;
  }

  if (err.keyPattern?.username || err.keyValue?.username) {
    return "Tên đăng nhập đã tồn tại";
  }

  if (err.keyPattern?.email || err.keyValue?.email) {
    return "Email đã tồn tại";
  }

  return "Người dùng đã tồn tại";
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

    // kiểm tra tên đăng nhập hoặc email đã tồn tại
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

    // mã hoá mật khẩu
    const hashedPassword = await bcrypt.hash(normalizedPassword, 10);

    // tạo người dùng mới
    await User.create({
      username: normalizedUsername,
      hashedPassword,
      email: normalizedEmail,
      displayName: `${normalizedLastName} ${normalizedFirstName}`,
    });

    return res.sendStatus(201);
  } catch (err) {
    const duplicateMessage = getDuplicateKeyMessage(err);

    if (duplicateMessage) {
      return res.status(409).json({ message: duplicateMessage });
    }

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

    // lấy hashedPassword từ DB để so sánh
    const user = await User.findOne({ username: normalizedUsername }).select(
      "+hashedPassword",
    );

    if (!user) {
      return res
        .status(401)
        .json({ message: "Tên đăng nhập hoặc mật khẩu không đúng" });
    }

    // kiểm tra mật khẩu
    const passwordCorrect = await bcrypt.compare(
      normalizedPassword,
      user.hashedPassword,
    );

    if (!passwordCorrect) {
      return res
        .status(401)
        .json({ message: "Tên đăng nhập hoặc mật khẩu không đúng" });
    }

    // tạo access token
    const accessToken = createAccessToken(user._id);

    // tạo refresh token
    const refreshToken = crypto.randomBytes(64).toString("hex");
    const refreshTokenHash = hashRefreshToken(refreshToken);

    // lưu session
    await Session.create({
      userId: user._id,
      refreshToken: refreshTokenHash,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
    });

    // trả refresh token qua cookie
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      ...REFRESH_COOKIE_OPTIONS,
      maxAge: REFRESH_TOKEN_TTL,
    });

    // trả access token
    return res.status(200).json({
      message: `Đăng nhập thành công! Xin chào ${user.displayName}`,
      accessToken,
    });
  } catch (err) {
    console.error("Lỗi khi đăng nhập", err);
    return res.status(500).json({ message: "Lỗi hệ thống" });
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

    // kiểm tra refresh token trong DB (TTL index tự động xóa session hết hạn)
    const session = await findSessionByRefreshToken(token);

    if (!session) {
      return res
        .status(403)
        .json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }

    // tạo access token mới
    const accessToken = createAccessToken(session.userId);

    return res.status(200).json({ accessToken });
  } catch (err) {
    console.error("Lỗi khi làm mới token", err);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
