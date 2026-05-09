import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      trim: true,
    },
    imgUrl: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// chặn gửi tin nhắn trống
messageSchema.pre("validate", function () {
  if (!this.content && !this.imgUrl) {
    throw new Error("Message must have content or imgUrl");
  }
});

messageSchema.index({ conversationId: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
