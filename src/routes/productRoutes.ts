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
} from "../controllers/productController";
import { admin, protect } from "../middleware/authMiddleware";
import { handleValidationErrors } from "../middleware/errorMiddleware";
import {
  validateCreateProduct,
  validateUpdateProduct,
} from "../middleware/productValidationMiddleware";
import {
  generalRateLimiters,
  productRateLimiters,
} from "../middleware/rateLimit";

const productRouter = express.Router();

productRouter.use(generalRateLimiters.api);

// Public routes
productRouter.route("/").get(getProducts);
productRouter.route("/featured").get(getFeaturedProducts);
productRouter.route("/sale").get(getOnSaleProducts);
productRouter.route("/:id").get(getProductById);

// Admin product management
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
    generalRateLimiters.strict,
    validateUpdateProduct,
    handleValidationErrors,
    updateProduct
  )
  .delete(protect, admin, deleteProduct);

export default productRouter;
