import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Session from "../models/Session.js";
import Friend from "../models/Friend.js";
import FriendRequest from "../models/FriendRequest.js";

export const deleteUserAccountData = async (userId) => {
  const directConversations = await Conversation.find({
    type: "direct",
    "participants.userId": userId,
  }).select("_id");
  const directConversationIds = directConversations.map((c) => c._id);

  const groupConversations = await Conversation.find({
    type: "group",
    "participants.userId": userId,
  });

  const groupUpdates = groupConversations.map(async (group) => {
    group.participants = group.participants.filter(
      (p) => p.userId.toString() !== userId.toString(),
    );

    if (group.participants.length === 0) {
      await Conversation.findByIdAndDelete(group._id);
      await Message.deleteMany({ conversationId: group._id });
    } else {
      if (
        group.group.createdBy &&
        group.group.createdBy.toString() === userId.toString()
      ) {
        const sorted = [...group.participants].sort(
          (a, b) =>
            new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime(),
        );
        group.group.createdBy = sorted[0].userId;
      }
      await group.save();
    }
  });

  await Promise.all([
    ...groupUpdates,
    Session.deleteMany({ userId }),
    Friend.deleteMany({ $or: [{ userA: userId }, { userB: userId }] }),
    FriendRequest.deleteMany({ $or: [{ from: userId }, { to: userId }] }),
    Message.deleteMany({ conversationId: { $in: directConversationIds } }),
    Conversation.deleteMany({ _id: { $in: directConversationIds } }),
    User.findByIdAndDelete(userId),
  ]);
};
