const Joi = require("joi");
const AppError = require("../utils/AppError");

const registerSchema = Joi.object({
  username: Joi.string().min(3).max(30).required().messages({
    "string.min": "Username must be at least 3 characters",
    "string.max": "Username cannot exceed 30 characters",
    "any.required": "Username is required",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email",
    "any.required": "Email is required",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters",
    "any.required": "Password is required",
  }),
  role: Joi.string().valid("user", "admin").default("user"),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email",
    "any.required": "Email is required",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

// ─── Validation middleware factory ────────────────────────────────────────────
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
  validateRegister: validate(registerSchema),
  validateLogin: validate(loginSchema),
};
