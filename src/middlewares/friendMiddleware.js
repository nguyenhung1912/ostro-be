import Conversation from "../models/Conversation.js";
import Friend from "../models/Friend.js";
import { isValidObjectId } from "../utils/validation.js";

const pair = (a, b) => (a < b ? [a, b] : [b, a]);

export const checkFriendship = async (req, res, next) => {
  try {
    const me = req.user._id.toString();
    const conversationId = req.body?.conversationId ?? null;
    const recipientId = req.body?.recipientId ?? null;
    const memberIds = req.body?.memberIds ?? [];

    if (conversationId && !recipientId && memberIds.length === 0) {
      return next();
    }

    if (!recipientId && memberIds.length === 0) {
      return res.status(400).json({
        message: "Can cung cap recipientId hoac memberIds.",
      });
    }

    if (recipientId) {
      if (!isValidObjectId(recipientId)) {
        return res.status(400).json({ message: "Id nguoi nhan khong hop le." });
      }

      if (recipientId === me) {
        return res.status(400).json({
          message: "Khong the thao tac voi chinh minh.",
        });
      }

      const [userA, userB] = pair(me, recipientId);
      const isFriend = await Friend.exists({ userA, userB });

      if (!isFriend) {
        return res.status(403).json({
          message: "Ban chua ket ban voi nguoi dung nay.",
        });
      }

      return next();
    }

    if (!memberIds.every((memberId) => isValidObjectId(memberId))) {
      return res.status(400).json({ message: "Danh sach thanh vien khong hop le." });
    }

    if (memberIds.some((memberId) => memberId === me)) {
      return res.status(400).json({
        message: "Khong the them chinh minh vao danh sach thanh vien.",
      });
    }

    const friendshipChecks = memberIds.map(async (memberId) => {
      const [userA, userB] = pair(me, memberId);
      const friendship = await Friend.exists({ userA, userB });
      return friendship ? null : memberId;
    });

    const results = await Promise.all(friendshipChecks);
    const notFriends = results.filter(Boolean);

    if (notFriends.length > 0) {
      return res.status(403).json({
        message: "Ban chi co the them ban be vao nhom.",
        notFriends,
      });
    }

    return next();
  } catch (error) {
    console.error("Loi khi kiem tra quan he ban be", error);
    return res.status(500).json({ message: "Loi he thong." });
  }
};

export const checkGroupMembership = async (req, res, next) => {
  try {
    const { conversationId } = req.body;
    const userId = req.user._id;

    if (!isValidObjectId(conversationId)) {
      return res.status(400).json({ message: "Id cuoc tro chuyen khong hop le." });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Khong tim thay cuoc tro chuyen." });
    }

    if (conversation.type !== "group") {
      return res.status(400).json({
        message: "Cuoc tro chuyen nay khong phai nhom.",
      });
    }

    const isMember = conversation.participants.some(
      (participant) => participant.userId.toString() === userId.toString(),
    );

    if (!isMember) {
      return res.status(403).json({
        message: "Ban khong thuoc nhom tro chuyen nay.",
      });
    }

    req.conversation = conversation;
    return next();
  } catch (error) {
    console.error("Loi khi kiem tra thanh vien nhom", error);
    return res.status(500).json({ message: "Loi he thong." });
  }
};
