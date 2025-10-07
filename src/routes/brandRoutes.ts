// src/routes/brandRoutes.ts

import express from "express";
import {
  createBrand,
  deleteBrand,
  getAllBrands,
  getBrandById,
  updateBrand,
} from "../controllers/brandController";
import { admin, protect } from "../middleware/authMiddleware";
import {
  validateCreateBrand,
  validateUpdateBrand,
} from "../middleware/brandValidationMiddleware";
import { handleValidationErrors } from "../middleware/errorMiddleware";
import { generalRateLimiters } from "../middleware/rateLimit";

const brandRouter = express.Router();

brandRouter.use(generalRateLimiters.api);
// Public routes
brandRouter.route("/").get(getAllBrands);
brandRouter.route("/:id").get(getBrandById);

// Admin routes
brandRouter
  .route("/")
  .post(
    protect,
    admin,
    generalRateLimiters.strict,
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
    validateUpdateBrand,
    handleValidationErrors,
    updateBrand
  )
  .delete(protect, admin, generalRateLimiters.strict, deleteBrand);

export default brandRouter;
