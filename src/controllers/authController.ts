import crypto from "crypto";
import { Request, Response } from "express";
import config from "../config/config";
import User from "../models/userModel";
import { UserDocument } from "../types/user.types";
import catchAsync from "../utils/catchAsync";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../utils/emailService";
import generateToken from "../utils/generateToken";

/**
 * @desc    Auth user & get token
 * @route   POST /api/users/login
 * @access  Public
 */
export const loginUser = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = (await User.findOne({ email }).select(
    "+password"
  )) as UserDocument | null;

  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  res.status(200).json({
    status: "success",
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      token: generateToken(user._id as string),
    },
  });
});

/**
 * @desc    Register a new user
 * @route   POST /api/users
 * @access  Public
 */
export const registerUser = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password, phone } = req.body;

  // Check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
  }

  // Create new user
  const user = (await User.create({
    name,
    email,
    password,
    phone,
  })) as UserDocument;

  // Generate email verification token
  const verificationToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // Create verification URL
  const verificationURL = `${config.frontendBaseUrl}/verify-email/${verificationToken}`;

  try {
    // Send verification email
    await sendVerificationEmail(user.email, user.name, verificationURL);

    res.status(201).json({
      status: "success",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        token: generateToken(user._id as string),
      },
      // In a real application, you would remove the following line
      verificationURL: verificationURL,
    });
  } catch (err) {
    // If there's an error sending the email, reset the token fields but keep the user
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(201).json({
      status: "success",
      message:
        "User registered successfully but verification email could not be sent",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        token: generateToken(user._id as string),
      },
    });
  }
});

/**
 * @desc    Request password reset
 * @route   POST /api/users/forgot-password
 * @access  Public
 */
export const forgotPassword = catchAsync(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "No user found with that email" });
    }

    // Generate reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetURL = `${config.frontendBaseUrl}/reset-password/${resetToken}`;

    // In a production environment, you would send an email with the reset URL
    // For this implementation, we'll just return the token in the response
    // NOTE: In a real application, you would NOT send the token in the response for security reasons

    try {
      // Send password reset email
      await sendPasswordResetEmail(user.email, user.name, resetURL);

      res.status(200).json({
        status: "success",
        message: "Password reset token sent to email",
        // In a real application, you would remove the following line
        resetURL: resetURL,
      });
    } catch (err) {
      // If there's an error sending the email, reset the token fields
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        status: "error",
        message: "There was an error sending the email. Try again later.",
      });
    }
  }
);

/**
 * @desc    Verify user email
 * @route   GET /api/users/verify-email/:token
 * @access  Public
 */
export const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const { token } = req.params;

  // Hash the token from the URL to compare with stored hashed token
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // Find user with the token and check if token is still valid
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      status: "fail",
      message: "Token is invalid or has expired",
    });
  }

  // Update user verification status
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    message: "Email verified successfully",
  });
});

/**
 * @desc    Reset password
 * @route   POST /api/users/reset-password/:token
 * @access  Public
 */
export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { token } = req.params;
  const { password } = req.body;

  // Hash the token from the URL to compare with stored hashed token
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // Find user with the token and check if token is still valid
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      status: "fail",
      message: "Token is invalid or has expired",
    });
  }

  // Update password and clear reset token fields
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Generate new JWT token for the user
  const jwtToken = generateToken(user._id as string);

  res.status(200).json({
    status: "success",
    message: "Password reset successfully",
    data: {
      token: jwtToken,
    },
  });
});
