import express from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  getFeaturedProducts,
  getOnSaleProducts,
  getProductReviews,
} from "../controllers/productController";
import { protect, admin } from "../middleware/authMiddleware";
import { handleValidationErrors } from "../middleware/errorMiddleware";
import {
  validateCreateProduct,
  validateUpdateProduct,
  validateCreateReview,
} from "../middleware/productValidationMiddleware";

const router = express.Router();

// Public routes
router.route("/").get(getProducts);
router.route("/featured").get(getFeaturedProducts);
router.route("/sale").get(getOnSaleProducts);
router.route("/:id").get(getProductById);
router.route("/:id/reviews").get(getProductReviews);

// Protected routes
router
  .route("/")
  .post(
    protect,
    admin,
    validateCreateProduct,
    handleValidationErrors,
    createProduct
  );
router
  .route("/:id")
  .put(
    protect,
    admin,
    validateUpdateProduct,
    handleValidationErrors,
    updateProduct
  )
  .delete(protect, admin, deleteProduct);

router
  .route("/:id/reviews")
  .post(
    protect,
    validateCreateReview,
    handleValidationErrors,
    createProductReview
  );

export default router;
