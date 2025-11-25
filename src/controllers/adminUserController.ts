// src/controllers/adminUserController.ts
import { Request, Response } from "express";
import { Types } from "mongoose";
import Order from "../models/orderModel";
import Review from "../models/reviewModel";
import User from "../models/userModel";
import { AuthRequest } from "../types/user.types";
import APIFeatures from "../utils/apiFeatures";
import catchAsync from "../utils/catchAsync";

/**
 * @desc    Get all users (Admin)
 * @route   GET /api/admin/users
 * @access  Private/Admin
 * @query   ?page=1&limit=10&sort=-createdAt&status=active&role=user&keyword=search
 */
export const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const features = new APIFeatures(User.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const users = await features.query.select("-password");

  const totalFeatures = new APIFeatures(User.find(), req.query).filter();
  const total = await User.countDocuments(totalFeatures.query.getFilter());

  const page = Number(req.query.page?.toString() || "1");
  const limit = Number(req.query.limit?.toString() || "10");

  // Get user statistics
  const stats = await User.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: {
          $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
        },
        bannedUsers: {
          $sum: { $cond: [{ $eq: ["$status", "banned"] }, 1, 0] },
        },
        suspendedUsers: {
          $sum: { $cond: [{ $eq: ["$status", "suspended"] }, 1, 0] },
        },
        adminUsers: {
          $sum: { $cond: [{ $eq: ["$role", "admin"] }, 1, 0] },
        },
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    results: users.length,
    page,
    pages: Math.ceil(total / limit),
    total,
    stats: stats[0] || {
      totalUsers: 0,
      activeUsers: 0,
      bannedUsers: 0,
      suspendedUsers: 0,
      adminUsers: 0,
    },
    data: users,
  });
});

/**
 * Get user by ID (Admin) - FIXED to populate favorites
 * @route   GET /api/admin/users/:id
 * @access  Private/Admin
 */
export const getUserById = catchAsync(async (req: Request, res: Response) => {
  // FIXED: Added populate for favorites.product
  const user = await User.findById(req.params.id)
    .select("-password")
    .populate("bannedBy", "name email")
    .populate({
      path: "favorites.product",
      select: "name price images mainImage onSale salePrice countInStock",
    });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Get user statistics
  const orderCount = await Order.countDocuments({ user: user._id });
  const reviewCount = await Review.countDocuments({ user: user._id });

  const orderStats = await Order.aggregate([
    { $match: { user: user._id } },
    {
      $group: {
        _id: null,
        totalSpent: { $sum: "$totalPrice" },
        avgOrderValue: { $avg: "$totalPrice" },
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      user,
      statistics: {
        orderCount,
        reviewCount,
        totalSpent: orderStats[0]?.totalSpent || 0,
        avgOrderValue: orderStats[0]?.avgOrderValue || 0,
        cartItems: user.cart.length,
        favoriteItems: user.favorites.length,
        addressesCount: user.addresses.length,
      },
    },
  });
});

/**
 * @desc    Ban user (Admin)
 * @route   PUT /api/admin/users/:id/ban
 * @access  Private/Admin
 * @body    { reason: string }
 */
export const banUser = catchAsync(async (req: AuthRequest, res: Response) => {
  const { reason } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Prevent banning yourself
  if (user._id.toString() === req.user!._id.toString()) {
    return res.status(400).json({ message: "You cannot ban yourself" });
  }

  // Prevent banning other admins
  if (user.role === "admin") {
    return res.status(403).json({ message: "Cannot ban admin users" });
  }

  if (user.status === "banned") {
    return res.status(400).json({ message: "User is already banned" });
  }

  user.status = "banned";
  user.banReason = reason || "Violated terms of service";
  user.bannedAt = new Date();
  user.bannedBy = req.user!._id as Types.ObjectId;

  await user.save();

  res.status(200).json({
    status: "success",
    message: "User banned successfully",
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
        banReason: user.banReason,
        bannedAt: user.bannedAt,
      },
    },
  });
});

/**
 * @desc    Unban user (Admin)
 * @route   PUT /api/admin/users/:id/unban
 * @access  Private/Admin
 */
export const unbanUser = catchAsync(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.status !== "banned" && user.status !== "suspended") {
    return res.status(400).json({ message: "User is not banned or suspended" });
  }

  user.status = "active";
  user.banReason = undefined;
  user.bannedAt = undefined;
  user.bannedBy = undefined;

  await user.save();

  res.status(200).json({
    status: "success",
    message: "User unbanned successfully",
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
      },
    },
  });
});

/**
 * @desc    Suspend user temporarily (Admin)
 * @route   PUT /api/admin/users/:id/suspend
 * @access  Private/Admin
 * @body    { reason: string }
 */
