// src/routes/adminSettingsRoutes.ts
import express from "express";
import {
  addDiscountCode,
  addShippingRate,
  addTaxRate,
  deleteDiscountCode,
  deleteShippingRate,
  deleteTaxRate,
  getPublicSettings,
  getSettings,
  toggleShippingEnabled,
  toggleTaxEnabled,
  updateDiscountCode,
  updateGeneralSettings,
  updateShippingRate,
  updateTaxRate,
  validateDiscountCode,
} from "../controllers/adminSettingsController";
import {
  validateCreateDiscountCode,
  validateCreateShippingRate,
  validateCreateTaxRate,
  validateDiscountCodeUsage,
  validateGeneralSettings,
  validateSettingId,
  validateUpdateDiscountCode,
  validateUpdateShippingRate,
  validateUpdateTaxRate,
} from "../middleware/adminSettingsValidationMiddleware";
import { admin, protect } from "../middleware/authMiddleware";
import { handleValidationErrors } from "../middleware/errorMiddleware";
import { generalRateLimiters } from "../middleware/rateLimit";

const adminSettingsRouter = express.Router();

// Apply general rate limiting
adminSettingsRouter.use(generalRateLimiters.api);

// Public routes
adminSettingsRouter.route("/public").get(getPublicSettings);

adminSettingsRouter
  .route("/discount/validate")
  .post(
    protect,
    validateDiscountCodeUsage,
    handleValidationErrors,
    validateDiscountCode
  );

// Protected admin routes
adminSettingsRouter.route("/").get(protect, admin, getSettings);

adminSettingsRouter
  .route("/general")
  .put(
    protect,
    admin,
    generalRateLimiters.strict,
    validateGeneralSettings,
    handleValidationErrors,
    updateGeneralSettings
  );

// Tax rate routes
adminSettingsRouter
  .route("/tax")
  .post(
    protect,
    admin,
    generalRateLimiters.strict,
    validateCreateTaxRate,
    handleValidationErrors,
    addTaxRate
  );

adminSettingsRouter
  .route("/tax/toggle")
  .put(protect, admin, generalRateLimiters.strict, toggleTaxEnabled);

adminSettingsRouter
  .route("/tax/:id")
  .put(
    protect,
    admin,
    generalRateLimiters.strict,
    validateSettingId,
    validateUpdateTaxRate,
    handleValidationErrors,
    updateTaxRate
  )
  .delete(
    protect,
    admin,
    generalRateLimiters.strict,
    validateSettingId,
    handleValidationErrors,
    deleteTaxRate
  );

// Shipping rate routes
adminSettingsRouter
  .route("/shipping")
  .post(
    protect,
    admin,
    generalRateLimiters.strict,
    validateCreateShippingRate,
    handleValidationErrors,
    addShippingRate
  );

adminSettingsRouter
  .route("/shipping/toggle")
  .put(protect, admin, generalRateLimiters.strict, toggleShippingEnabled);

adminSettingsRouter
  .route("/shipping/:id")
  .put(
    protect,
    admin,
    generalRateLimiters.strict,
    validateSettingId,
    validateUpdateShippingRate,
    handleValidationErrors,
    updateShippingRate
  )
  .delete(
    protect,
    admin,
    generalRateLimiters.strict,
    validateSettingId,
    handleValidationErrors,
    deleteShippingRate
  );

// Discount code routes
adminSettingsRouter
  .route("/discount")
  .post(
    protect,
    admin,
    generalRateLimiters.strict,
    validateCreateDiscountCode,
    handleValidationErrors,
    addDiscountCode
  );

adminSettingsRouter
  .route("/discount/:id")
  .put(
    protect,
    admin,
    generalRateLimiters.strict,
    validateSettingId,
    validateUpdateDiscountCode,
    handleValidationErrors,
    updateDiscountCode
  )
  .delete(
    protect,
    admin,
    generalRateLimiters.strict,
    validateSettingId,
    handleValidationErrors,
    deleteDiscountCode
  );

export default adminSettingsRouter;
