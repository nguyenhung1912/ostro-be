import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import {
  findOrCreateDirectConversation,
  markConversationAsRead,
} from "../utils/conversationHelper.js";
import { isValidObjectId, areValidObjectIds } from "../utils/validation.js";

const MAX_MESSAGE_LIMIT = 100;

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
        message: "Loai cuoc tro chuyen va danh sach thanh vien la bat buoc.",
      });
    }

    if (!areValidObjectIds(memberIds))
      return res
        .status(400)
        .json({ message: "Danh sach thanh vien khong hop le." });

    const normalizedMemberIds = memberIds.map((memberId) =>
      memberId.toString(),
    );
    const uniqueMemberIds = [...new Set(normalizedMemberIds)];

    if (uniqueMemberIds.length !== normalizedMemberIds.length) {
      return res.status(400).json({
        message: "Danh sach thanh vien khong duoc trung lap.",
      });
    }

    let conversation;

    if (type === "direct") {
      if (uniqueMemberIds.length !== 1)
        return res.status(400).json({
          message: "Cuoc tro chuyen truc tiep chi duoc phep co mot nguoi nhan.",
        });

      if (uniqueMemberIds[0] === userId.toString())
        return res.status(400).json({
          message: "Khong the tao cuoc tro chuyen truc tiep voi chinh minh.",
        });

      conversation = await findOrCreateDirectConversation({
        userId,
        otherUserId: uniqueMemberIds[0],
      });
    }

    if (type === "group") {
      if (!normalizedName)
        return res.status(400).json({ message: "Ten nhom la bat buoc." });

      conversation = new Conversation({
        type: "group",
        participants: [
          { userId, joinedAt: new Date() },
          ...uniqueMemberIds.map((id) => ({
            userId: id,
            joinedAt: new Date(),
          })),
        ],
        group: {
          name: normalizedName,
          createdBy: userId,
        },
        lastMessageAt: new Date(),
      });

      await conversation.save();
    }

    if (!conversation)
      return res
        .status(400)
        .json({ message: "Loai cuoc tro chuyen khong hop le." });

    await conversation.populate([
      { path: "participants.userId", select: "displayName avatarUrl" },
      { path: "seenBy", select: "displayName avatarUrl" },
      { path: "lastMessage.senderId", select: "displayName avatarUrl" },
    ]);

    const participants = (conversation.participants || []).map(
      (participant) => ({
        _id: participant.userId?._id,
        displayName: participant.userId?.displayName,
        avatarUrl: participant.userId?.avatarUrl ?? null,
        joinedAt: participant.joinedAt,
      }),
    );

    const formatted = { ...conversation.toObject(), participants };

    if (type === "group") {
      memberIds.forEach((userId) => {
        io.to(userId).emit("new-group", formatted);
      });
    }

    return res.status(201).json({ conversation: formatted });
  } catch (error) {
    console.error("Loi khi tao cuoc tro chuyen", error);
    return res.status(500).json({ message: "Loi he thong." });
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
      const participants = (conversation.participants || []).map(
        (participant) => ({
          _id: participant.userId?._id,
          displayName: participant.userId?.displayName,
          avatarUrl: participant.userId?.avatarUrl ?? null,
          joinedAt: participant.joinedAt,
        }),
      );

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
    console.error("Loi khi lay danh sach cuoc tro chuyen", error);
    return res.status(500).json({ message: "Loi he thong." });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, cursor } = req.query;
    const userId = req.user._id;
    const parsedLimit = Number.parseInt(limit, 10);

    if (!isValidObjectId(conversationId))
      return res
        .status(400)
        .json({ message: "Id cuoc tro chuyen khong hop le." });

    if (!Number.isInteger(parsedLimit) || parsedLimit <= 0)
      return res
        .status(400)
        .json({ message: "Gioi han truy van khong hop le." });

    const pageLimit = Math.min(parsedLimit, MAX_MESSAGE_LIMIT);
    const hasAccess = await Conversation.exists({
      _id: conversationId,
      "participants.userId": userId,
    });

    if (!hasAccess)
      return res.status(403).json({
        message: "Ban khong co quyen xem tin nhan cua cuoc tro chuyen nay.",
      });

    const query = { conversationId };

    if (cursor) {
      const parsedCursor = new Date(cursor);

      if (Number.isNaN(parsedCursor.getTime()))
        return res
          .status(400)
          .json({ message: "Con tro phan trang khong hop le." });

      query.createdAt = { $lt: parsedCursor };
    }

    let messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(pageLimit + 1);

    let nextCursor = null;

    if (messages.length > pageLimit) {
      messages.pop();
      const nextMessage = messages[messages.length - 1];
      nextCursor = nextMessage.createdAt.toISOString();
    }

    messages = messages.reverse();

    await markConversationAsRead({ conversationId, userId });

    return res.status(200).json({ messages, nextCursor });
  } catch (error) {
    console.error("Loi khi lay tin nhan", error);
    return res.status(500).json({ message: "Loi he thong." });
  }
};

export const getUserConversationsForSocketIO = async (userId) => {
  try {
    const conversations = await Conversation.find(
      { "participants.userId": userId },
      { _id: 1 },
    );

    return conversations.map((c) => c._id.toString());
  } catch (error) {
    console.error("Lỗi khi fetch conversations: ", error);
    return [];
  }
};

export const markAsSeen = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id.toString();

    const conversation = await Conversation.findById(conversationId).lean();

    if (!conversation)
      return res.status(404).json({ message: "Conversation không tồn tại" });

    const last = conversation.lastMessage;

    if (!last)
      return res
        .status(200)
        .json({ message: "Không có tin nhắn để mark as seen" });

    if (last.senderId.toString() === userId)
      return res.status(200).json({ message: "Sender không cần mark as seen" });

    const updated = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $addToSet: { seenBy: userId },
        $set: { [`unreadCounts.${userId}`]: 0 },
      },
      {
        new: true,
      },
    );

    io.to(conversationId).emit("read-message", {
      conversation: updated,
      lastMessage: {
        _id: updated?.lastMessage._id,
        content: updated?.lastMessage.content,
        createdAt: updated?.lastMessage.createdAt,
        sender: {
          _id: updated?.lastMessage.senderId,
        },
      },
    });

    return res.status(200).json({
      message: "Marked as seen",
      seenBy: updated?.seenBy || [],
      myUnreadCount: updated?.unreadCounts[userId] || 0,
    });
  } catch (error) {
    console.error("Lỗi khi mark as seen", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
