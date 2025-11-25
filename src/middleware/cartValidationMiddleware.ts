// src/middleware/cartValidationMiddleware.ts
import { body, param, query } from "express-validator";

/**
 * Validation for calculating cart totals
 */
export const validateCalculateCartTotals = [
  body("shippingAddress")
    .notEmpty()
    .withMessage("Shipping address is required")
    .isObject()
    .withMessage("Shipping address must be an object"),

  body("shippingAddress.address")
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage("Address must be between 5 and 200 characters"),

  body("shippingAddress.city")
    .notEmpty()
    .withMessage("City is required")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("City must be between 2 and 100 characters"),

  body("shippingAddress.postalCode")
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage("Postal code must be between 3 and 20 characters"),

  body("shippingAddress.country")
    .notEmpty()
    .withMessage("Country is required")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Country must be between 2 and 100 characters"),

  body("shippingAddress.state")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("State must be between 2 and 100 characters"),

  body("discountCode")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Discount code must be between 2 and 50 characters")
    .toUpperCase(),
];

/**
 * Validation for adding item to cart
 */
export const validateAddToCart = [
  body("productId")
    .notEmpty()
    .withMessage("Product ID is required")
    .isMongoId()
    .withMessage("Invalid product ID"),

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
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("SKU must be between 1 and 100 characters"),
];

/**
 * Validation for updating cart item
 */
export const validateUpdateCartItem = [
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

/**
 * Validation for removing from cart
 */
export const validateRemoveFromCart = [
  param("productId").isMongoId().withMessage("Invalid product ID"),

  query("variationSku")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Variation SKU must be between 1 and 100 characters"),
];
