// src/routes/adminRoutes.ts
import express from "express";
import {
  banUser,
  deleteReviewByAdmin,
  deleteUser,
  getAllReviews,
  getAllUsers,
  getUserById,
  getUserOrders,
  getUserReviews,
  suspendUser,
  unbanUser,
  updateUserRole,
} from "../controllers/adminUserController";
import {
  validateBanUser,
  validatePagination,
  validateReviewFilters,
  validateReviewId,
  validateUnbanUser,
  validateUpdateUserRole,
  validateUserFilters,
  validateUserId,
} from "../middleware/adminValidationMiddleware";
import { admin, protect } from "../middleware/authMiddleware";
import { handleValidationErrors } from "../middleware/errorMiddleware";
import { generalRateLimiters } from "../middleware/rateLimit";

const adminRouter = express.Router();

// Apply protection and admin middleware to all routes
adminRouter.use(protect);
adminRouter.use(admin);
adminRouter.use(generalRateLimiters.api);

// ============ USER MANAGEMENT ROUTES ============

/**
 * Get all users with filtering, sorting, and pagination
 * @route   GET /api/admin/users
 * @query   ?page=1&limit=10&sort=-createdAt&status=active&role=user&keyword=search
 */
adminRouter.get(
  "/users",
  validateUserFilters,
  handleValidationErrors,
  getAllUsers
);

/**
 * Get user by ID with statistics
 * @route   GET /api/admin/users/:id
 */
adminRouter.get(
  "/users/:id",
  validateUserId,
  handleValidationErrors,
  getUserById
);

/**
 * Ban user
 * @route   PUT /api/admin/users/:id/ban
 * @body    { reason?: string }
 */
adminRouter.put(
  "/users/:id/ban",
  validateBanUser,
  handleValidationErrors,
  banUser
);

/**
 * Suspend user temporarily
 * @route   PUT /api/admin/users/:id/suspend
 * @body    { reason?: string }
 */
adminRouter.put(
  "/users/:id/suspend",
  validateBanUser,
  handleValidationErrors,
  suspendUser
);

/**
 * Unban or unsuspend user
 * @route   PUT /api/admin/users/:id/unban
 */
adminRouter.put(
  "/users/:id/unban",
  validateUnbanUser,
  handleValidationErrors,
  unbanUser
);

/**
 * Update user role
 * @route   PUT /api/admin/users/:id/role
 * @body    { role: 'user' | 'admin' }
 */
adminRouter.put(
  "/users/:id/role",
  validateUpdateUserRole,
  handleValidationErrors,
  updateUserRole
);

/**
 * Delete user
 * @route   DELETE /api/admin/users/:id
 */
adminRouter.delete(
  "/users/:id",
  validateUserId,
  handleValidationErrors,
  deleteUser
);

// ============ USER DATA ROUTES ============

/**
 * Get user's reviews
 * @route   GET /api/admin/users/:id/reviews
 * @query   ?page=1&limit=10&sort=-createdAt
 */
adminRouter.get(
  "/users/:id/reviews",
  validateUserId,
  validatePagination,
  handleValidationErrors,
  getUserReviews
);

/**
 * Get user's orders
 * @route   GET /api/admin/users/:id/orders
 * @query   ?page=1&limit=10&sort=-createdAt
 */
adminRouter.get(
  "/users/:id/orders",
  validateUserId,
  validatePagination,
  handleValidationErrors,
  getUserOrders
);

// ============ REVIEW MANAGEMENT ROUTES ============

/**
 * Get all reviews with filtering
 * @route   GET /api/admin/reviews
 * @query   ?page=1&limit=10&sort=-createdAt&rating=5&user=userId&product=productId
 */
adminRouter.get(
  "/reviews",
  validateReviewFilters,
  handleValidationErrors,
  getAllReviews
);

/**
 * Delete review by admin
 * @route   DELETE /api/admin/reviews/:id
 */
adminRouter.delete(
  "/reviews/:id",
  validateReviewId,
  handleValidationErrors,
  deleteReviewByAdmin
);

export default adminRouter;
