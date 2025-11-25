// src/middleware/orderValidationMiddleware.ts
import { body, param, query, ValidationChain } from "express-validator";

/**
 * Validation for creating an order
 */
export const validateCreateOrder: ValidationChain[] = [
  // Order items validation
  body("orderItems")
    .isArray({ min: 1 })
    .withMessage("Order must contain at least one item"),

  body("orderItems.*.product")
    .notEmpty()
    .withMessage("Product ID is required")
    .isMongoId()
    .withMessage("Invalid product ID"),

  body("orderItems.*.name")
    .notEmpty()
    .withMessage("Product name is required")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Product name must be between 1 and 200 characters"),

  body("orderItems.*.quantity")
    .isInt({ min: 1, max: 1000 })
    .withMessage("Quantity must be between 1 and 1000"),

  body("orderItems.*.price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),

  body("orderItems.*.image")
    .notEmpty()
    .withMessage("Product image is required")
    .isString(),

  // Optional variation fields
  body("orderItems.*.variation.sku").optional().isString().trim(),

  body("orderItems.*.variation.size").optional().isString().trim(),

  body("orderItems.*.variation.color").optional().isString().trim(),

  // Shipping address validation
  body("shippingAddress")
    .notEmpty()
    .withMessage("Shipping address is required"),

  body("shippingAddress.address")
    .notEmpty()
    .withMessage("Street address is required")
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
    .notEmpty()
    .withMessage("Postal code is required")
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage("Postal code must be between 3 and 20 characters"),

  body("shippingAddress.country")
    .notEmpty()
    .withMessage("Country is required")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Country must be between 2 and 100 characters"),

  body("shippingAddress.phoneNumber")
    .optional()
    .trim()
    .matches(/^\+?[\d\s-()]{10,20}$/)
    .withMessage("Invalid phone number format"),

  // Payment method validation
  body("paymentMethod")
    .notEmpty()
    .withMessage("Payment method is required")
    .trim()
    .isIn(["card", "paypal", "stripe", "cod", "bank_transfer"])
    .withMessage("Invalid payment method"),

  // Price validations - THESE ARE NOW REQUIRED FROM FRONTEND
  body("itemsPrice")
    .isFloat({ min: 0 })
    .withMessage("Items price must be a positive number"),

  body("subtotal")
    .isFloat({ min: 0 })
    .withMessage("Subtotal must be a positive number"),

  body("taxPrice")
    .isFloat({ min: 0 })
    .withMessage("Tax price must be a positive number"),

  body("shippingPrice")
    .isFloat({ min: 0 })
    .withMessage("Shipping price must be a positive number"),

  body("totalPrice")
    .isFloat({ min: 0 })
    .withMessage("Total price must be a positive number"),

  body("discountAmount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Discount amount must be a positive number"),

  // Optional discount validation
  body("discountCode")
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage("Discount code must be between 3 and 50 characters"),

  // Optional notes
  body("notes")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Notes cannot exceed 500 characters"),
];

/**
 * Validation for updating order to paid
 */
export const validateUpdateToPaid: ValidationChain[] = [
  param("id").isMongoId().withMessage("Invalid order ID"),

  body("id")
    .notEmpty()
    .withMessage("Payment transaction ID is required")
    .trim(),

  body("status").notEmpty().withMessage("Payment status is required").trim(),

  body("update_time")
    .optional()
    .isISO8601()
    .withMessage("Invalid update time format"),

  body("email_address")
    .optional()
    .isEmail()
    .withMessage("Invalid email address"),

  body("payment_method").optional().trim(),

  body("transaction_fee")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Transaction fee must be positive"),
];

/**
 * Validation for updating order status
 */
export const validateUpdateOrderStatus: ValidationChain[] = [
  param("id").isMongoId().withMessage("Invalid order ID"),

  body("status")
    .notEmpty()
    .withMessage("Status is required")
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

  body("adminNotes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Admin notes cannot exceed 1000 characters"),

  // Shipping info for shipped status
  body("shippingInfo.carrier")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Carrier name must be between 2 and 100 characters"),

  body("shippingInfo.trackingNumber")
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage("Tracking number must be between 5 and 100 characters"),

  body("shippingInfo.estimatedDeliveryDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid estimated delivery date"),

  // Refund info for refunded status
  body("refund.amount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Refund amount must be positive"),

  body("refund.reason")
    .optional()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage("Refund reason must be between 5 and 500 characters"),
];

/**
 * Validation for adding tracking information
 */
export const validateAddTrackingInfo: ValidationChain[] = [
  param("id").isMongoId().withMessage("Invalid order ID"),

  body("carrier")
    .notEmpty()
    .withMessage("Carrier is required")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Carrier name must be between 2 and 100 characters"),

  body("trackingNumber")
    .notEmpty()
    .withMessage("Tracking number is required")
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage("Tracking number must be between 5 and 100 characters"),

  body("estimatedDeliveryDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid estimated delivery date")
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      if (date < now) {
        throw new Error("Estimated delivery date cannot be in the past");
      }
      return true;
    }),
];

/**
 * Validation for cancelling an order
 */
export const validateCancelOrder: ValidationChain[] = [
  param("id").isMongoId().withMessage("Invalid order ID"),

  body("reason")
    .optional()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage("Cancellation reason must be between 5 and 500 characters"),
];

/**
 * Validation for pagination
 */
export const validatePagination: ValidationChain[] = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("sort").optional().isString().withMessage("Sort must be a string"),

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
    .withMessage("Invalid status filter"),

  query("isPaid")
    .optional()
    .isBoolean()
    .withMessage("isPaid must be a boolean"),

  query("isDelivered")
    .optional()
    .isBoolean()
    .withMessage("isDelivered must be a boolean"),
];

/**
 * Validation for order search
 */
export const validateOrderSearch: ValidationChain[] = [
  query("q")
    .notEmpty()
    .withMessage("Search query is required")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Search query must be between 2 and 100 characters"),
];

/**
 * Validation for order export
 */
export const validateOrderExport: ValidationChain[] = [
  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid start date format"),

  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid end date format")
    .custom((value, { req }) => {
      if (req.query && req.query.startDate && value) {
        const start = new Date(req.query.startDate as string);
        const end = new Date(value);
        if (end < start) {
          throw new Error("End date must be after start date");
        }
      }
      return true;
    }),

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
    .withMessage("Invalid status filter"),
];
