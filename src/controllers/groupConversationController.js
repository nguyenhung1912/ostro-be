import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { io } from "../socket/index.js";
import {
  isValidObjectId,
  validateAndNormalizeMemberIds,
} from "../utils/validation.js";
import { formatParticipants } from "./conversationController.js";
import { CONVERSATION_POPULATE_PATHS } from "../utils/conversationHelper.js";
import { updateConversationAfterCreateMessage } from "../utils/messageHelper.js";

export const createGroupConversation = async (req, res) => {
  try {
    const { name, memberIds } = req.body;
    const userId = req.user._id;
    const normalizedName = typeof name === "string" ? name.trim() : "";

    const validation = validateAndNormalizeMemberIds(memberIds);
    if (!validation.valid) {
      return res
        .status(validation.status)
        .json({ message: validation.message });
    }

    const { uniqueMemberIds } = validation;

    if (uniqueMemberIds.length !== memberIds.length) {
      return res
        .status(400)
        .json({ message: "Danh sách thành viên không được trùng lặp." });
    }

    if (!normalizedName) {
      return res.status(400).json({ message: "Tên nhóm là bắt buộc." });
    }

    const now = new Date();
    const conversation = new Conversation({
      type: "group",
      participants: [
        { userId, joinedAt: now },
        ...uniqueMemberIds.map((id) => ({ userId: id, joinedAt: now })),
      ],
      group: { name: normalizedName, createdBy: userId },
      lastMessageAt: now,
    });

    await conversation.save();

    await conversation.populate(CONVERSATION_POPULATE_PATHS);

    const formatted = {
      ...conversation.toObject(),
      participants: formatParticipants(conversation.participants),
    };

    uniqueMemberIds.forEach((memberId) => {
      io.to(memberId).emit("new-group", formatted);
    });

    return res.status(201).json({ conversation: formatted });
  } catch (error) {
    console.error("Lỗi khi tạo nhóm trò chuyện", error);
    return res.status(500).json({ message: "Lỗi hệ thống." });
  }
};

export const addGroupMembers = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { memberIds } = req.body;
    const userId = req.user._id;

    if (!isValidObjectId(conversationId)) {
      return res
        .status(400)
        .json({ message: "Id cuộc trò chuyện không hợp lệ." });
    }

    const validation = validateAndNormalizeMemberIds(
      memberIds,
      "Danh sách thành viên cần thêm là bắt buộc.",
    );
    if (!validation.valid) {
      return res
        .status(validation.status)
        .json({ message: validation.message });
    }

    const { uniqueMemberIds } = validation;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      type: "group",
      "participants.userId": userId,
    });

    if (!conversation) {
      return res.status(404).json({
        message:
          "Không tìm thấy nhóm trò chuyện hoặc bạn không phải thành viên.",
      });
    }

    const existingUserIds = new Set(
      conversation.participants.map((p) => p.userId.toString()),
    );
    const newMemberIds = uniqueMemberIds.filter(
      (id) => !existingUserIds.has(id),
    );

    if (newMemberIds.length === 0) {
      return res.status(400).json({
        message: "Tất cả người dùng được chọn đã là thành viên của nhóm.",
      });
    }

    const now = new Date();
    newMemberIds.forEach((id) => {
      conversation.participants.push({ userId: id, joinedAt: now });
    });

    await conversation.save();

    await conversation.populate(CONVERSATION_POPULATE_PATHS);

    const formatted = {
      ...conversation.toObject(),
      unreadCounts: conversation.unreadCounts
        ? Object.fromEntries(conversation.unreadCounts)
        : {},
      participants: formatParticipants(conversation.participants),
    };

    newMemberIds.forEach((memberId) => {
      io.to(memberId.toString()).emit("new-group", formatted);
    });

    conversation.participants.forEach((p) => {
      const pid = p.userId._id ? p.userId._id.toString() : p.userId.toString();
      io.to(pid).emit("rename-conversation", { conversation: formatted });
    });

    return res.status(200).json({ conversation: formatted });
  } catch (error) {
    console.error("Lỗi khi thêm thành viên vào nhóm", error);
    return res.status(500).json({ message: "Lỗi hệ thống." });
  }
};

export const leaveGroup = async (req, res) => {
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
      type: "group",
      "participants.userId": userId,
    });

    if (!conversation) {
      return res.status(404).json({
        message:
          "Không tìm thấy nhóm trò chuyện hoặc bạn không phải thành viên.",
      });
    }

    if (conversation.group.createdBy.toString() === userId.toString()) {
      return res.status(400).json({
        message:
          "Trưởng nhóm không thể rời nhóm, vui lòng chuyển quyền hoặc giải tán nhóm.",
      });
    }

    conversation.participants = conversation.participants.filter(
      (p) => p.userId.toString() !== userId.toString(),
    );

    // create system message
    const systemMessage = new Message({
      conversationId: conversation._id,
      senderId: userId,
      content: `${req.user.displayName || req.user.username} đã rời nhóm.`,
      isSystem: true,
    });

    updateConversationAfterCreateMessage(conversation, systemMessage, userId);

    await Promise.all([conversation.save(), systemMessage.save()]);

    await Promise.all([
      systemMessage.populate("senderId", "displayName avatarUrl"),
      conversation.populate(CONVERSATION_POPULATE_PATHS),
    ]);

    const formatted = {
      ...conversation.toObject(),
      unreadCounts: conversation.unreadCounts
        ? Object.fromEntries(conversation.unreadCounts)
        : {},
      participants: formatParticipants(conversation.participants),
    };

    // broadcast to remaining members in the room conversationId
    io.to(conversation._id.toString()).emit("new-message", {
      message: systemMessage,
      conversation: {
        _id: conversation._id,
        lastMessage: conversation.lastMessage,
        lastMessageAt: conversation.lastMessageAt,
      },
      unreadCounts: Object.fromEntries(conversation.unreadCounts),
    });

    conversation.participants.forEach((p) => {
      const pid = p.userId._id ? p.userId._id.toString() : p.userId.toString();
      io.to(pid).emit("rename-conversation", { conversation: formatted });
    });

    return res.status(200).json({ message: "Đã rời nhóm thành công." });
  } catch (error) {
    console.error("Lỗi khi rời nhóm", error);
    return res.status(500).json({ message: "Lỗi hệ thống." });
  }
};
