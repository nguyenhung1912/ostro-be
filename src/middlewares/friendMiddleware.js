import Conversation from "../models/Conversation.js";
import Friend from "../models/Friend.js";
import { isValidObjectId } from "../utils/validation.js";

const pair = (a, b) => (a < b ? [a, b] : [b, a]);

export const checkFriendship = async (req, res, next) => {
  try {
    const me = req.user._id.toString();
    const conversationId = req.body?.conversationId ?? null;
    const recipientId = req.body?.recipientId ?? null;
    const memberIds = req.body?.memberIds ?? [];

    // Đã có conversationId (message tới conversation cũ), không cần kiểm tra friendship
    if (conversationId && !recipientId && memberIds.length === 0) {
      return next();
    }

    if (!recipientId && memberIds.length === 0) {
      return res.status(400).json({
        message: "Cần cung cấp recipientId hoặc memberIds.",
      });
    }

    // Kiểm tra friendship với 1 người
    if (recipientId) {
      if (!isValidObjectId(recipientId)) {
        return res.status(400).json({ message: "Id người nhận không hợp lệ." });
      }

      if (recipientId === me) {
        return res.status(400).json({
          message: "Không thể thao tác với chính mình.",
        });
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

    // Kiểm tra friendship với nhiều người (tạo nhóm)
    if (
      !Array.isArray(memberIds) ||
      !memberIds.every((id) => isValidObjectId(id))
    ) {
      return res
        .status(400)
        .json({ message: "Danh sách thành viên không hợp lệ." });
    }

    if (memberIds.some((id) => id === me)) {
      return res.status(400).json({
        message: "Không thể thêm chính mình vào danh sách thành viên.",
      });
    }

    const friendshipChecks = memberIds.map(async (memberId) => {
      const [userA, userB] = pair(me, memberId);
      const exists = await Friend.exists({ userA, userB });
      return exists ? null : memberId;
    });

    const notFriends = (await Promise.all(friendshipChecks)).filter(Boolean);

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
      return res
        .status(400)
        .json({ message: "Id cuộc trò chuyện không hợp lệ." });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy cuộc trò chuyện." });
    }

    if (conversation.type !== "group") {
      return res.status(400).json({
        message: "Cuộc trò chuyện này không phải nhóm.",
      });
    }

    const isMember = conversation.participants.some(
      (p) => p.userId.toString() === userId.toString(),
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
