import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Unauthorized - Token không tồn tại"));
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decoded.userId)
      .select("-hashedPassword")
      .lean();

    if (!user) {
      return next(new Error("User không tồn tại"));
    }

    if (user.isBanned) {
      return next(new Error("Unauthorized - Tài khoản đã bị khóa"));
    }

    socket.user = user;

    next();
  } catch (error) {
    console.error("Lỗi khi verify JWT trong socketMiddleware", error);
    next(new Error("Unauthorized"));
  }
};
