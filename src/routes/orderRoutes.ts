import express from "express";
import {
  getOrderAnalytics,
  getUserOrderStats,
} from "../controllers/orderAnalyticsContorller";
import {
  addTrackingInfo,
  cancelOrder,
  // Order management
  createOrder,
  exportOrders,
  getMyOrders,
  getOrderById,
  getOrders,
  searchOrders,
  updateOrderStatus,
  updateOrderToDelivered,
  updateOrderToPaid,
} from "../controllers/orderController";
import { admin, protect } from "../middleware/authMiddleware";
import { handleValidationErrors } from "../middleware/errorMiddleware";
import {
  validateAddTrackingInfo,
  validateCancelOrder,
  validateCreateOrder,
  validatePagination,
  validateUpdateOrderStatus,
  validateUpdateToPaid,
} from "../middleware/orderValidationMiddleware";
import {
  generalRateLimiters,
  orderRateLimiters,
} from "../middleware/rateLimit";

const orderRouter = express.Router();

// Apply general rate limiting to all order routes
orderRouter.use(generalRateLimiters.api);

// User order routes
orderRouter
  .route("/myorders")
  .get(protect, validatePagination, handleValidationErrors, getMyOrders);

orderRouter.route("/user-stats").get(protect, getUserOrderStats);

// Main order routes
orderRouter
  .route("/")
  .post(
    protect,
    orderRateLimiters.creation,
    validateCreateOrder,
    handleValidationErrors,
    createOrder
  )
  .get(protect, admin, validatePagination, handleValidationErrors, getOrders);

orderRouter.route("/search").get(protect, searchOrders);

orderRouter.route("/analytics").get(protect, admin, getOrderAnalytics);

orderRouter.route("/export").get(protect, admin, exportOrders);

// Individual order routes
orderRouter.route("/:id").get(protect, getOrderById);

// Payment update with specific rate limiting
orderRouter
  .route("/:id/pay")
  .put(
    protect,
    orderRateLimiters.payment,
    validateUpdateToPaid,
    handleValidationErrors,
    updateOrderToPaid
  );

// Admin order management routes with rate limiting
orderRouter
  .route("/:id/status")
  .put(
    protect,
    admin,
    orderRateLimiters.adminOperations,
    validateUpdateOrderStatus,
    handleValidationErrors,
    updateOrderStatus
  );

orderRouter
  .route("/:id/deliver")
  .put(
    protect,
    admin,
    orderRateLimiters.adminOperations,
    updateOrderToDelivered
  );

orderRouter
  .route("/:id/tracking")
  .put(
    protect,
    admin,
    orderRateLimiters.adminOperations,
    validateAddTrackingInfo,
    handleValidationErrors,
    addTrackingInfo
  );

// Order cancellation with specific rate limiting
orderRouter
  .route("/:id/cancel")
  .put(
    protect,
    orderRateLimiters.cancel,
    validateCancelOrder,
    handleValidationErrors,
    cancelOrder
  );

export default orderRouter;
