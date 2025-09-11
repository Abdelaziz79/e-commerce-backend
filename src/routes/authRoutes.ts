import express from "express";
import {
  forgotPassword,
  loginUser,
  registerUser,
  resetPassword,
  verifyEmail,
} from "../controllers/userController";
import { handleValidationErrors } from "../middleware/errorMiddleware";
import {
  validateForgotPassword,
  validateResetPassword,
  validateUserLogin,
  validateUserRegistration,
} from "../middleware/userValidationMiddleware";

const router = express.Router();

// Public routes
router.post("/login", validateUserLogin, handleValidationErrors, loginUser);
router.post(
  "/register",
  validateUserRegistration,
  handleValidationErrors,
  registerUser
);

// Email verification and password reset routes
router.get("/verify-email/:token", verifyEmail);
router.post(
  "/forgot-password",
  validateForgotPassword,
  handleValidationErrors,
  forgotPassword
);
router.post(
  "/reset-password/:token",
  validateResetPassword,
  handleValidationErrors,
  resetPassword
);

export default router;
