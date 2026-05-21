import { aiService } from "../services/aiService.js";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";

const fetchRecentMessages = async (conversationId, limit = 50) => {
  const messages = await Message.find({ conversationId, isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("senderId", "displayName username")
    .lean();

  return messages.reverse(); // Reverse to get chronological order
};

export const summarizeConversation = async (req, res) => {
  try {
    const { conversationId } = req.body;

    // Validate conversation access here if necessary (check if req.user._id is in conversation.participants)
    const conversation = await Conversation.findOne({
      _id: conversationId,
      "participants.userId": req.user._id,
    });

    if (!conversation) {
      return res
        .status(404)
        .json({
          message:
            "Không tìm thấy cuộc hội thoại hoặc bạn không có quyền truy cập.",
        });
    }

    const messages = await fetchRecentMessages(conversationId);
    if (!messages || messages.length === 0) {
      return res
        .status(400)
        .json({ message: "Không có tin nhắn nào để tóm tắt." });
    }

    const summary = await aiService.summarizeConversation(messages);
    return res.status(200).json({ summary });
  } catch (error) {
    console.error("Lỗi summarizeConversation:", error);
    return res
      .status(500)
      .json({ message: "Lỗi khi gọi AI service", error: error.message });
  }
};

export const generateGroupTitle = async (req, res) => {
  try {
    const { conversationId } = req.body;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      "participants.userId": req.user._id,
    });

    if (!conversation) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy cuộc hội thoại." });
    }

    const messages = await fetchRecentMessages(conversationId);
    if (!messages || messages.length === 0) {
      return res
        .status(400)
        .json({ message: "Không có tin nhắn nào để tạo tên." });
    }

    const title = await aiService.generateGroupTitle(messages);
    return res.status(200).json({ title });
  } catch (error) {
    console.error("Lỗi generateGroupTitle:", error);
    return res
      .status(500)
      .json({ message: "Lỗi khi gọi AI service", error: error.message });
  }
};

export const extractActionItems = async (req, res) => {
  try {
    const { conversationId } = req.body;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      "participants.userId": req.user._id,
    });

    if (!conversation) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy cuộc hội thoại." });
    }

    const messages = await fetchRecentMessages(conversationId);
    if (!messages || messages.length === 0) {
      return res
        .status(400)
        .json({ message: "Không có tin nhắn nào để trích xuất công việc." });
    }

    const actionItems = await aiService.extractActionItems(messages);
    return res.status(200).json({ actionItems });
  } catch (error) {
    console.error("Lỗi extractActionItems:", error);
    return res
      .status(500)
      .json({ message: "Lỗi khi gọi AI service", error: error.message });
  }
};

export const improveMessage = async (req, res) => {
  try {
    const { content, tone } = req.body;
    if (!content) {
      return res.status(400).json({ message: "Nội dung tin nhắn trống." });
    }

    const improved = await aiService.improveMessage(content, tone);
    return res.status(200).json({ improved });
  } catch (error) {
    console.error("Lỗi improveMessage:", error);
    return res
      .status(500)
      .json({ message: "Lỗi khi gọi AI service", error: error.message });
  }
};

export const translateMessage = async (req, res) => {
  try {
    const { content, targetLanguage } = req.body;
    if (!content || !targetLanguage) {
      return res
        .status(400)
        .json({ message: "Thiếu nội dung hoặc ngôn ngữ đích." });
    }

    const translated = await aiService.translateMessage(
      content,
      targetLanguage,
    );
    return res.status(200).json({ translated });
  } catch (error) {
    console.error("Lỗi translateMessage:", error);
    return res
      .status(500)
      .json({ message: "Lỗi khi gọi AI service", error: error.message });
  }
};
