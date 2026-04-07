const Joi = require("joi");
const AppError = require("../utils/AppError");

const createPostSchema = Joi.object({
  title: Joi.string().min(3).max(200).required().messages({
    "string.min": "Title must be at least 3 characters",
    "string.max": "Title cannot exceed 200 characters",
    "any.required": "Title is required",
  }),
  content: Joi.string().min(10).required().messages({
    "string.min": "Content must be at least 10 characters",
    "any.required": "Content is required",
  }),
  group: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({ "string.pattern.base": "Invalid group ID" }),
});

const updatePostSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional(),
  content: Joi.string().min(10).optional(),
}).min(1).messages({ "object.min": "Provide at least one field to update" });

const commentSchema = Joi.object({
  content: Joi.string().min(1).max(1000).required().messages({
    "any.required": "Comment content is required",
  }),
});

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map((d) => d.message).join(". ");
    return next(new AppError(messages, 400));
  }
  req.body = value;
  next();
};

module.exports = {
  validateCreatePost: validate(createPostSchema),
  validateUpdatePost: validate(updatePostSchema),
  validateComment: validate(commentSchema),
};
