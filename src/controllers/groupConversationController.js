import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { io } from "../socket/index.js";
import { areValidObjectIds, isValidObjectId } from "../utils/validation.js";
import { formatParticipants } from "./conversationController.js";

export const createGroupConversation = async (req, res) => {
  try {
    const { name, memberIds } = req.body;
    const userId = req.user._id;
    const normalizedName = typeof name === "string" ? name.trim() : "";

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res
        .status(400)
        .json({ message: "Danh sách thành viên là bắt buộc." });
    }

    if (!areValidObjectIds(memberIds)) {
      return res
        .status(400)
        .json({ message: "Danh sách thành viên không hợp lệ." });
    }

    const normalizedMemberIds = memberIds.map((id) => id.toString());
    const uniqueMemberIds = [...new Set(normalizedMemberIds)];

    if (uniqueMemberIds.length !== normalizedMemberIds.length) {
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

    await conversation.populate([
      { path: "participants.userId", select: "displayName avatarUrl" },
      { path: "seenBy", select: "displayName avatarUrl" },
      { path: "lastMessage.senderId", select: "displayName avatarUrl" },
    ]);

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

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res
        .status(400)
        .json({ message: "Danh sách thành viên cần thêm là bắt buộc." });
    }

    if (!areValidObjectIds(memberIds)) {
      return res
        .status(400)
        .json({ message: "Danh sách thành viên không hợp lệ." });
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

    const existingUserIds = new Set(
      conversation.participants.map((p) => p.userId.toString()),
    );
    const newMemberIds = memberIds.filter(
      (id) => !existingUserIds.has(id.toString()),
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

    await conversation.populate([
      { path: "participants.userId", select: "displayName avatarUrl" },
      { path: "seenBy", select: "displayName avatarUrl" },
      { path: "lastMessage.senderId", select: "displayName avatarUrl" },
    ]);

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
      return res
        .status(404)
        .json({
          message:
            "Không tìm thấy nhóm trò chuyện hoặc bạn không phải thành viên.",
        });
    }

    if (conversation.group.createdBy.toString() === userId.toString()) {
      return res
        .status(400)
        .json({
          message:
            "Trưởng nhóm không thể rời nhóm, vui lòng chuyển quyền hoặc giải tán nhóm.",
        });
    }

    conversation.participants = conversation.participants.filter(
      (p) => p.userId.toString() !== userId.toString(),
    );

    // Create system message
    const systemMessage = new Message({
      conversationId: conversation._id,
      senderId: userId,
      content: `${req.user.displayName || req.user.username} đã rời nhóm.`,
      isSystem: true,
    });

    await Promise.all([conversation.save(), systemMessage.save()]);

    await systemMessage.populate("senderId", "displayName avatarUrl");

    // Broadcast to remaining members
    conversation.participants.forEach((p) => {
      io.to(p.userId.toString()).emit("new-message", systemMessage);
      io.to(p.userId.toString()).emit("member-left", {
        conversationId,
        userId,
      });
    });

    return res.status(200).json({ message: "Đã rời nhóm thành công." });
  } catch (error) {
    console.error("Lỗi khi rời nhóm", error);
    return res.status(500).json({ message: "Lỗi hệ thống." });
  }
};
