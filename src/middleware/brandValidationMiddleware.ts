// src/middleware/brandValidationMiddleware.ts

import { body } from "express-validator";

export const validateCreateBrand = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Brand name must be between 2 and 50 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  body("website")
    .optional()
    .isURL()
    .withMessage("Please provide a valid URL for the website"),
];

export const validateUpdateBrand = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Brand name must be between 2 and 50 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  body("website")
    .optional()
    .isURL()
    .withMessage("Please provide a valid URL for the website"),
];
