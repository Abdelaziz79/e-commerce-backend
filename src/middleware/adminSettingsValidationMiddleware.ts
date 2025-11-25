// src/middleware/adminSettingsValidationMiddleware.ts
import { body, param } from "express-validator";

// General settings validation
export const validateGeneralSettings = [
  body("storeName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Store name must be between 2 and 100 characters"),
  body("storeEmail")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email"),
  body("storeCurrency")
    .optional()
    .trim()
    .isLength({ min: 3, max: 3 })
    .withMessage("Currency code must be 3 characters"),
  body("orderPrefix")
    .optional()
    .trim()
    .isLength({ min: 2, max: 10 })
    .withMessage("Order prefix must be between 2 and 10 characters"),
  body("minimumOrderAmount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Minimum order amount must be greater than or equal to 0"),
  body("maximumOrderAmount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Maximum order amount must be greater than or equal to 0"),
  body("allowGuestCheckout")
    .optional()
    .isBoolean()
    .withMessage("Allow guest checkout must be a boolean"),
  body("maintenanceMode")
    .optional()
    .isBoolean()
    .withMessage("Maintenance mode must be a boolean"),
];

// Tax rate validation for CREATE
export const validateCreateTaxRate = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Tax name must be between 2 and 100 characters"),
  body("rate")
    .isFloat({ min: 0, max: 100 })
    .withMessage("Tax rate must be between 0 and 100"),
  body("country")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Country is required"),
  body("state").optional().trim(),
  body("city").optional().trim(),
  body("postalCodes")
    .optional()
    .isArray()
    .withMessage("Postal codes must be an array"),
  body("isDefault")
    .optional()
    .isBoolean()
    .withMessage("Is default must be a boolean"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("Is active must be a boolean"),
  body("priority")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Priority must be a non-negative integer"),
];

// Tax rate validation for UPDATE (all fields optional)
export const validateUpdateTaxRate = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Tax name must be between 2 and 100 characters"),
  body("rate")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Tax rate must be between 0 and 100"),
  body("country").optional().trim(),
  body("state").optional().trim(),
  body("city").optional().trim(),
  body("postalCodes")
    .optional()
    .isArray()
    .withMessage("Postal codes must be an array"),
  body("isDefault")
    .optional()
    .isBoolean()
    .withMessage("Is default must be a boolean"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("Is active must be a boolean"),
  body("priority")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Priority must be a non-negative integer"),
];

// Shipping rate validation for CREATE
export const validateCreateShippingRate = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Shipping name must be between 2 and 100 characters"),
  body("type")
    .isIn(["flat", "weight-based", "price-based"])
    .withMessage("Type must be flat, weight-based, or price-based"),
  body("flatRate")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Flat rate must be greater than or equal to 0"),
  body("freeShippingThreshold")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Free shipping threshold must be greater than or equal to 0"),
  body("weightRanges")
    .optional()
    .isArray()
    .withMessage("Weight ranges must be an array"),
  body("weightRanges.*.minWeight")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Min weight must be greater than or equal to 0"),
  body("weightRanges.*.maxWeight")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Max weight must be greater than or equal to 0"),
  body("weightRanges.*.rate")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Weight range rate must be greater than or equal to 0"),
  body("priceRanges")
    .optional()
    .isArray()
    .withMessage("Price ranges must be an array"),
  body("priceRanges.*.minPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Min price must be greater than or equal to 0"),
  body("priceRanges.*.maxPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Max price must be greater than or equal to 0"),
  body("priceRanges.*.rate")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price range rate must be greater than or equal to 0"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("Is active must be a boolean"),
];

// Shipping rate validation for UPDATE (all fields optional)
export const validateUpdateShippingRate = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Shipping name must be between 2 and 100 characters"),
  body("type")
    .optional()
    .isIn(["flat", "weight-based", "price-based"])
    .withMessage("Type must be flat, weight-based, or price-based"),
  body("flatRate")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Flat rate must be greater than or equal to 0"),
  body("freeShippingThreshold")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Free shipping threshold must be greater than or equal to 0"),
  body("weightRanges")
    .optional()
    .isArray()
    .withMessage("Weight ranges must be an array"),
  body("weightRanges.*.minWeight")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Min weight must be greater than or equal to 0"),
  body("weightRanges.*.maxWeight")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Max weight must be greater than or equal to 0"),
  body("weightRanges.*.rate")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Weight range rate must be greater than or equal to 0"),
  body("priceRanges")
    .optional()
    .isArray()
    .withMessage("Price ranges must be an array"),
  body("priceRanges.*.minPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Min price must be greater than or equal to 0"),
  body("priceRanges.*.maxPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Max price must be greater than or equal to 0"),
  body("priceRanges.*.rate")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price range rate must be greater than or equal to 0"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("Is active must be a boolean"),
];

