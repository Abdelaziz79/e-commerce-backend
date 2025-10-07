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
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("category").isMongoId().withMessage("A valid category ID is required"),
  body("brand").isMongoId().withMessage("A valid brand ID is required"),
  body("countInStock")
    .isInt({ min: 0 })
    .withMessage("Count in stock must be a non-negative integer"),
  body("images").optional().isArray().withMessage("Images must be an array"),
  body("images.*")
    .optional()
    .custom((value) => {
      if (value.startsWith("http") || value.startsWith("https")) {
        return /^https?:\/\/.*\.(jpg|jpeg|png|gif|webp)$/i.test(value);
      }
      return /^\/.*\.(jpg|jpeg|png|gif|webp)$/i.test(value);
    })
    .withMessage("Please provide valid image URLs or paths"),
  body("mainImage")
    .optional()
    .custom((value) => {
      if (value.startsWith("http") || value.startsWith("https")) {
        return /^https?:\/\/.*\.(jpg|jpeg|png|gif|webp)$/i.test(value);
      }
      return /^\/.*\.(jpg|jpeg|png|gif|webp)$/i.test(value);
    })
    .withMessage("Please provide valid main image URL or path"),
  body("subcategories")
    .optional()
    .isArray()
    .withMessage("Subcategories must be an array"),
  body("subcategories.*")
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage("Each subcategory must be between 1 and 50 characters"),
  body("richDescription")
    .optional()
    .isLength({ max: 5000 })
    .withMessage("Rich description cannot exceed 5000 characters"),
  body("hasVariations")
    .optional()
    .isBoolean()
    .withMessage("hasVariations must be a boolean"),
  body("variations")
    .optional()
    .isArray()
    .withMessage("Variations must be an array"),
  body("variations.*.sku")
    .if(body("variations").exists())
    .notEmpty()
    .isLength({ min: 1, max: 50 })
    .withMessage(
      "Variation SKU is required and must be between 1 and 50 characters"
    ),
  body("variations.*.price")
    .if(body("variations").exists())
    .isFloat({ min: 0 })
    .withMessage(
      "Variation price is required and must be greater than or equal to 0"
    ),
  body("variations.*.countInStock")
    .if(body("variations").exists())
    .isInt({ min: 0 })
    .withMessage(
      "Variation count in stock is required and must be greater than or equal to 0"
    ),
  body("featured")
    .optional()
    .isBoolean()
    .withMessage("Featured must be a boolean"),
  body("isNewProduct")
    .optional()
    .isBoolean()
    .withMessage("isNewProduct must be a boolean"),
  body("onSale").optional().isBoolean().withMessage("onSale must be a boolean"),
  body("salePrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Sale price must be greater than or equal to 0"),
  body("saleEndDate")
    .optional()
    .isISO8601()
    .withMessage("Sale end date must be a valid date"),
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
  body("weightUnit")
    .optional()
    .isIn(["kg", "g", "lb", "oz"])
    .withMessage("Weight unit must be kg, g, lb, or oz"),
  body("dimensions.length")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Dimension length must be greater than or equal to 0"),
  body("dimensions.width")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Dimension width must be greater than or equal to 0"),
  body("dimensions.height")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Dimension height must be greater than or equal to 0"),
  body("dimensions.unit")
    .optional()
    .isIn(["cm", "inch", "mm", "m"])
    .withMessage("Dimension unit must be cm, inch, mm, or m"),
  body("relatedProducts")
    .optional()
    .isArray()
    .withMessage("Related products must be an array"),
  body("relatedProducts.*")
    .optional()
    .isMongoId()
    .withMessage("Each related product ID must be a valid MongoDB ObjectId"),
  body("warranty")
    .optional()
    .isLength({ max: 200 })
    .withMessage("Warranty cannot exceed 200 characters"),
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
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("category")
    .optional()
    .isMongoId()
    .withMessage("A valid category ID is required"),
  body("brand")
    .optional()
    .isMongoId()
    .withMessage("A valid brand ID is required"),
  body("countInStock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Count in stock must be a non-negative integer"),
  body("images").optional().isArray().withMessage("Images must be an array"),
  body("images.*")
    .optional()
    .custom((value) => {
      if (value.startsWith("http") || value.startsWith("https")) {
        return /^https?:\/\/.*\.(jpg|jpeg|png|gif|webp)$/i.test(value);
      }
      return /^\/.*\.(jpg|jpeg|png|gif|webp)$/i.test(value);
    })
    .withMessage("Please provide valid image URLs or paths"),
  body("mainImage")
    .optional()
    .custom((value) => {
      if (value.startsWith("http") || value.startsWith("https")) {
        return /^https?:\/\/.*\.(jpg|jpeg|png|gif|webp)$/i.test(value);
      }
      return /^\/.*\.(jpg|jpeg|png|gif|webp)$/i.test(value);
    })
    .withMessage("Please provide valid main image URL or path"),
  body("hasVariations")
    .optional()
    .isBoolean()
    .withMessage("hasVariations must be a boolean"),
  body("variations")
    .optional()
    .isArray()
    .withMessage("Variations must be an array"),
  body("variations.*.sku")
    .if(body("variations").exists())
    .notEmpty()
    .isLength({ min: 1, max: 50 })
    .withMessage(
      "Variation SKU is required and must be between 1 and 50 characters"
    ),
  body("variations.*.price")
    .if(body("variations").exists())
    .isFloat({ min: 0 })
    .withMessage(
      "Variation price is required and must be greater than or equal to 0"
    ),
  body("variations.*.countInStock")
    .if(body("variations").exists())
    .isInt({ min: 0 })
    .withMessage(
      "Variation count in stock is required and must be greater than or equal to 0"
    ),
  body("featured")
    .optional()
    .isBoolean()
    .withMessage("Featured must be a boolean"),
  body("isNewProduct")
    .optional()
    .isBoolean()
    .withMessage("isNewProduct must be a boolean"),
  body("onSale").optional().isBoolean().withMessage("onSale must be a boolean"),
  body("salePrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Sale price must be greater than or equal to 0"),
  body("saleEndDate")
    .optional()
    .isISO8601()
    .withMessage("Sale end date must be a valid date"),
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
  body("weightUnit")
    .optional()
    .isIn(["kg", "g", "lb", "oz"])
    .withMessage("Weight unit must be kg, g, lb, or oz"),
  body("dimensions.length")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Dimension length must be greater than or equal to 0"),
  body("dimensions.width")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Dimension width must be greater than or equal to 0"),
  body("dimensions.height")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Dimension height must be greater than or equal to 0"),
  body("dimensions.unit")
    .optional()
    .isIn(["cm", "inch", "mm", "m"])
    .withMessage("Dimension unit must be cm, inch, mm, or m"),
  body("relatedProducts")
    .optional()
    .isArray()
    .withMessage("Related products must be an array"),
  body("relatedProducts.*")
    .optional()
    .isMongoId()
    .withMessage("Each related product ID must be a valid MongoDB ObjectId"),
  body("warranty")
    .optional()
    .isLength({ max: 200 })
    .withMessage("Warranty cannot exceed 200 characters"),
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

// Validation for updating a review
export const validateUpdateReview = [
  param("id").isMongoId().withMessage("Invalid product ID"),
  param("reviewId").isMongoId().withMessage("Invalid review ID"),
  body("rating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body("comment")
    .optional()
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

// Validation for deleting a review
export const validateDeleteReview = [
  param("id").isMongoId().withMessage("Invalid product ID"),
  param("reviewId").isMongoId().withMessage("Invalid review ID"),
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
