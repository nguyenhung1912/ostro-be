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
    const normalizedUsername =
      typeof username === "string" ? username.trim().toLowerCase() : "";

    if (!normalizedUsername) {
      return res
        .status(400)
        .json({ message: "Cần cung cấp username trong query." });
    }

    const user = await User.findOne({ username: normalizedUsername })
      .select("_id displayName username avatarUrl")
      .lean();

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Lỗi khi tìm kiếm người dùng", error);
    return res.status(500).json({ message: "Lỗi hệ thống." });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    const file = req.file;
    const userId = req.user._id;

    if (!file) {
      return res
        .status(400)
        .json({ message: "Không có file nào được tải lên." });
    }

    const result = await uploadImageFromBuffer(file.buffer);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatarUrl: result.secure_url, avatarId: result.public_id },
      { new: true },
    ).select("avatarUrl");

    if (!updatedUser?.avatarUrl) {
      return res
        .status(400)
        .json({ message: "Avatar không hợp lệ sau khi tải lên." });
    }

    return res.status(200).json({ avatarUrl: updatedUser.avatarUrl });
  } catch (error) {
    console.error("Lỗi khi tải lên avatar", error);
    return res.status(500).json({ message: "Tải lên avatar thất bại." });
  }
};
