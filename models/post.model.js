const mongoose = require("mongoose");

// Comment sub-schema (bonus feature)
const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, "Comment content is required"],
      trim: true,
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Post title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    content: {
      type: String,
      required: [true, "Post content is required"],
      trim: true,
      minlength: [10, "Content must be at least 10 characters"],
    },
    images: {
      type: [String],
      validate: {
        validator: (arr) => arr.length >= 1,
        message: "At least one image is required",
      },
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // null = global post, ObjectId = group post
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default: null,
    },
    // Bonus features
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [commentSchema],
  },
  {
    timestamps: true,
  }
);

// Index for faster sorting
postSchema.index({ createdAt: -1 });
postSchema.index({ group: 1, createdAt: -1 });
postSchema.index({ author: 1, createdAt: -1 });

module.exports = mongoose.model("Post", postSchema);
