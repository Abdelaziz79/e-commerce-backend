import { body, param } from "express-validator";

// Cart validation - Fixed to accept productId in body
export const validateAddToCart = [
  body("productId").isMongoId().withMessage("Invalid product ID"),
  body("quantity")
    .optional()
    .isInt({ min: 1, max: 999 })
    .withMessage("Quantity must be between 1 and 999"),
  body("variation")
    .optional()
    .isObject()
    .withMessage("Variation must be an object"),
  body("variation.sku")
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage("SKU must be between 1 and 100 characters"),
];

export const validateUpdateCartItem = [
  param("productId").isMongoId().withMessage("Invalid product ID"),
  body("quantity")
    .isInt({ min: 0, max: 999 })
    .withMessage("Quantity must be between 0 and 999"),
  body("variationSku")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Variation SKU must be between 1 and 100 characters"),
];
