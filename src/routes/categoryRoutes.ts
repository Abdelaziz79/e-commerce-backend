// src/routes/categoryRoutes.ts

import express from "express";
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
} from "../controllers/categoryController";
import { admin, protect } from "../middleware/authMiddleware";
import {
  validateCreateCategory,
  validateUpdateCategory,
} from "../middleware/categoryValidationMiddleware";
import { handleValidationErrors } from "../middleware/errorMiddleware";
import { generalRateLimiters } from "../middleware/rateLimit";

const categoryRouter = express.Router();
categoryRouter.use(generalRateLimiters.api);
// Public routes
categoryRouter.route("/").get(getAllCategories);
categoryRouter.route("/:id").get(getCategoryById);

// Admin routes
categoryRouter
  .route("/")
  .post(
    protect,
    admin,
    generalRateLimiters.strict,
    validateCreateCategory,
    handleValidationErrors,
    createCategory
  );

categoryRouter
  .route("/:id")
  .put(
    protect,
    admin,
    generalRateLimiters.strict,
    validateUpdateCategory,
    handleValidationErrors,
    updateCategory
  )
  .delete(protect, admin, generalRateLimiters.strict, deleteCategory);

export default categoryRouter;
