import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import {
  findOrCreateDirectConversation,
  markConversationAsRead,
} from "../utils/conversationHelper.js";

const MAX_MESSAGE_LIMIT = 100;
const isValidObjectId = (value) => mongoose.isValidObjectId(value);
const areValidObjectIds = (values) =>
  Array.isArray(values) && values.every((value) => mongoose.isValidObjectId(value));

export const createConversation = async (req, res) => {
  try {
    const { type, name, memberIds } = req.body;
    const userId = req.user._id;

    if (!type || !memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({
        message: "Loại cuộc trò chuyện và danh sách thành viên là bắt buộc.",
      });
    }

    if (!areValidObjectIds(memberIds)) {
      return res.status(400).json({ message: "Danh sách thành viên không hợp lệ." });
    }

    let conversation;

    if (type === "direct") {
      if (memberIds.length !== 1) {
        return res.status(400).json({
          message: "Cuộc trò chuyện trực tiếp chỉ được phép có một người nhận.",
        });
      }

      conversation = await findOrCreateDirectConversation({
        userId,
        otherUserId: memberIds[0],
      });
    }

    if (type === "group") {
      if (!name) {
        return res.status(400).json({ message: "Tên nhóm là bắt buộc." });
      }

      conversation = new Conversation({
        type: "group",
        participants: [
          { userId, joinedAt: new Date() },
          ...memberIds.map((id) => ({ userId: id, joinedAt: new Date() })),
        ],
        group: {
          name,
          createdBy: userId,
        },
        lastMessageAt: new Date(),
      });

      await conversation.save();
    }

    if (!conversation) {
      return res.status(400).json({ message: "Loại cuộc trò chuyện không hợp lệ." });
    }

    await conversation.populate([
      { path: "participants.userId", select: "displayName avatarUrl" },
      { path: "seenBy", select: "displayName avatarUrl" },
      { path: "lastMessage.senderId", select: "displayName avatarUrl" },
    ]);

    return res.status(201).json({ conversation });
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
      .populate({
        path: "seenBy",
        select: "displayName avatarUrl",
      });

    const formattedConversations = conversations.map((conversation) => {
      const participants = (conversation.participants || []).map((participant) => ({
        _id: participant.userId?._id,
        displayName: participant.userId?.displayName,
        avatarUrl: participant.userId?.avatarUrl ?? null,
        joinedAt: participant.joinedAt,
      }));

      return {
        ...conversation.toObject(),
        unreadCounts: conversation.unreadCounts
          ? Object.fromEntries(conversation.unreadCounts)
          : {},
        participants,
      };
    });

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
      return res.status(400).json({ message: "Id cuộc trò chuyện không hợp lệ." });
    }

    if (!Number.isInteger(parsedLimit) || parsedLimit <= 0) {
      return res.status(400).json({ message: "Giới hạn truy vấn không hợp lệ." });
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
        return res.status(400).json({ message: "Con trỏ phân trang không hợp lệ." });
      }

      query.createdAt = { $lt: parsedCursor };
    }

    let messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(pageLimit + 1);

    let nextCursor = null;

    if (messages.length > pageLimit) {
      const nextMessage = messages[messages.length - 1];
      nextCursor = nextMessage.createdAt.toISOString();
      messages.pop();
    }

    messages = messages.reverse();

    await markConversationAsRead({ conversationId, userId });

    return res.status(200).json({ messages, nextCursor });
  } catch (error) {
    console.error("Lỗi khi lấy tin nhắn", error);
    return res.status(500).json({ message: "Lỗi hệ thống." });
  }
};
