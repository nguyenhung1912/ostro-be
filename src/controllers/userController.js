import { uploadImageFromBuffer } from "../middlewares/uploadMiddleware.js";
import User from "../models/User.js";

export const authMe = async (req, res) => {
  try {
    return res.status(200).json({ user: req.user });
  } catch (err) {
    console.error("Lỗi khi lấy thông tin người dùng", err);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const searchUserByUsername = async (req, res) => {
  try {
    const { username } = req.query;

    if (!username || username.trim() === "")
      return res
        .status(400)
        .json({ message: "Cần cung cấp username trong query" });

    const user = await User.findOne({ username }).select(
      "_id displayName username avatarUrl",
    );

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Lỗi xảy ra khi searchUserByUsername", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    const file = req.file;
    const userId = req.user._id;

    if (!file) return res.status(400).json({ message: "No file uploaded" });

    const result = await uploadImageFromBuffer(file.buffer);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        avatarUrl: result.secure_url,
        avatarId: result.public_id,
      },
      {
        new: true,
      },
    ).select("avatarUrl");

    if (!updatedUser.avatarUrl)
      return res.status(400).json({ message: "Avatar tra ve null" });

    return res.status(200).json({ avatarUrl: updatedUser.avatarUrl });
  } catch (error) {
    console.error("Loi khi upload avatar", error);
    return res.status(500).json({ message: "Avatar upload failed" });
  }
};
