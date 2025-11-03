import express from "express";
import {
  addToCart,
  clearCart,
  getCart,
  removeFromCart,
  updateCartItem,
} from "../controllers/cartController";
import {
  addToFavorites,
  addUserAddress,
  deleteAvatar,
  deleteUserAddress,
  getFavorites,
  getOrderHistory,
  getUserProfile,
  getUsers,
  removeFromFavorites,
  updateUserAddress,
  updateUserPassword,
  updateUserProfile,
  uploadAvatar,
} from "../controllers/userController";
import { admin, protect } from "../middleware/authMiddleware";
import {
  validateAddToCart,
  validateUpdateCartItem,
} from "../middleware/cartValidationMiddleware";
import { handleValidationErrors } from "../middleware/errorMiddleware";
import {
  ecommerceRateLimiters,
  generalRateLimiters,
  userRateLimiters,
} from "../middleware/rateLimit";
import { avatarImageUpload } from "../middleware/uploadMiddleware";
import {
  validateAddAddress,
  validateFavoriteItem,
  validatePagination,
  validateUpdateAddress,
  validateUpdatePassword,
  validateUpdateProfile,
} from "../middleware/userValidationMiddleware";

const userRouter = express.Router();

// Apply general rate limiting to all user routes
userRouter.use(generalRateLimiters.api);

// Profile management with specific rate limiting
userRouter
  .route("/profile")
  .get(protect, getUserProfile)
  .put(
    protect,
    userRateLimiters.profileUpdate,
    validateUpdateProfile,
    handleValidationErrors,
    updateUserProfile
  );

// Avatar routes
userRouter
  .route("/avatar")
  .put(protect, userRateLimiters.profileUpdate, avatarImageUpload, uploadAvatar)
  .delete(protect, deleteAvatar);

// Password update with strict rate limiting
userRouter.put(
  "/update-password",
  protect,
  userRateLimiters.passwordChange,
  validateUpdatePassword,
  handleValidationErrors,
  updateUserPassword
);

// Address routes
userRouter
  .route("/address")
  .post(
    protect,
    generalRateLimiters.strict,
    validateAddAddress,
    handleValidationErrors,
    addUserAddress
  );

userRouter
  .route("/address/:addressId")
  .put(
    protect,
    generalRateLimiters.strict,
    validateUpdateAddress,
    handleValidationErrors,
    updateUserAddress
  )
  .delete(protect, deleteUserAddress);

// Cart routes with specific rate limiting
userRouter
  .route("/cart")
  .get(protect, getCart)
  .post(
    protect,
    ecommerceRateLimiters.cart,
    validateAddToCart,
    handleValidationErrors,
    addToCart
  )
  .delete(protect, ecommerceRateLimiters.cart, clearCart);

userRouter
  .route("/cart/:productId")
  .put(
    protect,
    ecommerceRateLimiters.cart,
    validateUpdateCartItem,
    handleValidationErrors,
    updateCartItem
  )
  .delete(protect, ecommerceRateLimiters.cart, removeFromCart);

// Favorites routes with specific rate limiting
userRouter
  .route("/favorites")
  .get(protect, validatePagination, handleValidationErrors, getFavorites)
  .post(
    protect,
    ecommerceRateLimiters.favorites,
    validateFavoriteItem,
    handleValidationErrors,
    addToFavorites
  );

userRouter
  .route("/favorites/:productId")
  .delete(protect, ecommerceRateLimiters.favorites, removeFromFavorites);

// Order history route
userRouter
  .route("/orders")
  .get(protect, validatePagination, handleValidationErrors, getOrderHistory);

// Admin routes
userRouter.route("/").get(protect, admin, getUsers);

export default userRouter;