export const suspendUser = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { reason } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent suspending yourself
    if (user._id.toString() === req.user!._id.toString()) {
      return res.status(400).json({ message: "You cannot suspend yourself" });
    }

    // Prevent suspending other admins
    if (user.role === "admin") {
      return res.status(403).json({ message: "Cannot suspend admin users" });
    }

    if (user.status === "suspended") {
      return res.status(400).json({ message: "User is already suspended" });
    }

    user.status = "suspended";
    user.banReason = reason || "Temporary suspension";
    user.bannedAt = new Date();
    user.bannedBy = req.user!._id as Types.ObjectId;

    await user.save();

    res.status(200).json({
      status: "success",
      message: "User suspended successfully",
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          status: user.status,
          banReason: user.banReason,
          bannedAt: user.bannedAt,
        },
      },
    });
  }
);

/**
 * @desc    Update user role (Admin)
 * @route   PUT /api/admin/users/:id/role
 * @access  Private/Admin
 * @body    { role: 'user' | 'admin' }
 */
export const updateUserRole = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent changing your own role
    if (user._id.toString() === req.user!._id.toString()) {
      return res
        .status(400)
        .json({ message: "You cannot change your own role" });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      status: "success",
      message: `User role updated to ${role} successfully`,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  }
);

/**
 * @desc    Delete user (Admin)
 * @route   DELETE /api/admin/users/:id
 * @access  Private/Admin
 */
export const deleteUser = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user!._id.toString()) {
      return res.status(400).json({ message: "You cannot delete yourself" });
    }

    // Prevent deleting other admins
    if (user.role === "admin") {
      return res.status(403).json({ message: "Cannot delete admin users" });
    }

    // Note: Consider cascading deletes for orders, reviews, etc.
    // or anonymizing the data instead of hard delete
    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: "success",
      message: "User deleted successfully",
    });
  }
);

/**
 * @desc    Get all reviews (Admin)
 * @route   GET /api/admin/reviews
 * @access  Private/Admin
 * @query   ?page=1&limit=10&sort=-createdAt&rating=5&user=userId&product=productId
 */
export const getAllReviews = catchAsync(async (req: Request, res: Response) => {
  const features = new APIFeatures(Review.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const reviews = await features.query
    .populate("user", "name email avatar status")
    .populate("product", "name images price");

  const totalFeatures = new APIFeatures(Review.find(), req.query).filter();
  const total = await Review.countDocuments(totalFeatures.query.getFilter());

  const page = Number(req.query.page?.toString() || "1");
  const limit = Number(req.query.limit?.toString() || "10");

  // Get review statistics
  const stats = await Review.aggregate([
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        avgRating: { $avg: "$rating" },
        totalHelpfulVotes: { $sum: "$helpfulVotes" },
        verifiedPurchases: {
          $sum: { $cond: ["$isVerifiedPurchase", 1, 0] },
        },
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    results: reviews.length,
    page,
    pages: Math.ceil(total / limit),
    total,
    stats: stats[0] || {
      totalReviews: 0,
      avgRating: 0,
      totalHelpfulVotes: 0,
      verifiedPurchases: 0,
    },
    data: reviews,
  });
});

/**
 * @desc    Delete review by admin
 * @route   DELETE /api/admin/reviews/:id
 * @access  Private/Admin
 */
export const deleteReviewByAdmin = catchAsync(
  async (req: Request, res: Response) => {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Delete images if exist
    if (review.images && review.images.length > 0) {
      const { deleteImage } = require("../middleware/uploadMiddleware");
      review.images.forEach((imagePath) => deleteImage(imagePath));
    }

    await Review.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: "success",
      message: "Review deleted successfully",
    });
  }
);

/**
 * @desc    Get user's reviews (Admin)
 * @route   GET /api/admin/users/:id/reviews
 * @access  Private/Admin
 */
export const getUserReviews = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.params.id;

    // Verify user exists
    const user = await User.findById(userId).select("name email");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const features = new APIFeatures(Review.find({ user: userId }), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const reviews = await features.query.populate(
      "product",
      "name images price"
    );

    const total = await Review.countDocuments({ user: userId });

    const page = Number(req.query.page?.toString() || "1");
    const limit = Number(req.query.limit?.toString() || "10");

    res.status(200).json({
      status: "success",
      results: reviews.length,
      page,
      pages: Math.ceil(total / limit),
      total,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
      data: reviews,
    });
  }
);

/**
 * @desc    Get user's orders (Admin)
 * @route   GET /api/admin/users/:id/orders
 * @access  Private/Admin
 */
export const getUserOrders = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id;

  // Verify user exists
  const user = await User.findById(userId).select("name email");
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const features = new APIFeatures(Order.find({ user: userId }), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const orders = await features.query;

  const total = await Order.countDocuments({ user: userId });

  const page = Number(req.query.page?.toString() || "1");
  const limit = Number(req.query.limit?.toString() || "10");

  res.status(200).json({
    status: "success",
    results: orders.length,
    page,
    pages: Math.ceil(total / limit),
    total,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
    },
    data: orders,
  });
});
