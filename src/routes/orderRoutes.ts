import express from "express";
import {
  createOrder,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getMyOrders,
  getOrders,
  updateOrderStatus,
  addTrackingInfo,
  cancelOrder,
} from "../controllers/orderController";
import { protect, admin } from "../middleware/authMiddleware";
import { handleValidationErrors } from "../middleware/errorMiddleware";
import {
  validateCreateOrder,
  validateUpdateOrderToPaid,
  validateUpdateOrderStatus,
  validateMongoId,
} from "../middleware/orderValidationMiddleware";

const router = express.Router();

// Protected routes
router
  .route("/")
  .post(protect, validateCreateOrder, handleValidationErrors, createOrder)
  .get(protect, admin, getOrders);
router.route("/myorders").get(protect, getMyOrders);
router.route("/:id").get(protect, getOrderById);
router
  .route("/:id/pay")
  .put(
    protect,
    validateUpdateOrderToPaid,
    handleValidationErrors,
    updateOrderToPaid
  );
router.route("/:id/deliver").put(protect, admin, updateOrderToDelivered);
router
  .route("/:id/status")
  .put(
    protect,
    admin,
    validateUpdateOrderStatus,
    handleValidationErrors,
    updateOrderStatus
  );
router
  .route("/:id/tracking")
  .put(protect, admin, validateMongoId, handleValidationErrors, addTrackingInfo);
router
  .route("/:id/cancel")
  .put(protect, validateMongoId, handleValidationErrors, cancelOrder);

export default router;
