import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { findOrCreateDirectConversation } from "../utils/conversationHelper.js";
import {
  emitNewMessage,
  updateConversationAfterCreateMessage,
} from "../utils/messageHelper.js";
import { isValidObjectId } from "../utils/validation.js";
import { io } from "../socket/index.js";

const normalizeMessageField = (value) =>
  typeof value === "string" ? value.trim() : "";

export const sendDirectMessage = async (req, res) => {
  try {
    const { recipientId, content, conversationId, imgUrl } = req.body;
    const senderId = req.user._id;
    const normalizedContent = normalizeMessageField(content);
    const normalizedImgUrl = normalizeMessageField(imgUrl);

    if (!normalizedContent && !normalizedImgUrl) {
      return res
        .status(400)
        .json({ message: "Nội dung tin nhắn hoặc hình ảnh là bắt buộc." });
    }

    let conversation;

    if (conversationId) {
      if (!isValidObjectId(conversationId)) {
        return res
          .status(400)
          .json({ message: "Id cuộc trò chuyện không hợp lệ." });
      }

      conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy cuộc trò chuyện." });
      }

      if (conversation.type !== "direct") {
        return res.status(400).json({
          message: "Cuộc trò chuyện này không phải cuộc trò chuyện trực tiếp.",
        });
      }

      const isParticipant = conversation.participants.some(
        (p) => p.userId.toString() === senderId.toString(),
      );

      if (!isParticipant) {
        return res
          .status(403)
          .json({ message: "Bạn không thuộc cuộc trò chuyện này." });
      }
    } else {
      if (!isValidObjectId(recipientId)) {
        return res.status(400).json({ message: "Id người nhận không hợp lệ." });
      }

      conversation = await findOrCreateDirectConversation({
        userId: senderId,
        otherUserId: recipientId,
      });
    }

    const message = await Message.create({
      conversationId: conversation._id,
      senderId,
      content: normalizedContent || undefined,
      imgUrl: normalizedImgUrl || undefined,
    });

    updateConversationAfterCreateMessage(conversation, message, senderId);
    await conversation.save();
    emitNewMessage(io, conversation, message);

    return res.status(201).json({ message });
  } catch (error) {
    console.error("Lỗi khi gửi tin nhắn trực tiếp", error);
    return res.status(500).json({ message: "Lỗi hệ thống." });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { content, imgUrl } = req.body;
    const senderId = req.user._id;
    const conversation = req.conversation; // set bởi checkGroupMembership middleware
    const normalizedContent = normalizeMessageField(content);
    const normalizedImgUrl = normalizeMessageField(imgUrl);

    if (!normalizedContent && !normalizedImgUrl) {
      return res
        .status(400)
        .json({ message: "Nội dung tin nhắn hoặc hình ảnh là bắt buộc." });
    }

    const message = await Message.create({
      conversationId: conversation._id,
      senderId,
      content: normalizedContent || undefined,
      imgUrl: normalizedImgUrl || undefined,
    });

    updateConversationAfterCreateMessage(conversation, message, senderId);
    await conversation.save();
    emitNewMessage(io, conversation, message);

    return res.status(201).json({ message });
  } catch (error) {
    console.error("Lỗi khi gửi tin nhắn nhóm", error);
    return res.status(500).json({ message: "Lỗi hệ thống." });
  }
};
