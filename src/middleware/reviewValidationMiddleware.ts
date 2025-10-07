// src/middleware/reviewValidationMiddleware.ts

import { body } from "express-validator";

export const validateCreateReview = [
  body("product").isMongoId().withMessage("A valid product ID is required"),
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be an integer between 1 and 5"),
  body("comment")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Comment must be between 10 and 1000 characters"),
  body("title")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Title cannot exceed 100 characters"),
  body("images")
    .optional()
    .isArray({ max: 5 })
    .withMessage("You can upload a maximum of 5 images"),
];

export const validateUpdateReview = [
  body("rating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be an integer between 1 and 5"),
  body("comment")
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Comment must be between 10 and 1000 characters"),
  body("title")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Title cannot exceed 100 characters"),
  body("images")
    .optional()
    .isArray({ max: 5 })
    .withMessage("You can upload a maximum of 5 images"),
];
