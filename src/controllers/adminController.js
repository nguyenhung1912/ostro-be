import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Session from "../models/Session.js";
import Friend from "../models/Friend.js";
import FriendRequest from "../models/FriendRequest.js";
import { onlineUsers, io } from "../socket/index.js";

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-hashedPassword").lean();
    const result = users.map((user) => {
      let status = "offline";
      if (user.isBanned) {
        status = "banned";
      } else if (!user.isActivated) {
        status = "inactive";
      } else if (onlineUsers.has(user._id.toString())) {
        status = "online";
      }
      return {
        ...user,
        status,
      };
    });
    return res.status(200).json(result);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách user:", err);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!["admin", "moderator", "user"].includes(role)) {
      return res.status(400).json({ message: "Role không hợp lệ" });
    }

    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Chỉ Admin mới có quyền đổi vai trò người dùng" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true },
    ).select("-hashedPassword");

    if (!updatedUser) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    return res
      .status(200)
      .json({ message: "Cập nhật vai trò thành công", user: updatedUser });
  } catch (err) {
    console.error("Lỗi khi đổi vai trò user:", err);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const toggleUserBan = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    user.isBanned = !user.isBanned;
    await user.save();

    if (user.isBanned) {
      await Session.deleteMany({ userId: user._id });

      const userIdStr = user._id.toString();
      if (onlineUsers.has(userIdStr)) {
        const sockets = onlineUsers.get(userIdStr);
        sockets.forEach((socketId) => {
          const socketObj = io.sockets.sockets.get(socketId);
          if (socketObj) {
            socketObj.emit("banned", {
              message: "Tài khoản của bạn đã bị khóa.",
            });
            socketObj.disconnect(true);
          }
        });
        onlineUsers.delete(userIdStr);
        io.emit("online-users", Array.from(onlineUsers.keys()));
      }
    }

    return res.status(200).json({
      message: user.isBanned
        ? "Khóa tài khoản thành công"
        : "Mở khóa tài khoản thành công",
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        isBanned: user.isBanned,
      },
    });
  } catch (err) {
    console.error("Lỗi khi thay đổi trạng thái khóa tài khoản:", err);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const directConversations = await Conversation.find({
      type: "direct",
      "participants.userId": userId,
    }).select("_id");
    const directConversationIds = directConversations.map((c) => c._id);

    const groupConversations = await Conversation.find({
      type: "group",
      "participants.userId": userId,
    });

    const groupUpdates = groupConversations.map(async (group) => {
      group.participants = group.participants.filter(
        (p) => p.userId.toString() !== userId.toString(),
      );

      if (group.participants.length === 0) {
        await Conversation.findByIdAndDelete(group._id);
        await Message.deleteMany({ conversationId: group._id });
      } else {
        if (group.group.createdBy.toString() === userId.toString()) {
          const sorted = [...group.participants].sort(
            (a, b) =>
              new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime(),
          );
          group.group.createdBy = sorted[0].userId;
        }
        await group.save();
      }
    });

    await Promise.all([
      ...groupUpdates,
      Session.deleteMany({ userId }),
      Friend.deleteMany({ $or: [{ userA: userId }, { userB: userId }] }),
      FriendRequest.deleteMany({ $or: [{ from: userId }, { to: userId }] }),
      Message.deleteMany({ conversationId: { $in: directConversationIds } }),
      Conversation.deleteMany({ _id: { $in: directConversationIds } }),
      User.findByIdAndDelete(userId),
    ]);

    const userIdStr = userId.toString();
    if (onlineUsers.has(userIdStr)) {
      const sockets = onlineUsers.get(userIdStr);
      sockets.forEach((socketId) => {
        const socketObj = io.sockets.sockets.get(socketId);
        if (socketObj) {
          socketObj.disconnect(true);
        }
      });
      onlineUsers.delete(userIdStr);
      io.emit("online-users", Array.from(onlineUsers.keys()));
    }

    return res.status(200).json({ message: "Xóa tài khoản thành công" });
  } catch (err) {
    console.error("Lỗi khi xóa người dùng:", err);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getAllGroups = async (req, res) => {
  try {
    const groups = await Conversation.find({ type: "group" })
      .populate("participants.userId", "displayName username avatarUrl")
      .populate("group.createdBy", "displayName username")
      .lean();

    return res.status(200).json(groups);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách nhóm:", err);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Conversation.findOne({ _id: groupId, type: "group" });
    if (!group) {
      return res.status(404).json({ message: "Không tìm thấy nhóm" });
    }

    await Conversation.findByIdAndDelete(groupId);
    await Message.deleteMany({ conversationId: groupId });

    io.to(groupId).emit("group-deleted", { conversationId: groupId });

    return res.status(200).json({ message: "Xóa nhóm thành công" });
  } catch (err) {
    console.error("Lỗi khi xóa nhóm:", err);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const past30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const past7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const past14d = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [dauSessions, dauMessages, dauNewUsers] = await Promise.all([
      Session.distinct("userId", { updatedAt: { $gte: past24h } }),
      Message.distinct("senderId", { createdAt: { $gte: past24h } }),
      User.distinct("_id", { createdAt: { $gte: past24h } }),
    ]);
    const dauSet = new Set([
      ...dauSessions.map((id) => id.toString()),
      ...dauMessages.map((id) => id.toString()),
      ...dauNewUsers.map((id) => id.toString()),
    ]);
    const dau = dauSet.size;

    const [mauSessions, mauMessages, mauNewUsers] = await Promise.all([
      Session.distinct("userId", { updatedAt: { $gte: past30d } }),
      Message.distinct("senderId", { createdAt: { $gte: past30d } }),
      User.distinct("_id", { createdAt: { $gte: past30d } }),
    ]);
    const mauSet = new Set([
      ...mauSessions.map((id) => id.toString()),
      ...mauMessages.map((id) => id.toString()),
      ...mauNewUsers.map((id) => id.toString()),
    ]);
    const mau = mauSet.size;

    const messageVolume = await Message.aggregate([
      { $match: { createdAt: { $gte: past7d } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
              timezone: "+07:00",
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const registrationGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: past14d } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
              timezone: "+07:00",
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const fillDates = (data, daysCount) => {
      const result = [];
      for (let i = daysCount - 1; i >= 0; i--) {
        const dateObj = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
        const dd = String(dateObj.getDate()).padStart(2, "0");
        const dateStr = `${yyyy}-${mm}-${dd}`;

        const found = data.find((item) => item._id === dateStr);
        result.push({
          date: dateStr,
          count: found ? found.count : 0,
        });
      }
      return result;
    };

    const formattedMessageVolume = fillDates(messageVolume, 7);
    const formattedGrowth = fillDates(registrationGrowth, 14);

    return res.status(200).json({
      dau,
      mau,
      messageVolume: formattedMessageVolume,
      registrationGrowth: formattedGrowth,
    });
  } catch (err) {
    console.error("Lỗi khi lấy thống kê:", err);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