// Discount code validation for CREATE
export const validateCreateDiscountCode = [
  body("code")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Code must be between 2 and 50 characters")
    .matches(/^[A-Z0-9-_]+$/i)
    .withMessage(
      "Code can only contain letters, numbers, hyphens, and underscores"
    ),
  body("type")
    .isIn(["percentage", "fixed"])
    .withMessage("Type must be percentage or fixed"),
  body("value")
    .isFloat({ min: 0 })
    .withMessage("Value must be greater than or equal to 0")
    .custom((value, { req }) => {
      if (req.body.type === "percentage" && value > 100) {
        throw new Error("Percentage value cannot exceed 100");
      }
      return true;
    }),
  body("minOrderAmount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Minimum order amount must be greater than or equal to 0"),
  body("maxDiscountAmount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Maximum discount amount must be greater than or equal to 0"),
  body("usageLimit")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Usage limit must be at least 1"),
  body("perUserLimit")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Per user limit must be at least 1"),
  body("validFrom").isISO8601().withMessage("Valid from must be a valid date"),
  body("validUntil")
    .isISO8601()
    .withMessage("Valid until must be a valid date")
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.validFrom)) {
        throw new Error("Valid until must be after valid from date");
      }
      return true;
    }),
  body("applicableCategories")
    .optional()
    .isArray()
    .withMessage("Applicable categories must be an array"),
  body("applicableCategories.*")
    .optional()
    .isMongoId()
    .withMessage("Each category ID must be a valid MongoDB ObjectId"),
  body("applicableProducts")
    .optional()
    .isArray()
    .withMessage("Applicable products must be an array"),
  body("applicableProducts.*")
    .optional()
    .isMongoId()
    .withMessage("Each product ID must be a valid MongoDB ObjectId"),
  body("excludedCategories")
    .optional()
    .isArray()
    .withMessage("Excluded categories must be an array"),
  body("excludedCategories.*")
    .optional()
    .isMongoId()
    .withMessage("Each category ID must be a valid MongoDB ObjectId"),
  body("excludedProducts")
    .optional()
    .isArray()
    .withMessage("Excluded products must be an array"),
  body("excludedProducts.*")
    .optional()
    .isMongoId()
    .withMessage("Each product ID must be a valid MongoDB ObjectId"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("Is active must be a boolean"),
];

// Discount code validation for UPDATE (all fields optional)
export const validateUpdateDiscountCode = [
  body("code")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Code must be between 2 and 50 characters")
    .matches(/^[A-Z0-9-_]+$/i)
    .withMessage(
      "Code can only contain letters, numbers, hyphens, and underscores"
    ),
  body("type")
    .optional()
    .isIn(["percentage", "fixed"])
    .withMessage("Type must be percentage or fixed"),
  body("value")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Value must be greater than or equal to 0")
    .custom((value, { req }) => {
      if (req.body.type === "percentage" && value > 100) {
        throw new Error("Percentage value cannot exceed 100");
      }
      return true;
    }),
  body("minOrderAmount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Minimum order amount must be greater than or equal to 0"),
  body("maxDiscountAmount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Maximum discount amount must be greater than or equal to 0"),
  body("usageLimit")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Usage limit must be at least 1"),
  body("perUserLimit")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Per user limit must be at least 1"),
  body("validFrom")
    .optional()
    .isISO8601()
    .withMessage("Valid from must be a valid date"),
  body("validUntil")
    .optional()
    .isISO8601()
    .withMessage("Valid until must be a valid date"),
  body("applicableCategories")
    .optional()
    .isArray()
    .withMessage("Applicable categories must be an array"),
  body("applicableCategories.*")
    .optional()
    .isMongoId()
    .withMessage("Each category ID must be a valid MongoDB ObjectId"),
  body("applicableProducts")
    .optional()
    .isArray()
    .withMessage("Applicable products must be an array"),
  body("applicableProducts.*")
    .optional()
    .isMongoId()
    .withMessage("Each product ID must be a valid MongoDB ObjectId"),
  body("excludedCategories")
    .optional()
    .isArray()
    .withMessage("Excluded categories must be an array"),
  body("excludedCategories.*")
    .optional()
    .isMongoId()
    .withMessage("Each category ID must be a valid MongoDB ObjectId"),
  body("excludedProducts")
    .optional()
    .isArray()
    .withMessage("Excluded products must be an array"),
  body("excludedProducts.*")
    .optional()
    .isMongoId()
    .withMessage("Each product ID must be a valid MongoDB ObjectId"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("Is active must be a boolean"),
];

// Validate discount code for order
export const validateDiscountCodeUsage = [
  body("code").trim().notEmpty().withMessage("Discount code is required"),
  body("orderAmount")
    .isFloat({ min: 0 })
    .withMessage("Order amount must be greater than or equal to 0"),
  body("products").isArray().withMessage("Products must be an array"),
  body("products.*")
    .isMongoId()
    .withMessage("Each product ID must be a valid MongoDB ObjectId"),
  body("categories").isArray().withMessage("Categories must be an array"),
  body("categories.*")
    .isMongoId()
    .withMessage("Each category ID must be a valid MongoDB ObjectId"),
];

// ID parameter validation
export const validateSettingId = [
  param("id").isMongoId().withMessage("Invalid setting ID"),
];
