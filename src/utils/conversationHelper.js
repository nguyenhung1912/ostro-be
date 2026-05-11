import Conversation from "../models/Conversation.js";

const DIRECT_PARTICIPANT_COUNT = 2;

const buildDirectConversationQuery = (userId, otherUserId) => ({
  type: "direct",
  "participants.userId": { $all: [userId, otherUserId] },
  $expr: { $eq: [{ $size: "$participants" }, DIRECT_PARTICIPANT_COUNT] },
});

export const findOrCreateDirectConversation = async ({
  userId,
  otherUserId,
}) => {
  const existingConversation = await Conversation.findOne(
    buildDirectConversationQuery(userId, otherUserId),
  );

  if (existingConversation) {
    return existingConversation;
  }

  return Conversation.create({
    type: "direct",
    participants: [
      { userId, joinedAt: new Date() },
      { userId: otherUserId, joinedAt: new Date() },
    ],
    lastMessageAt: new Date(),
    unreadCounts: new Map(),
  });
};

export const markConversationAsRead = async ({ conversationId, userId }) => {
  const unreadCountPath = `unreadCounts.${userId.toString()}`;

  await Conversation.updateOne(
    {
      _id: conversationId,
      "participants.userId": userId,
    },
    {
      $addToSet: { seenBy: userId },
      $set: { [unreadCountPath]: 0 },
    },
  );
};
