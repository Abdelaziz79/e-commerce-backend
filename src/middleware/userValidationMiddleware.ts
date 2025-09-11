import { body, param } from "express-validator";

// User validation
export const validateFavoriteItem = [
  body("productId").isMongoId().withMessage("Invalid product ID"),
];

export const validateForgotPassword = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please include a valid email")
    .normalizeEmail(),
];

export const validateResetPassword = [
  body("password")
    .isLength({ min: 6, max: 100 })
    .withMessage("Password must be between 6 and 100 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Password confirmation does not match password");
    }
    return true;
  }),
];

export const validateUserRegistration = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage(
      "Name can only contain letters, spaces, hyphens and apostrophes"
    ),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please include a valid email")
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage("Email cannot exceed 100 characters"),
  body("password")
    .isLength({ min: 6, max: 100 })
    .withMessage("Password must be between 6 and 100 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),
  body("phone")
    .optional()
    .matches(/^\+?[\d\s-()]{10,20}$/)
    .withMessage("Please enter a valid phone number"),
];

export const validateUserLogin = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please include a valid email")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

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

// Cart validation - Fixed to use consistent quantity limits and field names
export const validateAddToCart = [
  body("product").isMongoId().withMessage("Invalid product ID"),
  body("quantity")
    .isInt({ min: 1, max: 999 })
    .withMessage("Quantity must be between 1 and 999"),
  body("variation.sku")
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage("SKU must be between 1 and 50 characters"),
];

export const validateUpdateCartItem = [
  param("productId").isMongoId().withMessage("Invalid product ID"),
  body("quantity")
    .isInt({ min: 1, max: 999 })
    .withMessage("Quantity must be between 1 and 999"),
];

// Address validation - Fixed to make update validation consistent with model
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
    .notEmpty()
    .withMessage("Address is required")
    .isLength({ min: 5, max: 200 })
    .withMessage("Address must be between 5 and 200 characters"),

  body("city")
    .optional()
    .notEmpty()
    .withMessage("City is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("City must be between 2 and 50 characters"),

  body("postalCode")
    .optional()
    .notEmpty()
    .withMessage("Postal code is required")
    .isLength({ min: 3, max: 15 })
    .withMessage("Postal code must be between 3 and 15 characters"),

  body("country")
    .optional()
    .notEmpty()
    .withMessage("Country is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Country must be between 2 and 50 characters"),

  body("isDefault")
    .optional()
    .optional()
    .isBoolean()
    .withMessage("isDefault must be a boolean"),
];

// Cart item validation - Updated for consistency
export const validateCartItem = [
  body("productId").isMongoId().withMessage("Invalid product ID"),

  body("name")
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage("Product name must be between 1 and 100 characters"),

  body("price")
    .optional()
    .isNumeric()
    .withMessage("Price must be a number")
    .custom((value) => {
      if (value < 0) {
        throw new Error("Price cannot be negative");
      }
      return true;
    }),

  body("quantity")
    .optional()
    .isInt({ min: 1, max: 999 })
    .withMessage("Quantity must be between 1 and 999"),

  body("image")
    .optional()
    .custom((value) => {
      // Accept both URLs and relative paths
      if (value.startsWith("http") || value.startsWith("https")) {
        return /^https?:\/\/.*\.(jpg|jpeg|png|gif|webp)$/i.test(value);
      }
      // Accept relative paths starting with /
      return /^\/.*\.(jpg|jpeg|png|gif|webp)$/i.test(value);
    })
    .withMessage("Image must be a valid URL or relative path"),
];
