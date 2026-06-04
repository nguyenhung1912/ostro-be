import Conversation from "../models/Conversation.js";

export const CONVERSATION_POPULATE_PATHS = [
  { path: "participants.userId", select: "displayName avatarUrl" },
  { path: "seenBy", select: "displayName avatarUrl" },
  { path: "lastMessage.senderId", select: "displayName avatarUrl" },
];

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
    const participantIds = existingConversation.participants.map((p) =>
      p.userId.toString(),
    );
    let isModified = false;

    if (!participantIds.includes(userId.toString())) {
      existingConversation.participants.push({ userId, joinedAt: now });
      isModified = true;
    }
    if (!participantIds.includes(otherUserId.toString())) {
      existingConversation.participants.push({
        userId: otherUserId,
        joinedAt: now,
      });
      isModified = true;
    }

    if (existingConversation.directKey !== directKey) {
      existingConversation.directKey = directKey;
      isModified = true;
    }

    if (isModified) {
      try {
        await existingConversation.save();
      } catch (error) {
        if (error?.code === 11000) {
          return Conversation.findOne(
            buildDirectConversationQuery(userId, otherUserId),
          );
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
