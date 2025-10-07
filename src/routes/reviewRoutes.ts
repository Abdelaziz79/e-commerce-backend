// src/routes/reviewRoutes.ts

import express from "express";
import {
  createReview,
  deleteReview,
  getAllReviews,
  getReviewById,
  updateReview,
} from "../controllers/reviewController";
import { protect } from "../middleware/authMiddleware";
import { handleValidationErrors } from "../middleware/errorMiddleware";
import {
  generalRateLimiters,
  productRateLimiters,
} from "../middleware/rateLimit";
import {
  validateCreateReview,
  validateUpdateReview,
} from "../middleware/reviewValidationMiddleware";

const reviewRouter = express.Router();

reviewRouter.use(generalRateLimiters.api);

// Public routes
reviewRouter.route("/").get(getAllReviews);
reviewRouter.route("/:id").get(getReviewById);

// Private routes
reviewRouter
  .route("/")
  .post(
    protect,
    productRateLimiters.review,
    validateCreateReview,
    handleValidationErrors,
    createReview
  );

reviewRouter
  .route("/:id")
  .put(
    protect,
    productRateLimiters.review,
    validateUpdateReview,
    handleValidationErrors,
    updateReview
  )
  .delete(protect, deleteReview); // Owner or admin can delete

export default reviewRouter;
