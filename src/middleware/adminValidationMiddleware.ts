// src/middleware/adminValidationMiddleware.ts
import { body, param, query } from "express-validator";

/**
 * Validation for banning/suspending user
 */
export const validateBanUser = [
  param("id").isMongoId().withMessage("Invalid user ID"),
  body("reason")
    .optional()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage("Reason must be between 5 and 500 characters"),
];

/**
 * Validation for unbanning user
 */
export const validateUnbanUser = [
  param("id").isMongoId().withMessage("Invalid user ID"),
];

/**
 * Validation for updating user role
 */
export const validateUpdateUserRole = [
  param("id").isMongoId().withMessage("Invalid user ID"),
  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isIn(["user", "admin"])
    .withMessage("Role must be either 'user' or 'admin'"),
];

/**
 * Validation for getting user by ID
 */
export const validateUserId = [
  param("id").isMongoId().withMessage("Invalid user ID"),
];

/**
 * Validation for review ID
 */
export const validateReviewId = [
  param("id").isMongoId().withMessage("Invalid review ID"),
];

/**
 * Validation for pagination
 */
export const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage("Page must be between 1 and 1000")
    .toInt(),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100")
    .toInt(),
];

/**
 * Validation for user filtering
 */
export const validateUserFilters = [
  ...validatePagination,
  query("status")
    .optional()
    .isIn(["active", "banned", "suspended"])
    .withMessage("Status must be active, banned, or suspended"),
  query("role")
    .optional()
    .isIn(["user", "admin"])
    .withMessage("Role must be user or admin"),
  query("sort")
    .optional()
    .trim()
    .matches(/^-?(name|email|createdAt|status)$/)
    .withMessage("Invalid sort field"),
];

/**
 * Validation for review filtering
 */
export const validateReviewFilters = [
  ...validatePagination,
  query("rating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5")
    .toInt(),
  query("user").optional().isMongoId().withMessage("Invalid user ID"),
  query("product").optional().isMongoId().withMessage("Invalid product ID"),
  query("sort")
    .optional()
    .trim()
    .matches(/^-?(rating|createdAt|helpfulVotes)$/)
    .withMessage("Invalid sort field"),
];
