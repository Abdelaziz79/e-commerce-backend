import { body, param, query } from "express-validator";
import mongoose from "mongoose";

// User validation
export const validateUpdateProfile = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage(
      "Name can only contain letters, spaces, hyphens and apostrophes"
    ),
  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Please include a valid email if provided")
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage("Email cannot exceed 100 characters"),
  body("phone")
    .optional()
    .matches(/^\+?[\d\s-()]{10,20}$/)
    .withMessage("Please enter a valid phone number"),
];

export const validateUpdatePassword = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 6, max: 100 })
    .withMessage("New password must be between 6 and 100 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "New password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),
];

// Address validation
export const validateAddAddress = [
  body("address")
    .notEmpty()
    .withMessage("Address is required")
    .isLength({ min: 5, max: 200 })
    .withMessage("Address must be between 5 and 200 characters"),

  body("city")
    .notEmpty()
    .withMessage("City is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("City must be between 2 and 50 characters"),

  body("postalCode")
    .notEmpty()
    .withMessage("Postal code is required")
    .isLength({ min: 3, max: 15 })
    .withMessage("Postal code must be between 3 and 15 characters"),

  body("country")
    .notEmpty()
    .withMessage("Country is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Country must be between 2 and 50 characters"),

  body("isDefault")
    .optional()
    .isBoolean()
    .withMessage("isDefault must be a boolean"),
];

export const validateUpdateAddress = [
  param("addressId").isMongoId().withMessage("Invalid address ID"),

  body("address")
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage("Address must be between 5 and 200 characters"),

  body("city")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("City must be between 2 and 50 characters"),

  body("postalCode")
    .optional()
    .isLength({ min: 3, max: 15 })
    .withMessage("Postal code must be between 3 and 15 characters"),

  body("country")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("Country must be between 2 and 50 characters"),

  body("isDefault")
    .optional()
    .isBoolean()
    .withMessage("isDefault must be a boolean"),
];

// Favorite item validation - Fixed to accept productId
export const validateFavoriteItem = [
  body("productId")
    .isMongoId()
    .withMessage("Invalid product ID")
    .custom(async (value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid product ID format");
      }
      return true;
    }),
];

// Cart item validation (legacy - kept for compatibility)
export const validateCartItem = [
  body("productId")
    .isMongoId()
    .withMessage("Invalid product ID")
    .custom(async (value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid product ID format");
      }
      return true;
    }),

  body("quantity")
    .optional()
    .isInt({ min: 1, max: 999 })
    .withMessage("Quantity must be between 1 and 999")
    .toInt(),

  body("variation")
    .optional()
    .isObject()
    .withMessage("Variation must be an object"),

  body("variation.size")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Size must be between 1 and 50 characters"),

  body("variation.color")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Color must be between 1 and 50 characters"),

  body("variation.material")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Material must be between 1 and 50 characters"),

  body("variation.style")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Style must be between 1 and 50 characters"),

  body("variation.sku")
    .if(body("variation").exists())
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("SKU must be between 1 and 100 characters"),
];

// Cart update validation
export const validateCartUpdate = [
  param("productId").isMongoId().withMessage("Invalid product ID"),

  body("quantity")
    .isInt({ min: 0, max: 999 })
    .withMessage("Quantity must be between 0 and 999")
    .toInt(),

  body("variationSku")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Variation SKU must be between 1 and 100 characters"),
];

// Pagination validation
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

// Product ID parameter validation
export const validateProductId = [
  param("productId")
    .isMongoId()
    .withMessage("Invalid product ID")
    .custom(async (value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid product ID format");
      }
      return true;
    }),
];
