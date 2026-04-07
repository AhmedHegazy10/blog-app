const Post = require("../models/post.model");
const Group = require("../models/group.model");
const AppError = require("../utils/AppError");

// ─── Create post ──────────────────────────────────────────────────────────────
exports.createPost = async (req, res, next) => {
  try {
    const { title, content, group: groupId } = req.body;

    // Must have images
    if (!req.imageUrls || req.imageUrls.length === 0) {
      return next(new AppError("At least one image is required.", 400));
    }

    // If posting to a group, verify membership and permission
    if (groupId) {
      const group = await Group.findById(groupId);
      if (!group) return next(new AppError("Group not found.", 404));

      const isMember = group.isMember(req.user._id);
      if (!isMember && req.user.role !== "super-admin") {
        return next(new AppError("You are not a member of this group.", 403));
      }

      const canPost = group.canUserPost(req.user._id);
      if (!canPost && req.user.role !== "super-admin") {
        return next(
          new AppError("You do not have permission to post in this group.", 403)
        );
      }
    }

    const post = await Post.create({
      title,
      content,
      images: req.imageUrls,
      author: req.user._id,
      group: groupId || null,
    });

    await post.populate("author", "username email");
    if (groupId) await post.populate("group", "name");

    res.status(201).json({ status: "success", data: { post } });
  } catch (error) {
    next(error);
  }
};

// ─── Get all posts (global + accessible group posts) ─────────────────────────
exports.getAllPosts = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Search
    const searchQuery = req.query.search
      ? { $or: [
          { title: { $regex: req.query.search, $options: "i" } },
          { content: { $regex: req.query.search, $options: "i" } },
        ]}
      : {};

    // Find groups the user belongs to
    let accessibleGroupIds = [];
    if (req.user.role === "super-admin") {
      const allGroups = await Group.find().select("_id");
      accessibleGroupIds = allGroups.map((g) => g._id);
    } else {
      const userGroups = await Group.find({
        $or: [
          { members: req.user._id },
          { admins: req.user._id },
        ],
      }).select("_id");
      accessibleGroupIds = userGroups.map((g) => g._id);
    }

    const filter = {
      ...searchQuery,
      $or: [
        { group: null },                           // Global posts
        { group: { $in: accessibleGroupIds } },    // Accessible group posts
      ],
    };

    const total = await Post.countDocuments(filter);
    const posts = await Post.find(filter)
      .populate("author", "username email")
      .populate("group", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      status: "success",
      results: posts.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: { posts },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get user posts ───────────────────────────────────────────────────────────
exports.getUserPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const authorId = req.params.userId || req.user._id;

    const total = await Post.countDocuments({ author: authorId });
    const posts = await Post.find({ author: authorId })
      .populate("author", "username email")
      .populate("group", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      status: "success",
      results: posts.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: { posts },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get single post ──────────────────────────────────────────────────────────
exports.getPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "username email")
      .populate("group", "name")
      .populate("comments.author", "username");

    if (!post) return next(new AppError("Post not found.", 404));

    // If group post, verify access
    if (post.group && req.user.role !== "super-admin") {
      const group = await Group.findById(post.group._id);
      if (!group || !group.isMember(req.user._id)) {
        return next(new AppError("You do not have access to this post.", 403));
      }
    }

    res.status(200).json({ status: "success", data: { post } });
  } catch (error) {
    next(error);
  }
};

// ─── Update post ──────────────────────────────────────────────────────────────
exports.updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return next(new AppError("Post not found.", 404));

    // Ownership check (super-admin can bypass)
    if (
      post.author.toString() !== req.user._id.toString() &&
      req.user.role !== "super-admin"
    ) {
      return next(new AppError("You can only update your own posts.", 403));
    }

    const updateData = { ...req.body };
    if (req.imageUrls && req.imageUrls.length > 0) {
      updateData.images = req.imageUrls;
    }

    const updatedPost = await Post.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate("author", "username email");

    res.status(200).json({ status: "success", data: { post: updatedPost } });
  } catch (error) {
    next(error);
  }
};

// ─── Delete post ──────────────────────────────────────────────────────────────
exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return next(new AppError("Post not found.", 404));

    // Ownership check (super-admin can bypass)
    if (
      post.author.toString() !== req.user._id.toString() &&
      req.user.role !== "super-admin"
    ) {
      return next(new AppError("You can only delete your own posts.", 403));
    }

    await Post.findByIdAndDelete(req.params.id);
    res.status(204).json({ status: "success", data: null });
  } catch (error) {
    next(error);
  }
};

// ─── BONUS: Like / Unlike post ────────────────────────────────────────────────
exports.toggleLike = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return next(new AppError("Post not found.", 404));

    const userId = req.user._id.toString();
    const alreadyLiked = post.likes.some((id) => id.toString() === userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      post.likes.push(req.user._id);
    }

    await post.save();
    res.status(200).json({
      status: "success",
      liked: !alreadyLiked,
      likesCount: post.likes.length,
    });
  } catch (error) {
    next(error);
  }
};

// ─── BONUS: Add comment ───────────────────────────────────────────────────────
exports.addComment = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return next(new AppError("Post not found.", 404));

    post.comments.push({ content: req.body.content, author: req.user._id });
    await post.save();
    await post.populate("comments.author", "username");

    const newComment = post.comments[post.comments.length - 1];
    res.status(201).json({ status: "success", data: { comment: newComment } });
  } catch (error) {
    next(error);
  }
};

// ─── BONUS: Delete comment ────────────────────────────────────────────────────
exports.deleteComment = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return next(new AppError("Post not found.", 404));

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return next(new AppError("Comment not found.", 404));

    if (
      comment.author.toString() !== req.user._id.toString() &&
      req.user.role !== "super-admin"
    ) {
      return next(new AppError("You can only delete your own comments.", 403));
    }

    comment.deleteOne();
    await post.save();
    res.status(204).json({ status: "success", data: null });
  } catch (error) {
    next(error);
  }
};
