import {
  findOrCreateDirectConversation,
  CONVERSATION_POPULATE_PATHS,
} from "../utils/conversationHelper.js";
import { validateAndNormalizeMemberIds } from "../utils/validation.js";
import { formatParticipants } from "./conversationController.js";
import { io } from "../socket/index.js";

export const createDirectConversation = async (req, res) => {
  try {
    const { memberIds } = req.body;
    const userId = req.user._id;

    const validation = validateAndNormalizeMemberIds(memberIds);
    if (!validation.valid) {
      return res
        .status(validation.status)
        .json({ message: validation.message });
    }

    const { uniqueMemberIds } = validation;

    if (uniqueMemberIds.length !== 1) {
      return res.status(400).json({
        message: "Cuộc trò chuyện trực tiếp chỉ được phép có một người nhận.",
      });
    }

    if (uniqueMemberIds[0] === userId.toString()) {
      return res.status(400).json({
        message: "Không thể tạo cuộc trò chuyện trực tiếp với chính mình.",
      });
    }

    const conversation = await findOrCreateDirectConversation({
      userId,
      otherUserId: uniqueMemberIds[0],
    });

    await conversation.populate(CONVERSATION_POPULATE_PATHS);

    const formatted = {
      ...conversation.toObject(),
      participants: formatParticipants(conversation.participants),
    };

    io.to(uniqueMemberIds[0]).emit("new-group", formatted);

    return res.status(201).json({ conversation: formatted });
  } catch (error) {
    console.error("Lỗi khi tạo cuộc trò chuyện trực tiếp", error);
    return res.status(500).json({ message: "Lỗi hệ thống." });
  }
};
