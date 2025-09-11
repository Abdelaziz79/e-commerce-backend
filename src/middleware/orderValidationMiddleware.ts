import { body, param, query } from "express-validator";

// Order validation - Fixed to use consistent quantity field naming
export const validateCreateOrder = [
  body("orderItems")
    .isArray({ min: 1, max: 50 })
    .withMessage("Order must contain between 1 and 50 items"),
  body("orderItems.*.product").isMongoId().withMessage("Invalid product ID"),
  body("orderItems.*.quantity")
    .isInt({ min: 1, max: 999 })
    .withMessage("Quantity must be between 1 and 999"),
  body("orderItems.*.price")
    .isFloat({ min: 0 })
    .withMessage("Price must be greater than or equal to 0"),
  body("shippingAddress")
    .isObject()
    .withMessage("Shipping address is required"),
  body("shippingAddress.address")
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage("Address must be between 5 and 200 characters"),
  body("shippingAddress.city")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("City must be between 2 and 50 characters"),
  body("shippingAddress.postalCode")
    .trim()
    .matches(/^[A-Z0-9\s-]{3,10}$/i)
    .withMessage("Please enter a valid postal code"),
  body("shippingAddress.country")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Country must be between 2 and 50 characters"),
  body("shippingAddress.phoneNumber")
    .optional()
    .matches(/^\+?[\d\s-()]{10,20}$/)
    .withMessage("Please enter a valid phone number"),
  body("paymentMethod")
    .isIn(["stripe", "paypal", "card", "cash"])
    .withMessage("Invalid payment method"),
  body("itemsPrice")
    .isFloat({ min: 0, max: 999999 })
    .withMessage("Items price must be between 0 and 999,999"),
  body("taxPrice")
    .isFloat({ min: 0, max: 99999 })
    .withMessage("Tax price must be between 0 and 99,999"),
  body("shippingPrice")
    .isFloat({ min: 0, max: 9999 })
    .withMessage("Shipping price must be between 0 and 9,999"),
  body("totalPrice")
    .isFloat({ min: 0, max: 999999 })
    .withMessage("Total price must be between 0 and 999,999"),
  body("discount.code")
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage("Discount code must be between 3 and 20 characters"),
  body("discount.type")
    .optional()
    .isIn(["percentage", "fixed"])
    .withMessage("Discount type must be either percentage or fixed"),
  body("discount.value")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Discount value must be between 0 and 100"),
  body("variation")
    .optional()
    .isObject()
    .withMessage("Variation must be an object"),
  body("variation.sku")
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage("Variation SKU must be between 1 and 50 characters"),
];

export const validateUpdateOrderToPaid = [
  param("id").isMongoId().withMessage("Invalid order ID"),
  body("paymentResult.id").notEmpty().withMessage("Payment ID is required"),
  body("paymentResult.status")
    .notEmpty()
    .withMessage("Payment status is required"),
  body("paymentResult.update_time")
    .notEmpty()
    .withMessage("Payment update time is required"),
  body("paymentResult.email_address")
    .optional()
    .isEmail()
    .withMessage("Email should be valid if provided"),
  body("paymentResult.paymentMethod")
    .optional()
    .isIn(["stripe", "paypal", "card"])
    .withMessage("Invalid payment method"),
  body("paymentResult.transactionFee")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Transaction fee must be greater than or equal to 0"),
];

export const validateUpdateOrderStatus = [
  param("id").isMongoId().withMessage("Invalid order ID"),
  body("status")
    .isIn([
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
      "on-hold",
      "failed",
      "completed",
    ])
    .withMessage("Invalid order status"),
  body("note")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Note cannot exceed 500 characters"),
];

// Parameter validation
export const validateMongoId = [
  param("id").isMongoId().withMessage("Invalid ID format"),
];

// Query validation for orders
export const validateOrderQuery = [
  query("page")
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage("Page must be between 1 and 1000"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("status")
    .optional()
    .isIn([
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
      "on-hold",
      "failed",
      "completed",
    ])
    .withMessage("Invalid order status"),
  query("sort")
    .optional()
    .isIn([
      "createdAt",
      "totalPrice",
      "status",
      "-createdAt",
      "-totalPrice",
      "-status",
    ])
    .withMessage("Invalid sort parameter"),
];
