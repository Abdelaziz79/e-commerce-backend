import express from "express";
import {
  // Cart management
  addToCart,
  // Favorites management
  addToFavorites,
  // Address management
  addUserAddress,
  clearCart,
  deleteUserAddress,
  getCart,
  getFavorites,
  // Order history
  getOrderHistory,
  // User profile
  getUserProfile,
  // Admin
  getUsers,
  moveToFavorites,
  removeFromCart,
  removeFromFavorites,
  updateCartItem,
  updateUserAddress,
  updateUserPassword,
  updateUserProfile,
} from "../controllers/userController";
import { admin, protect } from "../middleware/authMiddleware";
import { handleValidationErrors } from "../middleware/errorMiddleware";
import {
  ecommerceRateLimiters,
  generalRateLimiters,
  userRateLimiters,
} from "../middleware/rateLimit";
import {
  validateAddAddress,
  validateCartItem,
  validateCartUpdate,
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
  .post(protect, validateAddAddress, handleValidationErrors, addUserAddress);

userRouter
  .route("/address/:addressId")
  .put(
    protect,
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
    validateCartItem,
    handleValidationErrors,
    addToCart
  )
  .delete(protect, ecommerceRateLimiters.cart, clearCart);

userRouter
  .route("/cart/:productId")
  .put(
    protect,
    ecommerceRateLimiters.cart,
    validateCartUpdate,
    handleValidationErrors,
    updateCartItem
  )
  .delete(protect, ecommerceRateLimiters.cart, removeFromCart);

userRouter
  .route("/cart/move-to-favorites/:productId")
  .post(protect, ecommerceRateLimiters.cart, moveToFavorites);

// Favorites routes with specific rate limiting
userRouter
  .route("/favorites")
  .get(protect, getFavorites)
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
