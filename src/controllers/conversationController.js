import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import {
  findOrCreateDirectConversation,
  markConversationAsRead,
} from "../utils/conversationHelper.js";
import { isValidObjectId, areValidObjectIds } from "../utils/validation.js";
import { io } from "../socket/index.js";

const MAX_MESSAGE_LIMIT = 100;

// Shared helper: flatten populated participants array
const formatParticipants = (participants = []) =>
  participants.map((p) => ({
    _id: p.userId?._id,
    displayName: p.userId?.displayName,
    nickname: p.nickname,
    avatarUrl: p.userId?.avatarUrl ?? null,
    joinedAt: p.joinedAt,
  }));

export const createConversation = async (req, res) => {
  try {
    const { type, name, memberIds } = req.body;
    const userId = req.user._id;
    const normalizedName = typeof name === "string" ? name.trim() : "";

    if (
      !type ||
      !memberIds ||
      !Array.isArray(memberIds) ||
      memberIds.length === 0
    ) {
      return res.status(400).json({
        message: "Loại cuộc trò chuyện và danh sách thành viên là bắt buộc.",
      });
    }

    if (!areValidObjectIds(memberIds)) {
      return res
        .status(400)
        .json({ message: "Danh sách thành viên không hợp lệ." });
    }

    const normalizedMemberIds = memberIds.map((id) => id.toString());
    const uniqueMemberIds = [...new Set(normalizedMemberIds)];

    if (uniqueMemberIds.length !== normalizedMemberIds.length) {
      return res.status(400).json({
        message: "Danh sách thành viên không được trùng lặp.",
      });
    }

    let conversation;

    if (type === "direct") {
      if (uniqueMemberIds.length !== 1) {
        return res.status(400).json({
          message: "Cuộc trò chuyện trực tiếp chỉ được phép có một người nhận.",
        });
      }

      if (uniqueMemberIds[0] === userId.toString()) {
        return res.status(400).json({
          message: "Không thể tạo cuộc trò chuyện trực tiếp với chính mình.",
        });
      }

      conversation = await findOrCreateDirectConversation({
        userId,
        otherUserId: uniqueMemberIds[0],
      });
    }

    if (type === "group") {
      if (!normalizedName) {
        return res.status(400).json({ message: "Tên nhóm là bắt buộc." });
      }

      const now = new Date();
      conversation = new Conversation({
        type: "group",
        participants: [
          { userId, joinedAt: now },
          ...uniqueMemberIds.map((id) => ({ userId: id, joinedAt: now })),
        ],
        group: { name: normalizedName, createdBy: userId },
        lastMessageAt: now,
      });

      await conversation.save();
    }

    if (!conversation) {
      return res
        .status(400)
        .json({ message: "Loại cuộc trò chuyện không hợp lệ." });
    }

    await conversation.populate([
      { path: "participants.userId", select: "displayName avatarUrl" },
      { path: "seenBy", select: "displayName avatarUrl" },
      { path: "lastMessage.senderId", select: "displayName avatarUrl" },
    ]);

    const formatted = {
      ...conversation.toObject(),
      participants: formatParticipants(conversation.participants),
    };

    if (type === "group") {
      uniqueMemberIds.forEach((memberId) => {
        io.to(memberId).emit("new-group", formatted);
      });
    }

    return res.status(201).json({ conversation: formatted });
  } catch (error) {
    console.error("Lỗi khi tạo cuộc trò chuyện", error);
    return res.status(500).json({ message: "Lỗi hệ thống." });
  }
};

export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await Conversation.find({
      "participants.userId": userId,
    })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .populate({
        path: "participants.userId",
        select: "displayName avatarUrl",
      })
      .populate({
        path: "lastMessage.senderId",
        select: "displayName avatarUrl",
      })
      .populate({ path: "seenBy", select: "displayName avatarUrl" });

    const formattedConversations = conversations.map((conv) => ({
      ...conv.toObject(),
      unreadCounts: conv.unreadCounts
        ? Object.fromEntries(conv.unreadCounts)
        : {},
      participants: formatParticipants(conv.participants),
    }));

    return res.status(200).json({ conversations: formattedConversations });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách cuộc trò chuyện", error);
    return res.status(500).json({ message: "Lỗi hệ thống." });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, cursor } = req.query;
    const userId = req.user._id;
    const parsedLimit = Number.parseInt(limit, 10);

    if (!isValidObjectId(conversationId)) {
      return res
        .status(400)
        .json({ message: "Id cuộc trò chuyện không hợp lệ." });
    }

    if (!Number.isInteger(parsedLimit) || parsedLimit <= 0) {
      return res
        .status(400)
        .json({ message: "Giới hạn truy vấn không hợp lệ." });
    }

    const pageLimit = Math.min(parsedLimit, MAX_MESSAGE_LIMIT);
    const hasAccess = await Conversation.exists({
      _id: conversationId,
      "participants.userId": userId,
    });

    if (!hasAccess) {
      return res.status(403).json({
        message: "Bạn không có quyền xem tin nhắn của cuộc trò chuyện này.",
      });
    }

    const query = { conversationId };

    if (cursor) {
      const parsedCursor = new Date(cursor);

      if (Number.isNaN(parsedCursor.getTime())) {
        return res
          .status(400)
          .json({ message: "Con trỏ phân trang không hợp lệ." });
      }

      query.createdAt = { $lt: parsedCursor };
    }

    let messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(pageLimit + 1);

    let nextCursor = null;

    if (messages.length > pageLimit) {
      messages.pop();
      nextCursor = messages[messages.length - 1].createdAt.toISOString();
    }

    messages = messages.reverse();

    await markConversationAsRead({ conversationId, userId });

    return res.status(200).json({ messages, nextCursor });
  } catch (error) {
    console.error("Lỗi khi lấy tin nhắn", error);
    return res.status(500).json({ message: "Lỗi hệ thống." });
  }
};

