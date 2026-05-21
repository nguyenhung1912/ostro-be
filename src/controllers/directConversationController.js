import { findOrCreateDirectConversation } from "../utils/conversationHelper.js";
import { areValidObjectIds } from "../utils/validation.js";
import { formatParticipants } from "./conversationController.js";

export const createDirectConversation = async (req, res) => {
  try {
    const { memberIds } = req.body;
    const userId = req.user._id;

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

    if (uniqueMemberIds.length !== 1) {
      return res
        .status(400)
        .json({
          message: "Cuộc trò chuyện trực tiếp chỉ được phép có một người nhận.",
        });
    }

    if (uniqueMemberIds[0] === userId.toString()) {
      return res
        .status(400)
        .json({
          message: "Không thể tạo cuộc trò chuyện trực tiếp với chính mình.",
        });
    }

    const conversation = await findOrCreateDirectConversation({
      userId,
      otherUserId: uniqueMemberIds[0],
    });

    await conversation.populate([
      { path: "participants.userId", select: "displayName avatarUrl" },
      { path: "seenBy", select: "displayName avatarUrl" },
      { path: "lastMessage.senderId", select: "displayName avatarUrl" },
    ]);

    const formatted = {
      ...conversation.toObject(),
      participants: formatParticipants(conversation.participants),
    };

    return res.status(201).json({ conversation: formatted });
  } catch (error) {
    console.error("Lỗi khi tạo cuộc trò chuyện trực tiếp", error);
    return res.status(500).json({ message: "Lỗi hệ thống." });
  }
};
