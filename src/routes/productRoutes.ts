// src/routes/productRoutes.ts

import express from "express";
import {
  createProduct,
  deleteProduct,
  getFeaturedProducts,
  getOnSaleProducts,
  getProductById,
  getProducts,
  updateProduct,
  searchProducts,
  getProductStats,
  bulkUpdateProducts,
  bulkDeleteProducts,
  getLowStockProducts,
  adjustStock,
} from "../controllers/productController";
import { admin, protect } from "../middleware/authMiddleware";
import { handleValidationErrors } from "../middleware/errorMiddleware";
import {
  validateCreateProduct,
  validateUpdateProduct,
  validateBulkUpdate,
  validateBulkDelete,
  validateStockAdjustment,
  validateLowStockQuery,
} from "../middleware/productValidationMiddleware";
import {
  generalRateLimiters,
  productRateLimiters,
} from "../middleware/rateLimit";
import { productImageUpload } from "../middleware/uploadMiddleware";

const productRouter = express.Router();

// Apply general rate limiting to all routes
productRouter.use(generalRateLimiters.api);

// Public routes - Order matters! Specific routes before :id parameter
productRouter.route("/featured").get(getFeaturedProducts);
productRouter.route("/sale").get(getOnSaleProducts);
productRouter.route("/search").get(searchProducts);

// Admin-only query routes
productRouter.route("/stats").get(protect, admin, getProductStats);

productRouter
  .route("/low-stock")
  .get(
    protect,
    admin,
    validateLowStockQuery,
    handleValidationErrors,
    getLowStockProducts
  );

// Bulk operations routes
productRouter
  .route("/bulk")
  .patch(
    protect,
    admin,
    generalRateLimiters.strict,
    validateBulkUpdate,
    handleValidationErrors,
    bulkUpdateProducts
  )
  .delete(
    protect,
    admin,
    generalRateLimiters.strict,
    validateBulkDelete,
    handleValidationErrors,
    bulkDeleteProducts
  );

// Main product CRUD routes
productRouter
  .route("/")
  .get(getProducts)
  .post(
    protect,
    admin,
    productRateLimiters.create,
    productImageUpload,
    validateCreateProduct,
    handleValidationErrors,
    createProduct
  );

// Stock adjustment route (must come before /:id to avoid conflict)
productRouter
  .route("/:id/stock")
  .patch(
    protect,
    admin,
    generalRateLimiters.strict,
    validateStockAdjustment,
    handleValidationErrors,
    adjustStock
  );

// Single product operations (/:id must be last to avoid route conflicts)
productRouter
  .route("/:id")
  .get(getProductById)
  .put(
    protect,
    admin,
    generalRateLimiters.strict,
    productImageUpload,
    validateUpdateProduct,
    handleValidationErrors,
    updateProduct
  )
  .delete(protect, admin, generalRateLimiters.strict, deleteProduct);

export default productRouter;