export const getUserConversationsForSocketIO = async (userId) => {
  try {
    const conversations = await Conversation.find(
      { "participants.userId": userId },
      { _id: 1 },
    ).lean();

    return conversations.map((c) => c._id.toString());
  } catch (error) {
    console.error("Lỗi khi fetch conversations:", error);
    return [];
  }
};

export const markAsSeen = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id.toString();

    if (!isValidObjectId(conversationId)) {
      return res
        .status(400)
        .json({ message: "Id cuộc trò chuyện không hợp lệ." });
    }

    const conversation = await Conversation.findById(conversationId).lean();

    if (!conversation) {
      return res
        .status(404)
        .json({ message: "Cuộc trò chuyện không tồn tại." });
    }

    const last = conversation.lastMessage;

    if (!last) {
      return res
        .status(200)
        .json({ message: "Không có tin nhắn để đánh dấu đã đọc." });
    }

    if (last.senderId?.toString() === userId) {
      return res
        .status(200)
        .json({ message: "Người gửi không cần đánh dấu đã đọc." });
    }

    const updated = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $addToSet: { seenBy: userId },
        $set: { [`unreadCounts.${userId}`]: 0 },
      },
      { new: true },
    );

    if (!updated) {
      return res
        .status(404)
        .json({ message: "Cuộc trò chuyện không tồn tại." });
    }

    io.to(conversationId).emit("read-message", {
      conversationId,
      lastMessage: {
        _id: updated.lastMessage._id,
        content: updated.lastMessage.content,
        createdAt: updated.lastMessage.createdAt,
        sender: { _id: updated.lastMessage.senderId },
      },
      seenBy: updated.seenBy,
      unreadCounts: updated.unreadCounts
        ? Object.fromEntries(updated.unreadCounts)
        : {},
    });

    return res.status(200).json({
      message: "Đã đánh dấu đã đọc.",
      seenBy: updated.seenBy,
      myUnreadCount: updated.unreadCounts?.get?.(userId) ?? 0,
    });
  } catch (error) {
    console.error("Lỗi khi đánh dấu đã đọc", error);
    return res.status(500).json({ message: "Lỗi hệ thống." });
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    if (!isValidObjectId(conversationId)) {
      return res
        .status(400)
        .json({ message: "Id cuộc trò chuyện không hợp lệ." });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      "participants.userId": userId,
    });
    if (!conversation) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy cuộc trò chuyện." });
    }

    // Remove user from participants
    conversation.participants = conversation.participants.filter(
      (p) => p.userId.toString() !== userId.toString(),
    );

    if (conversation.participants.length === 0) {
      // Hard delete if empty
      await Conversation.findByIdAndDelete(conversationId);
      await Message.deleteMany({ conversationId });
    } else {
      await conversation.save();
    }

    // Notify the user via socket so their other devices update
    io.to(userId.toString()).emit("delete-conversation", { conversationId });

    return res.status(200).json({ message: "Đã xóa cuộc trò chuyện." });
  } catch (error) {
    console.error("Lỗi khi xóa cuộc trò chuyện", error);
    return res.status(500).json({ message: "Lỗi hệ thống." });
  }
};

export const renameConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { name } = req.body;
    const userId = req.user._id;

    if (!isValidObjectId(conversationId)) {
      return res
        .status(400)
        .json({ message: "Id cuộc trò chuyện không hợp lệ." });
    }

    if (!name || typeof name !== "string") {
      return res.status(400).json({ message: "Tên không hợp lệ." });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      "participants.userId": userId,
    });
    if (!conversation) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy cuộc trò chuyện." });
    }

    if (conversation.type === "group") {
      conversation.group.name = name.trim();
    } else {
      // Direct chat: set nickname for the OTHER user
      const otherParticipant = conversation.participants.find(
        (p) => p.userId.toString() !== userId.toString(),
      );
      if (otherParticipant) {
        otherParticipant.nickname = name.trim();
      }
    }

    await conversation.save();

    await conversation.populate([
      { path: "participants.userId", select: "displayName avatarUrl" },
      { path: "seenBy", select: "displayName avatarUrl" },
      { path: "lastMessage.senderId", select: "displayName avatarUrl" },
    ]);

    const formatted = {
      ...conversation.toObject(),
      participants: formatParticipants(conversation.participants),
    };

    // Notify all participants about the rename
    conversation.participants.forEach((p) => {
      io.to(p.userId._id ? p.userId._id.toString() : p.userId.toString()).emit(
        "rename-conversation",
        { conversation: formatted },
      );
    });

    return res.status(200).json({ conversation: formatted });
  } catch (error) {
    console.error("Lỗi khi đổi tên cuộc trò chuyện", error);
    return res.status(500).json({ message: "Lỗi hệ thống." });
  }
};
