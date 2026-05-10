import bcrypt from "bcrypt";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto"; // tạo và băm refresh token
import Session from "../models/Session.js";

const ACCESS_TOKEN_TTL = "30m";
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; // 14d 24h 60m 60s 1000ms
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

const getAccessTokenSecret = () => {
  if (!process.env.ACCESS_TOKEN_SECRET) {
    throw new Error("ACCESS_TOKEN_SECRET is required");
  }

  return process.env.ACCESS_TOKEN_SECRET;
};

const createAccessToken = (userId) =>
  jwt.sign({ userId: userId.toString() }, getAccessTokenSecret(), {
    expiresIn: ACCESS_TOKEN_TTL,
  });

const hashRefreshToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const findSessionByRefreshToken = (token) => {
  const tokenHash = hashRefreshToken(token);

  return Session.findOne({
    $or: [{ refreshToken: tokenHash }, { refreshToken: token }],
  });
};

const getDuplicateUserMessage = (duplicateUser, username, email) => {
  if (duplicateUser?.username === username) {
    return "Username already exists";
  }

  if (duplicateUser?.email === email) {
    return "Email already exists";
  }

  return "User already exists";
};

const getDuplicateKeyMessage = (err) => {
  if (err?.code !== 11000) {
    return null;
  }

  if (err.keyPattern?.username || err.keyValue?.username) {
    return "Username already exists";
  }

  if (err.keyPattern?.email || err.keyValue?.email) {
    return "Email already exists";
  }

  return "User already exists";
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
        message: "username, password, email, firstName, lastName is required",
      });
    }

    // check if the username or email already exists
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

    // hash password
    const hashedPassword = await bcrypt.hash(normalizedPassword, 10);

    // create new user
    await User.create({
      username: normalizedUsername,
      hashedPassword,
      email: normalizedEmail,
      displayName: `${normalizedLastName} ${normalizedFirstName}`,
    });

    // return
    return res.sendStatus(204);
  } catch (err) {
    const duplicateMessage = getDuplicateKeyMessage(err);

    if (duplicateMessage) {
      return res.status(409).json({ message: duplicateMessage });
    }

    console.error("Failed to call signUp", err);
    return res.status(500).json({ message: "System error" });
  }
};

export const signIn = async (req, res) => {
  try {
    const { username, password } = req.body;
    const normalizedUsername = normalizeUsername(username);
    const normalizedPassword = typeof password === "string" ? password : "";

    // get input from req
    if (!normalizedUsername || !normalizedPassword) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    // get hashedPassword from DB to compare with input password
    const user = await User.findOne({ username: normalizedUsername }).select(
      "+hashedPassword",
    );

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // check password
    const passwordCorrect = await bcrypt.compare(
      normalizedPassword,
      user.hashedPassword,
    );

    if (!passwordCorrect) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // if match, create access token with JWT
    const accessToken = createAccessToken(user._id);

    // create refresh token
    const refreshToken = crypto.randomBytes(64).toString("hex");
    const refreshTokenHash = hashRefreshToken(refreshToken);

    // create new session to store refresh token
    await Session.create({
      userId: user._id,
      refreshToken: refreshTokenHash,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
    });

    // return refresh token in cookie
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      ...REFRESH_COOKIE_OPTIONS,
      maxAge: REFRESH_TOKEN_TTL,
    });

    // return access token in response
    return res.status(200).json({
      message: `User ${user.displayName} is logged in!`,
      accessToken,
    });
  } catch (err) {
    console.error("Failed to call signIn", err);
    return res.status(500).json({ message: "System error" });
  }
};

export const signOut = async (req, res) => {
  try {
    // get refresh token from cookie
    const token = req.cookies?.[REFRESH_COOKIE_NAME];

    if (token) {
      // delete refresh token in session
      const tokenHash = hashRefreshToken(token);

      await Session.deleteOne({
        $or: [{ refreshToken: tokenHash }, { refreshToken: token }],
      });

      // delete refresh token in cookie
      res.clearCookie(REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS);
    }

    return res.sendStatus(204);
  } catch (err) {
    console.error("Failed to call signOut", err);
    return res.status(500).json({ message: "System error" });
  }
};

// create new access token from refresh token
export const refreshToken = async (req, res) => {
  try {
    // get refresh token from cookie
    const token = req.cookies?.[REFRESH_COOKIE_NAME];

    if (!token) {
      return res.status(401).json({ message: "Token does not exits" });
    }

    // compare refresh token in db
    const session = await findSessionByRefreshToken(token);

    if (!session) {
      return res.status(403).json({ message: "Invalid Token or Expired" });
    }

    // check if it has expired
    if (session.expiresAt < new Date()) {
      await Session.deleteOne({ _id: session._id });

      return res.status(403).json({ message: "Token has expired." });
    }

    if (session.refreshToken === token) {
      await Session.updateOne(
        { _id: session._id },
        { $set: { refreshToken: hashRefreshToken(token) } },
      );
    }

    // create new access token
    const accessToken = createAccessToken(session.userId);

    // return
    return res.status(200).json({ accessToken });
  } catch (err) {
    console.error("Failed to call refreshToken", err);
    return res.status(500).json({ message: "System error" });
  }
};
