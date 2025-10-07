// src/middleware/categoryValidationMiddleware.ts

import { body } from "express-validator";

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
