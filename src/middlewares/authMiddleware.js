import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protectedRoute = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme?.toLowerCase() !== "bearer" || !token) {
      return res.status(401).json({ message: "Không tìm thấy access token" });
    }

    let decodedUser;

    try {
      decodedUser = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch {
      return res
        .status(403)
        .json({ message: "Access token đã hết hạn hoặc không hợp lệ" });
    }

    const user = await User.findById(decodedUser.userId)
      .select("-hashedPassword")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: "Tài khoản của bạn đã bị khóa." });
    }

    req.user = user;
    return next();
  } catch (error) {
    console.error("Lỗi xác thực JWT", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const adminOnly = (req, res, next) => {
  if (
    req.user &&
    (req.user.role === "admin" || req.user.role === "moderator")
  ) {
    return next();
  }
  return res
    .status(403)
    .json({
      message: "Quyền truy cập bị từ chối. Chỉ dành cho Admin hoặc Moderator.",
    });
};
