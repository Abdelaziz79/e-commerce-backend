// src/middleware/categoryValidationMiddleware.ts

import { body, query } from "express-validator";

export const validateCreateCategory = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Category name must be between 2 and 50 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  body("parentCategory")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("Invalid parent category ID"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be true or false"),
];

export const validateUpdateCategory = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Category name must be between 2 and 50 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  body("parentCategory")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("Invalid parent category ID"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be true or false"),
];

export const validateCategorySearch = [
  query("q")
    .notEmpty()
    .withMessage("Search query 'q' is required")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Search query must be between 1 and 100 characters")
    .matches(/^[a-zA-Z0-9\s\-_.]+$/)
    .withMessage(
      "Search query contains invalid characters. Only letters, numbers, spaces, hyphens, underscores, and periods are allowed"
    ),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("sort")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Sort parameter is too long"),
];
