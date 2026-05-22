import mongoose from "mongoose";

const friendSchema = new mongoose.Schema(
  {
    userA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

friendSchema.pre("validate", function () {
  if (!this.userA || !this.userB) {
    return;
  }

  const a = this.userA.toString();
  const b = this.userB.toString();

  if (a === b) {
    throw new Error("Không thể tạo quan hệ bạn bè với chính mình");
  }

  if (a > b) {
    this.userA = new mongoose.Types.ObjectId(b);
    this.userB = new mongoose.Types.ObjectId(a);
  }
});

friendSchema.index({ userA: 1, userB: 1 }, { unique: true });

const Friend = mongoose.model("Friend", friendSchema);

export default Friend;
