// src/controllers/reviewController.ts

import { Request, Response } from "express";
import mongoose from "mongoose";
import { deleteImage, getImagePath } from "../middleware/uploadMiddleware";
import Order from "../models/orderModel";
import Product from "../models/productModel";
import Review from "../models/reviewModel";
import { AuthRequest } from "../types/user.types";
import APIFeatures from "../utils/apiFeatures";
import catchAsync from "../utils/catchAsync";

/**
 * @desc    Create a new review
 * @route   POST /api/v1/reviews
 * @access  Private
 */
export const createReview = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { product, rating, comment, title } = req.body;
    const user = req.user!._id;

    // Check if product exists
    const productExists = await Product.findById(product);
    if (!productExists) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if user already reviewed this product
    const userReview = await Review.findOne({ product, user });
    if (userReview) {
      return res
        .status(400)
        .json({ message: "You have already reviewed this product" });
    }

    // Check if this is a verified purchase
    let isVerifiedPurchase = false;
    try {
      const order = await Order.findOne({
        user,
        "items.product": product,
        status: "delivered",
      });
      isVerifiedPurchase = !!order;
    } catch (error) {
      console.log("Order verification skipped:", error);
    }

    // Handle uploaded images
    let imagePaths: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      imagePaths = req.files.map((file) =>
        getImagePath(file.filename, "reviews")
      );
    }

    const review = await Review.create({
      product,
      user,
      rating,
      comment,
      title,
      images: imagePaths,
      isVerifiedPurchase,
    });

    // Populate user info for response
    await review.populate("user", "name avatar");

    res.status(201).json({
      status: "success",
      data: {
        review,
      },
    });
  }
);

/**
 * @desc    Get all reviews (can be filtered by product)
 * @route   GET /api/v1/reviews
 * @access  Public
 */
export const getAllReviews = catchAsync(async (req: Request, res: Response) => {
  let filter = {};
  if (req.query.product) {
    filter = { product: req.query.product };
  }

  const features = new APIFeatures(Review.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const reviews = await features.query
    .populate("user", "name avatar")
    .populate("product", "name images price");

  const total = await features.getTotalCount();

  res.status(200).json({
    status: "success",
    results: reviews.length,
    total,
    data: {
      reviews,
    },
  });
});

/**
 * @desc    Get a single review
 * @route   GET /api/v1/reviews/:id
 * @access  Public
 */
export const getReviewById = catchAsync(async (req: Request, res: Response) => {
  const review = await Review.findById(req.params.id)
    .populate("user", "name avatar")
    .populate("product", "name images price");

  if (!review) {
    return res.status(404).json({ message: "Review not found" });
  }

  res.status(200).json({
    status: "success",
    data: {
      review,
    },
  });
});

/**
 * @desc    Update a review
 * @route   PUT /api/v1/reviews/:id
 * @access  Private
 */
export const updateReview = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Check if the user owns the review
    if (review.user.toString() !== req.user!._id.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this review" });
    }

    // Handle image updates
    if (req.files && Array.isArray(req.files)) {
      // Delete old images if exists
      if (review.images && review.images.length > 0) {
        review.images.forEach((imagePath) => deleteImage(imagePath));
      }

      // Add new images
      req.body.images = req.files.map((file) =>
        getImagePath(file.filename, "reviews")
      );
    }

    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).populate("user", "name avatar");

    res.status(200).json({
      status: "success",
      data: {
        review: updatedReview,
      },
    });
  }
);

/**
 * @desc    Delete a review
 * @route   DELETE /api/v1/reviews/:id
 * @access  Private/Admin
 */
export const deleteReview = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Check if user is review owner or an admin
    if (
      review.user.toString() !== req.user!._id.toString() &&
      req.user!.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this review" });
    }

    // Delete images if exists
    if (review.images && review.images.length > 0) {
      review.images.forEach((imagePath) => deleteImage(imagePath));
    }

    await Review.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: "success",
      data: null,
    });
  }
);

/**
 * @desc    Toggle review helpful vote (vote/unvote)
 * @route   POST /api/v1/reviews/:id/helpful
 * @access  Private
 */
export const voteReviewHelpful = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    const userId = req.user!._id;

    // Check if user already voted
    const hasVoted = review.helpfulVotedBy.some(
      (id) => id.toString() === userId.toString()
    );

    let message: string;
    let voted: boolean;

    if (hasVoted) {
      // Remove vote
      review.helpfulVotedBy = review.helpfulVotedBy.filter(
        (id) => id.toString() !== userId.toString()
      );
      review.helpfulVotes = Math.max(0, review.helpfulVotes - 1);
      message = "Vote removed successfully";
      voted = false;
    } else {
      // Add vote
      review.helpfulVotedBy.push(new mongoose.Types.ObjectId(userId));
      review.helpfulVotes += 1;
      message = "Vote added successfully";
      voted = true;
    }

    await review.save();

    res.status(200).json({
      status: "success",
      message,
      data: {
        helpfulVotes: review.helpfulVotes,
        voted,
      },
    });
  }
);

/**
 * @desc    Get reviews by current user
 * @route   GET /api/v1/reviews/my-reviews
 * @access  Private
 */
export const getMyReviews = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const features = new APIFeatures(
      Review.find({ user: req.user!._id }),
      req.query
    )
      .sort()
      .limitFields()
      .paginate();

    const reviews = await features.query.populate(
      "product",
      "name images price"
    );
    const total = await features.getTotalCount();

    res.status(200).json({
      status: "success",
      results: reviews.length,
      total,
      data: {
        reviews,
      },
    });
  }
);

/**
 * @desc    Get product rating statistics
 * @route   GET /api/v1/reviews/stats/:productId
 * @access  Public
 */
export const getProductReviewStats = catchAsync(
  async (req: Request, res: Response) => {
    const { productId } = req.params;

    const stats = await Review.aggregate([
      {
        $match: { product: productId },
      },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: -1 },
      },
    ]);

    const total = stats.reduce((acc, curr) => acc + curr.count, 0);
    const avgRating =
      stats.reduce((acc, curr) => acc + curr._id * curr.count, 0) /
      (total || 1);

    const ratingBreakdown = [5, 4, 3, 2, 1].map((rating) => {
      const stat = stats.find((s) => s._id === rating);
      return {
        rating,
        count: stat ? stat.count : 0,
        percentage: total > 0 ? ((stat ? stat.count : 0) / total) * 100 : 0,
      };
    });

    res.status(200).json({
      status: "success",
      data: {
        total,
        avgRating: Math.round(avgRating * 10) / 10,
        breakdown: ratingBreakdown,
      },
    });
  }
);
