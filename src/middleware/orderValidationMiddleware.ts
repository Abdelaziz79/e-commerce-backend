import { body, param, query } from "express-validator";
import { OrderStatus } from "../types/order.types";

/**
 * Validate create order request
 */
export const validateCreateOrder = [
  // Order items validation
  body("orderItems")
    .isArray({ min: 1 })
    .withMessage("Order items must be an array with at least one item"),

  body("orderItems.*.name")
    .trim()
    .notEmpty()
    .withMessage("Order item name is required")
    .isLength({ max: 255 })
    .withMessage("Order item name must be less than 255 characters"),

  body("orderItems.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Order item quantity must be at least 1"),

  body("orderItems.*.price")
    .isFloat({ min: 0 })
    .withMessage("Order item price must be a positive number"),

  body("orderItems.*.product")
    .isMongoId()
    .withMessage("Order item product must be a valid product ID"),

  body("orderItems.*.image")
    .trim()
    .notEmpty()
    .withMessage("Order item image is required")
    .custom((value) => {
      const urlRegex = /^https?:\/\/.*\.(jpg|jpeg|png|gif|webp)$/i;
      const pathRegex = /^\/.*\.(jpg|jpeg|png|gif|webp)$/i;
      if (!urlRegex.test(value) && !pathRegex.test(value)) {
        throw new Error("Order item image must be a valid URL or path");
      }
      return true;
    }),

  // Variation validation (optional)
  body("orderItems.*.variation.size")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Size must be less than 50 characters"),

  body("orderItems.*.variation.color")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Color must be less than 50 characters"),

  body("orderItems.*.variation.material")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Material must be less than 50 characters"),

  body("orderItems.*.variation.style")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Style must be less than 50 characters"),

  body("orderItems.*.variation.sku")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("SKU must be less than 100 characters"),

  // Shipping address validation
  body("shippingAddress.address")
    .trim()
    .notEmpty()
    .withMessage("Shipping address is required")
    .isLength({ max: 255 })
    .withMessage("Address must be less than 255 characters"),

  body("shippingAddress.city")
    .trim()
    .notEmpty()
    .withMessage("City is required")
    .isLength({ max: 100 })
    .withMessage("City must be less than 100 characters"),

  body("shippingAddress.postalCode")
    .trim()
    .notEmpty()
    .withMessage("Postal code is required")
    .isLength({ max: 20 })
    .withMessage("Postal code must be less than 20 characters"),

  body("shippingAddress.country")
    .trim()
    .notEmpty()
    .withMessage("Country is required")
    .isLength({ max: 100 })
    .withMessage("Country must be less than 100 characters"),

  body("shippingAddress.phoneNumber")
    .optional()
    .trim()
    .matches(/^\+?[\d\s-()]{10,20}$/)
    .withMessage("Phone number must be valid"),

  // Payment method
  body("paymentMethod")
    .trim()
    .notEmpty()
    .withMessage("Payment method is required")
    .isIn(["PayPal", "Stripe", "Credit Card", "Cash on Delivery"])
    .withMessage("Invalid payment method"),

  // Price validation
  body("itemsPrice")
    .isFloat({ min: 0 })
    .withMessage("Items price must be a positive number"),

  body("taxPrice")
    .isFloat({ min: 0 })
    .withMessage("Tax price must be a positive number"),

  body("shippingPrice")
    .isFloat({ min: 0 })
    .withMessage("Shipping price must be a positive number"),

  body("totalPrice")
    .isFloat({ min: 0.01 })
    .withMessage("Total price must be greater than 0"),

  // Discount validation (optional)
  body("discount.code")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Discount code cannot be empty")
    .isLength({ max: 50 })
    .withMessage("Discount code must be less than 50 characters"),

  body("discount.type")
    .optional()
    .isIn(["percentage", "fixed"])
    .withMessage("Discount type must be 'percentage' or 'fixed'"),

  body("discount.value")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Discount value must be a positive number"),

  body("discount.description")
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage("Discount description must be less than 255 characters"),

  // Notes
  body("notes")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Notes must be less than 500 characters"),
];

/**
 * Validate update order status request
 */
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
    ] as OrderStatus[])
    .withMessage("Invalid order status"),

  body("note")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Note must be less than 500 characters"),

  body("carrier")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Carrier must be less than 100 characters"),

  body("trackingNumber")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Tracking number must be less than 100 characters"),

  body("estimatedDeliveryDate")
    .optional()
    .isISO8601()
    .withMessage("Estimated delivery date must be a valid date"),

  body("refundAmount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Refund amount must be a positive number"),

  body("refundReason")
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage("Refund reason must be less than 255 characters"),

  body("adminNotes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Admin notes must be less than 1000 characters"),
];

/**
 * Validate add tracking info request
 */
export const validateAddTrackingInfo = [
  param("id").isMongoId().withMessage("Invalid order ID"),

  body("carrier")
    .trim()
    .notEmpty()
    .withMessage("Carrier is required")
    .isLength({ max: 100 })
    .withMessage("Carrier must be less than 100 characters"),

  body("trackingNumber")
    .trim()
    .notEmpty()
    .withMessage("Tracking number is required")
    .isLength({ max: 100 })
    .withMessage("Tracking number must be less than 100 characters"),

  body("estimatedDeliveryDate")
    .optional()
    .isISO8601()
    .withMessage("Estimated delivery date must be a valid date")
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      if (date <= now) {
        throw new Error("Estimated delivery date must be in the future");
      }
      return true;
    }),
];

/**
 * Validate cancel order request
 */
export const validateCancelOrder = [
  param("id").isMongoId().withMessage("Invalid order ID"),

  body("reason")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Cancellation reason must be less than 500 characters"),
];

/**
 * Validate update to paid request
 */
export const validateUpdateToPaid = [
  param("id").isMongoId().withMessage("Invalid order ID"),

  body("id").trim().notEmpty().withMessage("Payment ID is required"),

  body("status").trim().notEmpty().withMessage("Payment status is required"),

  body("update_time")
    .trim()
    .notEmpty()
    .withMessage("Payment update time is required"),

  body("email_address")
    .isEmail()
    .withMessage("Valid email address is required"),

  body("payment_method")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Payment method must be less than 50 characters"),

  body("transaction_fee")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Transaction fee must be a positive number"),
];

/**
 * Validate pagination parameters
 */
export const validatePagination = [
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
    .trim()
    .matches(/^(-?[\w.]+)(,(-?[\w.]+))*$/)
    .withMessage("Invalid sort format"),

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
    ] as OrderStatus[])
    .withMessage("Invalid status filter"),

  query("user").optional().isMongoId().withMessage("Invalid user ID filter"),
];

/**
 * Validate order ID parameter (can be ObjectId or order number)
 */
export const validateOrderId = [
  param("id").custom((value) => {
    // Check if it's a valid MongoDB ObjectId
    if (/^[0-9a-fA-F]{24}$/.test(value)) {
      return true;
    }
    // Check if it's a valid order number format (ORD-YYMMDD-XXXXXX)
    if (/^ORD-\d{6}-\d{6}$/.test(value)) {
      return true;
    }
    throw new Error("Invalid order ID or order number");
  }),
];
