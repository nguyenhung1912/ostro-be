import mongoose from "mongoose";

const buildDirectKeyFromParticipants = (participants) => {
  if (!Array.isArray(participants) || participants.length !== 2) {
    return null;
  }

  const ids = participants
    .map((participant) => participant?.userId?.toString?.())
    .filter(Boolean)
    .sort();

  return ids.length === 2 ? ids.join(":") : null;
};

const participantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    nickname: {
      type: String,
      trim: true,
      default: null,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  },
);

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { _id: false },
);

const lastMessageSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId },
    content: {
      type: String,
      default: null,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: false,
  },
);

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["direct", "group"],
      required: true,
    },
    directKey: {
      type: String,
      default: null,
    },
    participants: {
      type: [participantSchema],
      required: true,
      validate: {
        validator: (participants) =>
          Array.isArray(participants) && participants.length > 0,
        message: "Cuộc trò chuyện phải có ít nhất một thành viên",
      },
    },
    group: {
      type: groupSchema,
    },
    lastMessageAt: {
      type: Date,
    },
    seenBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    lastMessage: {
      type: lastMessageSchema,
      default: null,
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
    pinnedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  },
);

conversationSchema.pre("validate", function () {
  this.directKey =
    this.type === "direct"
      ? buildDirectKeyFromParticipants(this.participants)
      : null;
});

conversationSchema.index({
  "participants.userId": 1,
  lastMessageAt: -1,
});

conversationSchema.index(
  { directKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      type: "direct",
      directKey: { $type: "string" },
    },
  },
);

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;
