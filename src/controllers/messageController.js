import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { findOrCreateDirectConversation } from "../utils/conversationHelper.js";
import { updateConversationAfterCreateMessage } from "../utils/messageHelper.js";
import { isValidObjectId } from "../utils/validation.js";

export const sendDirectMessage = async (req, res) => {
  try {
    const { recipientId, content, conversationId } = req.body;
    const senderId = req.user._id;

    if (!content) {
      return res.status(400).json({ message: "Nội dung tin nhắn là bắt buộc." });
    }

    let conversation;

    if (conversationId) {
      if (!isValidObjectId(conversationId)) {
        return res.status(400).json({ message: "Id cuộc trò chuyện không hợp lệ." });
      }

      conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        return res.status(404).json({ message: "Không tìm thấy cuộc trò chuyện." });
      }

      if (conversation.type !== "direct") {
        return res.status(400).json({
          message: "Cuộc trò chuyện này không phải cuộc trò chuyện trực tiếp.",
        });
      }

      const isParticipant = conversation.participants.some(
        (participant) => participant.userId.toString() === senderId.toString(),
      );

      if (!isParticipant) {
        return res.status(403).json({
          message: "Bạn không thuộc cuộc trò chuyện này.",
        });
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
      content,
    });

    updateConversationAfterCreateMessage(conversation, message, senderId);
    await conversation.save();

    return res.status(201).json({ message });
  } catch (error) {
    console.error("Lỗi khi gửi tin nhắn trực tiếp", error);
    return res.status(500).json({ message: "Lỗi hệ thống." });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    const senderId = req.user._id;
    const conversation = req.conversation;

    if (!content) {
      return res.status(400).json({ message: "Nội dung tin nhắn là bắt buộc." });
    }

    const message = await Message.create({
      conversationId,
      senderId,
      content,
    });

    updateConversationAfterCreateMessage(conversation, message, senderId);
    await conversation.save();

    return res.status(201).json({ message });
  } catch (error) {
    console.error("Lỗi khi gửi tin nhắn nhóm", error);
    return res.status(500).json({ message: "Lỗi hệ thống." });
  }
};
