import Conversation from "../models/Conversation.js";

const DIRECT_PARTICIPANT_COUNT = 2;
const buildDirectKey = (userId, otherUserId) =>
  [userId.toString(), otherUserId.toString()].sort().join(":");

const buildLegacyDirectConversationQuery = (userId, otherUserId) => ({
  type: "direct",
  "participants.userId": { $all: [userId, otherUserId] },
  $expr: { $eq: [{ $size: "$participants" }, DIRECT_PARTICIPANT_COUNT] },
});

const buildDirectConversationQuery = (userId, otherUserId) => ({
  type: "direct",
  directKey: buildDirectKey(userId, otherUserId),
});

export const findOrCreateDirectConversation = async ({
  userId,
  otherUserId,
}) => {
  const directKey = buildDirectKey(userId, otherUserId);
  const now = new Date();
  const existingConversation = await Conversation.findOne({
    $or: [
      buildDirectConversationQuery(userId, otherUserId),
      buildLegacyDirectConversationQuery(userId, otherUserId),
    ],
  }).sort({ createdAt: 1 });

  if (existingConversation) {
    if (existingConversation.directKey !== directKey) {
      try {
        existingConversation.directKey = directKey;
        await existingConversation.save();
      } catch (error) {
        if (error?.code === 11000) {
          return Conversation.findOne(buildDirectConversationQuery(userId, otherUserId));
        }

        throw error;
      }
    }

    return existingConversation;
  }

  return Conversation.findOneAndUpdate(
    buildDirectConversationQuery(userId, otherUserId),
    {
      $setOnInsert: {
        type: "direct",
        directKey,
        participants: [
          { userId, joinedAt: now },
          { userId: otherUserId, joinedAt: now },
        ],
        lastMessageAt: now,
        unreadCounts: new Map(),
      },
    },
    {
      upsert: true,
      setDefaultsOnInsert: true,
      returnDocument: "after",
    },
  );
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
