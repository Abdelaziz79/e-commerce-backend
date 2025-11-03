import express from "express";
import {
  forgotPassword,
  loginUser,
  registerUser,
  resetPassword,
  verifyEmail,
} from "../controllers/authController";
import {
  validateForgotPassword,
  validateResetPassword,
  validateUserLogin,
  validateUserRegistration,
} from "../middleware/authValidationMiddleware";
import { handleValidationErrors } from "../middleware/errorMiddleware";
import { authRateLimiters } from "../middleware/rateLimit";

const authRouter = express.Router();

// Public routes with rate limiting
authRouter.post(
  "/login",
  authRateLimiters.login,
  validateUserLogin,
  handleValidationErrors,
  loginUser
);

authRouter.post(
  "/register",
  authRateLimiters.register,
  validateUserRegistration,
  handleValidationErrors,
  registerUser
);

// Email verification and password reset routes
authRouter.get("/verify-email/:token", verifyEmail);

authRouter.post(
  "/forgot-password",
  authRateLimiters.forgotPassword,
  validateForgotPassword,
  handleValidationErrors,
  forgotPassword
);

authRouter.post(
  "/reset-password/:token",
  authRateLimiters.resetPassword,
  validateResetPassword,
  handleValidationErrors,
  resetPassword
);

export default authRouter;
