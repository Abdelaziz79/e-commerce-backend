// src/routes/categoryRoutes.ts

import express from "express";
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  getAllCategoriesAdmin,
  getCategoryById,
  searchCategories,
  searchCategoriesAdmin,
  toggleCategoryActive,
  updateCategory,
} from "../controllers/categoryController";
import { admin, protect } from "../middleware/authMiddleware";
import {
  validateCreateCategory,
  validateUpdateCategory,
  validateCategorySearch,
} from "../middleware/categoryValidationMiddleware";
import { handleValidationErrors } from "../middleware/errorMiddleware";
import { generalRateLimiters } from "../middleware/rateLimit";
import { categoryImageUpload } from "../middleware/uploadMiddleware";

const categoryRouter = express.Router();

categoryRouter.use(generalRateLimiters.api);

// --- Public routes ---
// Public search - only active categories
categoryRouter
  .route("/search")
  .get(validateCategorySearch, handleValidationErrors, searchCategories);

// This now only returns ACTIVE categories
categoryRouter.route("/").get(getAllCategories);
categoryRouter.route("/:id").get(getCategoryById);

// --- Admin routes ---

// Admin search - all categories (active and inactive)
categoryRouter
  .route("/admin/search")
  .get(
    protect,
    admin,
    validateCategorySearch,
    handleValidationErrors,
    searchCategoriesAdmin
  );

// Admin route to get ALL categories (active and inactive)
categoryRouter.route("/admin/all").get(protect, admin, getAllCategoriesAdmin);

categoryRouter
  .route("/")
  .post(
    protect,
    admin,
    generalRateLimiters.strict,
    categoryImageUpload,
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
    categoryImageUpload,
    validateUpdateCategory,
    handleValidationErrors,
    updateCategory
  )
  .delete(protect, admin, generalRateLimiters.strict, deleteCategory);

categoryRouter
  .route("/:id/toggle-active")
  .put(protect, admin, generalRateLimiters.strict, toggleCategoryActive);

export default categoryRouter;
