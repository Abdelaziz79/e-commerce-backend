// src/middleware/reviewValidationMiddleware.ts

import { body, param } from "express-validator";

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
  body("existingImages")
    .optional()
    .custom((value) => {
      if (Array.isArray(value)) {
        return true;
      }
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed);
        } catch {
          throw new Error("existingImages must be a valid JSON array");
        }
      }
      throw new Error(
        "existingImages must be an array or valid JSON array string"
      );
    })
    .withMessage("existingImages must be an array"),
];

export const validateReviewId = [
  param("id").isMongoId().withMessage("Invalid review ID"),
];

export const validateProductId = [
  param("productId").isMongoId().withMessage("Invalid product ID"),
];
