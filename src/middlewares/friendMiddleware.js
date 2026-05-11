import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Friend from "../models/Friend.js";

const pair = (a, b) => (a < b ? [a, b] : [b, a]);
const isValidObjectId = (value) => mongoose.isValidObjectId(value);

export const checkFriendship = async (req, res, next) => {
  try {
    const me = req.user._id.toString();
    const conversationId = req.body?.conversationId ?? null;
    const recipientId = req.body?.recipientId ?? null;
    const memberIds = req.body?.memberIds ?? req.body?.memeberIds ?? [];

    if (conversationId && !recipientId && memberIds.length === 0) {
      return next();
    }

    if (!recipientId && memberIds.length === 0) {
      return res.status(400).json({
        message: "Cần cung cấp recipientId hoặc memberIds.",
      });
    }

    if (recipientId) {
      if (!isValidObjectId(recipientId)) {
        return res.status(400).json({ message: "Id người nhận không hợp lệ." });
      }

      const [userA, userB] = pair(me, recipientId);
      const isFriend = await Friend.exists({ userA, userB });

      if (!isFriend) {
        return res.status(403).json({
          message: "Bạn chưa kết bạn với người dùng này.",
        });
      }

      return next();
    }

    if (!memberIds.every((memberId) => isValidObjectId(memberId))) {
      return res.status(400).json({ message: "Danh sách thành viên không hợp lệ." });
    }

    const friendshipChecks = memberIds.map(async (memberId) => {
      const [userA, userB] = pair(me, memberId);
      const friendship = await Friend.exists({ userA, userB });
      return friendship ? null : memberId;
    });

    const results = await Promise.all(friendshipChecks);
    const notFriends = results.filter(Boolean);

    if (notFriends.length > 0) {
      return res.status(403).json({
        message: "Bạn chỉ có thể thêm bạn bè vào nhóm.",
        notFriends,
      });
    }

    return next();
  } catch (error) {
    console.error("Lỗi khi kiểm tra quan hệ bạn bè", error);
    return res.status(500).json({ message: "Lỗi hệ thống." });
  }
};

export const checkGroupMembership = async (req, res, next) => {
  try {
    const { conversationId } = req.body;
    const userId = req.user._id;

    if (!isValidObjectId(conversationId)) {
      return res.status(400).json({ message: "Id cuộc trò chuyện không hợp lệ." });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Không tìm thấy cuộc trò chuyện." });
    }

    const isMember = conversation.participants.some(
      (participant) => participant.userId.toString() === userId.toString(),
    );

    if (!isMember) {
      return res.status(403).json({
        message: "Bạn không thuộc nhóm trò chuyện này.",
      });
    }

    req.conversation = conversation;
    return next();
  } catch (error) {
    console.error("Lỗi khi kiểm tra thành viên nhóm", error);
    return res.status(500).json({ message: "Lỗi hệ thống." });
  }
};
