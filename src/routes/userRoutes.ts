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
  getFavorites,
  // Order history
  getOrderHistory,
  getUserProfile,
  getUsers,
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
  validateAddAddress,
  validateCartItem,
  validateFavoriteItem,
  validateUpdateAddress,
  validateUpdatePassword,
  validateUpdateProfile,
} from "../middleware/userValidationMiddleware";

const router = express.Router();

// Protected routes
router
  .route("/profile")
  .get(protect, getUserProfile)
  .put(
    protect,
    validateUpdateProfile,
    handleValidationErrors,
    updateUserProfile
  );

// update user password
router.put(
  "/update-password",
  protect,
  validateUpdatePassword,
  handleValidationErrors,
  updateUserPassword
);

// Address routes
router
  .route("/address")
  .post(protect, validateAddAddress, handleValidationErrors, addUserAddress);

router
  .route("/address/:addressId")
  .put(
    protect,
    validateUpdateAddress,
    handleValidationErrors,
    updateUserAddress
  )
  .delete(protect, deleteUserAddress);

// Cart routes
router
  .route("/cart")
  .post(protect, validateCartItem, handleValidationErrors, addToCart)
  .delete(protect, clearCart);

router
  .route("/cart/:productId")
  .put(protect, updateCartItem)
  .delete(protect, removeFromCart);

// Favorites routes
router
  .route("/favorites")
  .get(protect, getFavorites)
  .post(protect, validateFavoriteItem, handleValidationErrors, addToFavorites);

router.route("/favorites/:productId").delete(protect, removeFromFavorites);

// Order history route
router.route("/orders").get(protect, getOrderHistory);

// Admin routes
router.route("/").get(protect, admin, getUsers);

export default router;
