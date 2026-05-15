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
        .json({ message: "Noi dung tin nhan hoac hinh anh la bat buoc." });
    }

    let conversation;

    if (conversationId) {
      if (!isValidObjectId(conversationId)) {
        return res
          .status(400)
          .json({ message: "Id cuoc tro chuyen khong hop le." });
      }

      conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        return res
          .status(404)
          .json({ message: "Khong tim thay cuoc tro chuyen." });
      }

      if (conversation.type !== "direct") {
        return res.status(400).json({
          message: "Cuoc tro chuyen nay khong phai cuoc tro chuyen truc tiep.",
        });
      }

      const isParticipant = conversation.participants.some(
        (participant) => participant.userId.toString() === senderId.toString(),
      );

      if (!isParticipant) {
        return res.status(403).json({
          message: "Ban khong thuoc cuoc tro chuyen nay.",
        });
      }
    } else {
      if (!isValidObjectId(recipientId)) {
        return res.status(400).json({ message: "Id nguoi nhan khong hop le." });
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
    console.error("Loi khi gui tin nhan truc tiep", error);
    return res.status(500).json({ message: "Loi he thong." });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { conversationId, content, imgUrl } = req.body;
    const senderId = req.user._id;
    const conversation = req.conversation;
    const normalizedContent = normalizeMessageField(content);
    const normalizedImgUrl = normalizeMessageField(imgUrl);

    if (!normalizedContent && !normalizedImgUrl) {
      return res
        .status(400)
        .json({ message: "Noi dung tin nhan hoac hinh anh la bat buoc." });
    }

    const message = await Message.create({
      conversationId,
      senderId,
      content: normalizedContent || undefined,
      imgUrl: normalizedImgUrl || undefined,
    });

    updateConversationAfterCreateMessage(conversation, message, senderId);

    await conversation.save();

    emitNewMessage(io, conversation, message);

    return res.status(201).json({ message });
  } catch (error) {
    console.error("Loi khi gui tin nhan nhom", error);
    return res.status(500).json({ message: "Loi he thong." });
  }
};
