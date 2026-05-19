import { uploadImageFromBuffer } from "../middlewares/uploadMiddleware.js";
import bcrypt from "bcrypt";
import Conversation from "../models/Conversation.js";
import Friend from "../models/Friend.js";
import FriendRequest from "../models/FriendRequest.js";
import Message from "../models/Message.js";
import Session from "../models/Session.js";
import User from "../models/User.js";

const normalizeString = (value) =>
  typeof value === "string" ? value.trim() : "";

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

export const uploadCover = async (req, res) => {
  try {
    const file = req.file;
    const userId = req.user._id;

    if (!file) {
      return res
        .status(400)
        .json({ message: "Không có file nào được tải lên." });
    }

    const result = await uploadImageFromBuffer(file.buffer, {
      folder: "ostro_chat/covers",
      transformation: [{ width: 1200, height: 400, crop: "fill" }],
    });

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { coverUrl: result.secure_url, coverId: result.public_id },
      { new: true },
    ).select("coverUrl");

    if (!updatedUser?.coverUrl) {
      return res
        .status(400)
        .json({ message: "Ảnh bìa không hợp lệ sau khi tải lên." });
    }

    return res.status(200).json({ coverUrl: updatedUser.coverUrl });
  } catch (error) {
    console.error("Lỗi khi tải lên ảnh bìa", error);
    return res.status(500).json({ message: "Tải ảnh bìa thất bại." });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const displayName = normalizeString(req.body.displayName);
    const bio = normalizeString(req.body.bio);
    const phone = normalizeString(req.body.phone);

    if (!displayName || displayName.length > 80) {
      return res
        .status(400)
        .json({ message: "Tên hiển thị phải có từ 1 đến 80 ký tự." });
    }

    if (bio.length > 500) {
      return res
        .status(400)
        .json({ message: "Giới thiệu không được vượt quá 500 ký tự." });
    }

    if (phone.length > 30) {
      return res
        .status(400)
        .json({ message: "Số điện thoại không được vượt quá 30 ký tự." });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { displayName, bio, phone },
      { new: true, runValidators: true },
    )
      .select("-hashedPassword")
      .lean();

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Lỗi khi cập nhật hồ sơ", error);
    return res.status(500).json({ message: "Lỗi hệ thống." });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const currentPassword =
      typeof req.body.currentPassword === "string"
        ? req.body.currentPassword
        : "";
    const newPassword =
      typeof req.body.newPassword === "string" ? req.body.newPassword : "";

    if (!currentPassword || newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Mật khẩu hiện tại và mật khẩu mới là bắt buộc." });
    }

    const user = await User.findById(userId).select("+hashedPassword");

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }

    const passwordCorrect = await bcrypt.compare(
      currentPassword,
      user.hashedPassword,
    );

    if (!passwordCorrect) {
      return res.status(401).json({ message: "Mật khẩu hiện tại không đúng." });
    }

    user.hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.save();
    await Session.deleteMany({ userId, _id: { $ne: null } });

    return res.status(200).json({ message: "Đổi mật khẩu thành công." });
  } catch (error) {
    console.error("Lỗi khi đổi mật khẩu", error);
    return res.status(500).json({ message: "Lỗi hệ thống." });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const password =
      typeof req.body.password === "string" ? req.body.password : "";
    const user = await User.findById(userId).select("+hashedPassword");

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }

    const passwordCorrect = await bcrypt.compare(password, user.hashedPassword);

    if (!passwordCorrect) {
      return res.status(401).json({ message: "Mật khẩu không đúng." });
    }

    const directConversations = await Conversation.find({
      type: "direct",
      "participants.userId": userId,
    }).select("_id");
    const directConversationIds = directConversations.map((c) => c._id);

    await Promise.all([
      Session.deleteMany({ userId }),
      Friend.deleteMany({ $or: [{ userA: userId }, { userB: userId }] }),
      FriendRequest.deleteMany({ $or: [{ from: userId }, { to: userId }] }),
      Message.deleteMany({ conversationId: { $in: directConversationIds } }),
      Conversation.deleteMany({ _id: { $in: directConversationIds } }),
      Conversation.updateMany(
        { type: "group", "participants.userId": userId },
        { $pull: { participants: { userId } } },
      ),
      User.findByIdAndDelete(userId),
    ]);

    return res.sendStatus(204);
  } catch (error) {
    console.error("Lỗi khi xoá tài khoản", error);
    return res.status(500).json({ message: "Lỗi hệ thống." });
  }
};
