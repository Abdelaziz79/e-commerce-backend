// src/routes/brandRoutes.ts

import express from "express";
import {
  createBrand,
  deleteBrand,
  getAllBrands,
  getAllBrandsAdmin,
  getBrandById,
  searchBrands, // <-- Import new search controller
  searchBrandsAdmin, // <-- Import new admin search controller
  toggleBrandActive,
  updateBrand,
} from "../controllers/brandController";
import { admin, protect } from "../middleware/authMiddleware";
import {
  validateCreateBrand,
  validateUpdateBrand,
  validateBrandSearch, // <-- Import new validation
} from "../middleware/brandValidationMiddleware";
import { handleValidationErrors } from "../middleware/errorMiddleware";
import { generalRateLimiters } from "../middleware/rateLimit";
import { brandImageUpload } from "../middleware/uploadMiddleware";

const brandRouter = express.Router();

brandRouter.use(generalRateLimiters.api);

// --- Public routes ---
// Public search - only active brands
brandRouter
  .route("/search")
  .get(validateBrandSearch, handleValidationErrors, searchBrands);

// This now only returns ACTIVE brands
brandRouter.route("/").get(getAllBrands);
brandRouter.route("/:id").get(getBrandById);

// --- Admin routes ---

// Admin search - all brands (active and inactive)
brandRouter
  .route("/admin/search")
  .get(
    protect,
    admin,
    validateBrandSearch,
    handleValidationErrors,
    searchBrandsAdmin
  );

// Admin route to get ALL brands (active and inactive)
brandRouter.route("/admin/all").get(protect, admin, getAllBrandsAdmin);

brandRouter
  .route("/")
  .post(
    protect,
    admin,
    generalRateLimiters.strict,
    brandImageUpload,
    validateCreateBrand,
    handleValidationErrors,
    createBrand
  );

brandRouter
  .route("/:id")
  .put(
    protect,
    admin,
    generalRateLimiters.strict,
    brandImageUpload,
    validateUpdateBrand,
    handleValidationErrors,
    updateBrand
  )
  .delete(protect, admin, generalRateLimiters.strict, deleteBrand);

brandRouter
  .route("/:id/toggle-active")
  .put(protect, admin, generalRateLimiters.strict, toggleBrandActive);

export default brandRouter;
