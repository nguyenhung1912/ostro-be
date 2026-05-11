import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protectedRoute = async (req, res, next) => {
  try {
    // lấy token từ header
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme?.toLowerCase() !== "bearer" || !token) {
      return res.status(401).json({ message: "Không tìm thấy access token" });
    }

    const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;

    if (!accessTokenSecret) {
      throw new Error("Biến môi trường ACCESS_TOKEN_SECRET là bắt buộc");
    }

    // xác thực token
    let decodedUser;

    try {
      decodedUser = jwt.verify(token, accessTokenSecret);
    } catch {
      return res
        .status(403)
        .json({ message: "Access token đã hết hạn hoặc không hợp lệ" });
    }

    // tìm người dùng
    const user = await User.findById(decodedUser.userId)
      .select("-hashedPassword")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    // gắn user vào request
    req.user = user;
    return next();
  } catch (error) {
    console.error("Lỗi xác thực JWT", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
