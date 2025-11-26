import express from "express";
import {
  adjustStock,
  bulkDeleteProducts,
  bulkUpdateProducts,
  createProduct,
  deleteProduct,
  getFeaturedProducts,
  getLowStockProducts,
  getOnSaleProducts,
  getProductById,
  getProducts,
  getProductStats,
  searchProducts,
  updateProduct,
  adjustVariationStock,
  getOutOfStockProducts,
} from "../controllers/productController";
import { admin, protect } from "../middleware/authMiddleware";
import { handleValidationErrors } from "../middleware/errorMiddleware";
import {
  validateBulkDelete,
  validateBulkUpdate,
  validateCreateProduct,
  validateLowStockQuery,
  validateSearchQuery,
  validateStockAdjustment,
  validateUpdateProduct,
} from "../middleware/productValidationMiddleware";
import {
  generalRateLimiters,
  productRateLimiters,
} from "../middleware/rateLimit";
import { productImageUpload } from "../middleware/uploadMiddleware";

const productRouter = express.Router();

// Apply general rate limiting to all routes
productRouter.use(generalRateLimiters.api);

// ============================================================================
// PUBLIC ROUTES - Order matters! Specific routes before :id parameter
// ============================================================================

// Featured products
productRouter.route("/featured").get(getFeaturedProducts);

// Products on sale
productRouter.route("/sale").get(getOnSaleProducts);

// Search products - WITH VALIDATION
productRouter
  .route("/search")
  .get(validateSearchQuery, handleValidationErrors, searchProducts);

// ============================================================================
// ADMIN-ONLY QUERY ROUTES
// ============================================================================

// Product statistics
productRouter.route("/stats").get(protect, admin, getProductStats);

// Low stock products (main list)
productRouter
  .route("/low-stock")
  .get(
    protect,
    admin,
    validateLowStockQuery,
    handleValidationErrors,
    getLowStockProducts
  );

productRouter.route("/out-of-stock").get(protect, admin, getOutOfStockProducts);

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

// ============================================================================
// MAIN PRODUCT CRUD ROUTES
// ============================================================================

// Get all products / Create product
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

// ============================================================================
// SPECIFIC PRODUCT ROUTES (must come before /:id to avoid conflicts)
// ============================================================================

// Stock adjustment route
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

// Variation stock adjustment route (NEW)
productRouter
  .route("/:id/variations/:variationId/stock")
  .patch(
    protect,
    admin,
    generalRateLimiters.strict,
    validateStockAdjustment,
    handleValidationErrors,
    adjustVariationStock
  );

// ============================================================================
// SINGLE PRODUCT OPERATIONS (/:id must be last to avoid route conflicts)
// ============================================================================

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
