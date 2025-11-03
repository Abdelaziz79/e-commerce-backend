import { body } from "express-validator";

export const validateUserLogin = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please include a valid email")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

export const validateForgotPassword = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please include a valid email")
    .normalizeEmail(),
];

export const validateResetPassword = [
  body("password")
    .isLength({ min: 6, max: 100 })
    .withMessage("Password must be between 6 and 100 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Password confirmation does not match password");
    }
    return true;
  }),
];

export const validateUserRegistration = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage(
      "Name can only contain letters, spaces, hyphens and apostrophes"
    ),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please include a valid email")
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage("Email cannot exceed 100 characters"),
  body("password")
    .isLength({ min: 6, max: 100 })
    .withMessage("Password must be between 6 and 100 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),
  body("phone")
    .optional()
    .matches(/^\+?[\d\s-()]{10,20}$/)
    .withMessage("Please enter a valid phone number"),
];
