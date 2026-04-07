const Joi = require("joi");
const AppError = require("../utils/AppError");

const objectId = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .messages({ "string.pattern.base": "Invalid ID format" });

const createGroupSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    "string.min": "Group name must be at least 3 characters",
    "any.required": "Group name is required",
  }),
  description: Joi.string().max(500).optional(),
  openPosting: Joi.boolean().default(false),
});

const updateGroupSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional(),
  description: Joi.string().max(500).optional(),
  openPosting: Joi.boolean().optional(),
}).min(1);

const userIdSchema = Joi.object({
  userId: objectId.required().messages({ "any.required": "userId is required" }),
});

const permissionSchema = Joi.object({
  userId: objectId.required(),
  canPost: Joi.boolean().required(),
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
  validateCreateGroup: validate(createGroupSchema),
  validateUpdateGroup: validate(updateGroupSchema),
  validateUserId: validate(userIdSchema),
  validatePermission: validate(permissionSchema),
};
