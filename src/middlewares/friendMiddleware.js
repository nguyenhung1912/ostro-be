import Conversation from "../models/Conversation.js";
import Friend from "../models/Friend.js";

const pair = (a, b) => (a < b ? [a, b] : [b, a]);

export const checkFriendShip = async (req, res, next) => {
  try {
    const me = req.user._id.toString();
    const recipientId = req.body?.recipientId ?? null;
    const memeberIds = req.body?.memeberIds ?? [];

    if (!recipientId && memeberIds.length === 0) {
      return res
        .status(400)
        .json({ message: "Cần cung cấp recipientId hoặc memberId" });
    }

    if (recipientId) {
      const [userA, userB] = pair(me, recipientId);
      const isFriend = await Friend.findOne({ userA, userB });

      if (!isFriend) {
        return res
          .status(403)
          .json({ message: "Bạn chưa kết bạn với người này" });
      }

      return next();
    }

    const friendChecks = memeberIds.map(async (memeberId) => {
      const [userA, userB] = pair(me, memeberId);
      const friend = await Friend.findOne({ userA, userB });
      return friend ? null : memeberId;
    });

    const results = await Promise.all(friendChecks);
    const notFriends = results.filter(Boolean);

    if (notFriends.length > 0) {
      return res
        .status(403)
        .json({ message: "Bạn chỉ có thể thêm bạn bè vào nhóm ", notFriends });
    }

    next();
  } catch (error) {
    console.error("Lỗi xảy ra khi checkFriendShip: ", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const checkGroupMemeberShip = async (req, res, next) => {
  try {
    const { conversationId } = req.body;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy cuộc trò chuyện" });
    }

    const isMember = conversation.participants.some(
      (p) => p.userId.toString() === userId.toString(),
    );

    if (!isMember)
      return res.status(403).json({ message: "Bạn không ở trong nhóm này" });

    req.conversation = conversation;
    next();
  } catch (error) {
    console.error("Lỗi checkGroupMemeberShip:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
