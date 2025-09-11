import { body, param, query } from "express-validator";

// Product validation - Fixed image validation to accept relative paths
export const validateCreateProduct = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Product name must be between 2 and 100 characters"),
  body("description")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Product description must be between 10 and 1000 characters"),
  body("price")
    .isFloat({ min: 0, max: 999999 })
    .withMessage("Price must be between 0 and 999,999"),
  body("category")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Category must be between 2 and 50 characters"),
  body("brand")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Brand must be between 2 and 50 characters"),
  body("countInStock")
    .isInt({ min: 0, max: 9999 })
    .withMessage("Count in stock must be between 0 and 9,999"),
  body("images").optional().isArray().withMessage("Images must be an array"),
  body("images.*")
    .optional()
    .custom((value) => {
      // Accept both URLs and relative paths
      if (value.startsWith("http") || value.startsWith("https")) {
        return /^https?:\/\/.*\.(jpg|jpeg|png|gif|webp)$/i.test(value);
      }
      // Accept relative paths starting with /
      return /^\/.*\.(jpg|jpeg|png|gif|webp)$/i.test(value);
    })
    .withMessage("Please provide valid image URLs or paths"),
  body("tags")
    .optional()
    .isArray({ max: 10 })
    .withMessage("Cannot have more than 10 tags"),
  body("tags.*")
    .optional()
    .isLength({ min: 1, max: 20 })
    .withMessage("Each tag must be between 1 and 20 characters"),
  body("weight")
    .optional()
    .isFloat({ min: 0, max: 10000 })
    .withMessage("Weight must be between 0 and 10,000"),
  body("variations")
    .optional()
    .isArray()
    .withMessage("Variations must be an array"),
  body("variations.*.sku")
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage("Variation SKU must be between 1 and 50 characters"),
  body("variations.*.price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Variation price must be greater than or equal to 0"),
];

export const validateUpdateProduct = [
  param("id").isMongoId().withMessage("Invalid product ID"),
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Product name must be between 2 and 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Product description must be between 10 and 1000 characters"),
  body("price")
    .optional()
    .isFloat({ min: 0, max: 999999 })
    .withMessage("Price must be between 0 and 999,999"),
  body("category")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Category must be between 2 and 50 characters"),
  body("brand")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Brand must be between 2 and 50 characters"),
  body("countInStock")
    .optional()
    .isInt({ min: 0, max: 9999 })
    .withMessage("Count in stock must be between 0 and 9,999"),
];

// Enhanced review validation with all model fields
export const validateCreateReview = [
  param("id").isMongoId().withMessage("Invalid product ID"),
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body("comment")
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage("Comment must be between 10 and 500 characters"),
  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Title must be between 3 and 100 characters"),
  body("images")
    .optional()
    .isArray({ max: 5 })
    .withMessage("Cannot upload more than 5 images"),
  body("images.*")
    .optional()
    .custom((value) => {
      if (value.startsWith("http") || value.startsWith("https")) {
        return /^https?:\/\/.*\.(jpg|jpeg|png|gif|webp)$/i.test(value);
      }
      return /^\/.*\.(jpg|jpeg|png|gif|webp)$/i.test(value);
    })
    .withMessage("Please provide valid image URLs or paths"),
];

// Product query validation
export const validateProductQuery = [
  query("page")
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage("Page must be between 1 and 1000"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("sort")
    .optional()
    .isIn([
      "name",
      "price",
      "rating",
      "createdAt",
      "-name",
      "-price",
      "-rating",
      "-createdAt",
    ])
    .withMessage("Invalid sort parameter"),
  query("category")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Category must be between 1 and 50 characters"),
  query("brand")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Brand must be between 1 and 50 characters"),
  query("minPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Minimum price must be greater than or equal to 0"),
  query("maxPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Maximum price must be greater than or equal to 0"),
  query("search")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Search term must be between 1 and 100 characters"),
];
