// src/routes/reviewRoutes.ts

import express from "express";
import {
  createReview,
  deleteReview,
  getAllReviews,
  getMyReviews,
  getProductReviewStats,
  getReviewById,
  updateReview,
  voteReviewHelpful,
} from "../controllers/reviewController";
import { protect } from "../middleware/authMiddleware";
import { handleValidationErrors } from "../middleware/errorMiddleware";
import {
  createRateLimit,
  generalRateLimiters,
  productRateLimiters,
} from "../middleware/rateLimit";
import {
  validateCreateReview,
  validateProductId,
  validateReviewId,
  validateUpdateReview,
} from "../middleware/reviewValidationMiddleware";
import { reviewImageUpload } from "../middleware/uploadMiddleware";

const reviewRouter = express.Router();

// Custom rate limiter for voting (more permissive than review creation)
const voteRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 votes per window
  message: "Too many vote attempts, please try again later",
});

// Apply general rate limiting to all routes
reviewRouter.use(generalRateLimiters.api);

// Public routes
reviewRouter.route("/").get(getAllReviews);

reviewRouter
  .route("/stats/:productId")
  .get(validateProductId, handleValidationErrors, getProductReviewStats);

// Private routes - user reviews
reviewRouter.route("/my-reviews").get(protect, getMyReviews);

reviewRouter
  .route("/:id")
  .get(validateReviewId, handleValidationErrors, getReviewById);

// Review creation with rate limiting and validation
reviewRouter
  .route("/")
  .post(
    protect,
    productRateLimiters.review,
    reviewImageUpload,
    validateCreateReview,
    handleValidationErrors,
    createReview
  );

// Vote helpful with rate limiting and validation
reviewRouter
  .route("/:id/helpful")
  .post(
    protect,
    voteRateLimit,
    validateReviewId,
    handleValidationErrors,
    voteReviewHelpful
  );

// Update and delete review
reviewRouter
  .route("/:id")
  .put(
    protect,
    productRateLimiters.review,
    reviewImageUpload,
    validateReviewId,
    validateUpdateReview,
    handleValidationErrors,
    updateReview
  )
  .delete(protect, validateReviewId, handleValidationErrors, deleteReview);

export default reviewRouter;
