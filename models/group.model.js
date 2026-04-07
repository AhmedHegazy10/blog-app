const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Group name is required"],
      trim: true,
      minlength: [3, "Group name must be at least 3 characters"],
      maxlength: [100, "Group name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Members with explicit post permission
    allowedToPost: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // true = any member can post, false = only allowedToPost list
    openPosting: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual: check if a user can post in this group
groupSchema.methods.canUserPost = function (userId) {
  const id = userId.toString();
  const isAdmin = this.admins.some((a) => a.toString() === id);
  if (isAdmin) return true;
  if (this.openPosting) return this.members.some((m) => m.toString() === id);
  return this.allowedToPost.some((u) => u.toString() === id);
};

// Virtual: check if a user is a member or admin
groupSchema.methods.isMember = function (userId) {
  const id = userId.toString();
  return (
    this.members.some((m) => m.toString() === id) ||
    this.admins.some((a) => a.toString() === id)
  );
};

module.exports = mongoose.model("Group", groupSchema);
