import express from "express";
import {
  createProduct,
  createProductReview,
  deleteProduct,
  deleteProductReview,
  getFeaturedProducts,
  getOnSaleProducts,
  getProductById,
  getProductReviews,
  getProducts,
  updateProduct,
  updateProductReview,
} from "../controllers/productController";
import { admin, protect } from "../middleware/authMiddleware";
import { handleValidationErrors } from "../middleware/errorMiddleware";
import {
  validateCreateProduct,
  validateCreateReview,
  validateDeleteReview,
  validateUpdateProduct,
  validateUpdateReview,
} from "../middleware/productValidationMiddleware";
import {
  generalRateLimiters,
  productRateLimiters,
} from "../middleware/rateLimit";

const productRouter = express.Router();

// Apply general rate limiting to all product routes
productRouter.use(generalRateLimiters.api);

// Public routes
productRouter.route("/").get(getProducts);
productRouter.route("/featured").get(getFeaturedProducts);
productRouter.route("/sale").get(getOnSaleProducts);
productRouter.route("/:id").get(getProductById);
productRouter.route("/:id/reviews").get(getProductReviews);

// Admin product management with rate limiting
productRouter
  .route("/")
  .post(
    protect,
    admin,
    productRateLimiters.create,
    validateCreateProduct,
    handleValidationErrors,
    createProduct
  );

productRouter
  .route("/:id")
  .put(
    protect,
    admin,
    validateUpdateProduct,
    handleValidationErrors,
    updateProduct
  )
  .delete(protect, admin, deleteProduct);

// Product reviews with rate limiting
productRouter
  .route("/:id/reviews")
  .post(
    protect,
    productRateLimiters.review,
    validateCreateReview,
    handleValidationErrors,
    createProductReview
  );

productRouter
  .route("/:id/reviews/:reviewId")
  .put(
    protect,
    validateUpdateReview,
    handleValidationErrors,
    updateProductReview
  )
  .delete(
    protect,
    validateDeleteReview,
    handleValidationErrors,
    deleteProductReview
  );

export default productRouter;
