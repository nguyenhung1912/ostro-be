import User from "../models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Session from "../models/Session.js";

const ACCESS_TOKEN_TTL = "30m";
export const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; // 14 ngày

export const normalizeString = (value) =>
  typeof value === "string" ? value.trim() : "";
export const normalizeUsername = (username) =>
  normalizeString(username).toLowerCase();
export const normalizeEmail = (email) => normalizeString(email).toLowerCase();

export const generateUniqueUsername = async (email) => {
  const base = email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  let username = base || "user";
  let counter = 1;

  while (await User.findOne({ username })) {
    username = `${base}${counter}`;
    counter++;
  }
  return username;
};

const getAccessTokenSecret = () => {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret)
    throw new Error("Biến môi trường ACCESS_TOKEN_SECRET là bắt buộc");
  return secret;
};

export const createAccessToken = (userId) =>
  jwt.sign({ userId: userId.toString() }, getAccessTokenSecret(), {
    expiresIn: ACCESS_TOKEN_TTL,
  });

export const hashRefreshToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const findSessionByRefreshToken = (token) => {
  const tokenHash = hashRefreshToken(token);
  return Session.findOne({ refreshToken: tokenHash });
};

export const createSession = async (userId) => {
  const refreshToken = crypto.randomBytes(64).toString("hex");
  const refreshTokenHash = hashRefreshToken(refreshToken);

  await Session.create({
    userId,
    refreshToken: refreshTokenHash,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
  });

  return refreshToken;
};

export const getDuplicateUserMessage = (duplicateUser, username, email) => {
  if (duplicateUser?.username === username) return "Tên đăng nhập đã tồn tại";
  if (duplicateUser?.email === email) return "Email đã tồn tại";
  return "Người dùng đã tồn tại";
};

export const getDuplicateKeyMessage = (err) => {
  if (err?.code !== 11000) return null;
  if (err.keyPattern?.username || err.keyValue?.username)
    return "Tên đăng nhập đã tồn tại";
  if (err.keyPattern?.email || err.keyValue?.email) return "Email đã tồn tại";
  return "Người dùng đã tồn tại";
};
