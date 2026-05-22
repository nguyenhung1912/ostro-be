import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { findOrCreateDirectConversation } from "../utils/conversationHelper.js";
import {
  emitNewMessage,
  updateConversationAfterCreateMessage,
} from "../utils/messageHelper.js";
import { uploadImageFromBuffer } from "../middlewares/uploadMiddleware.js";
import { isValidObjectId } from "../utils/validation.js";
import { io } from "../socket/index.js";

const normalizeMessageField = (value) =>
  typeof value === "string" ? value.trim() : "";

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export const uploadMessageImage = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res
        .status(400)
        .json({ message: "Không có file nào được tải lên." });
    }

    if (!allowedImageTypes.has(file.mimetype)) {
      return res
        .status(400)
        .json({ message: "Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP." });
    }

    const result = await uploadImageFromBuffer(file.buffer, {
      folder: "ostro_chat/messages",
      transformation: [
        {
          width: 1200,
          height: 1200,
          crop: "limit",
          quality: "auto",
          fetch_format: "auto",
        },
      ],
    });

    return res.status(201).json({
      imgUrl: result.secure_url,
      imageId: result.public_id,
    });
  } catch (error) {
    console.error("Lỗi khi tải lên ảnh tin nhắn", error);
    return res.status(500).json({ message: "Tải ảnh tin nhắn thất bại." });
  }
};

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

export const recallMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    if (!isValidObjectId(messageId)) {
      return res.status(400).json({ message: "Id tin nhắn không hợp lệ." });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Không tìm thấy tin nhắn." });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Bạn chỉ có thể thu hồi tin nhắn của mình." });
    }

    const conversation = await Conversation.findOne({
      _id: message.conversationId,
      "participants.userId": userId,
    });

    if (!conversation) {
      return res
        .status(403)
        .json({ message: "Bạn không thuộc cuộc trò chuyện này." });
    }

    if (!message.isDeleted) {
      message.isDeleted = true;
      message.deletedAt = new Date();
      message.deletedBy = userId;
      await message.save();
    }

    if (conversation.lastMessage?._id?.toString() === message._id.toString()) {
      conversation.lastMessage.content = "Tin nhắn đã bị thu hồi";
      await conversation.save();
    }

    io.to(message.conversationId.toString()).emit("message-recalled", {
      messageId: message._id,
      conversationId: message.conversationId,
      deletedAt: message.deletedAt,
      deletedBy: userId,
      lastMessage: conversation.lastMessage,
    });

    return res.status(200).json({ message });
  } catch (error) {
    console.error("Lỗi khi thu hồi tin nhắn", error);
    return res.status(500).json({ message: "Lỗi hệ thống." });
  }
};
