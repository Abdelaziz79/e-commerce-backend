// src/controllers/reviewController.ts

import { Request, Response } from "express";
import Review from "../models/reviewModel";
import Product from "../models/productModel"; // To check if product exists
import APIFeatures from "../utils/apiFeatures";
import catchAsync from "../utils/catchAsync";
import { AuthRequest } from "../types/user.types";

/**
 * @desc    Create a new review
 * @route   POST /api/v1/reviews
 * @access  Private
 */
export const createReview = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { product, rating, comment, title, images } = req.body;
    const user = req.user!._id;

    // Check if product exists
    const productExists = await Product.findById(product);
    if (!productExists) {
      return res.status(404).json({ message: "Product not found" });
    }

    const review = await Review.create({
      product,
      user,
      rating,
      comment,
      title,
      images,
    });

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
  // Allow filtering by product in the query string
  let filter = {};
  if (req.query.product) {
    filter = { product: req.query.product };
  }

  const features = new APIFeatures(Review.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const reviews = await features.query;
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
  const review = await Review.findById(req.params.id);

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

    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

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

    await Review.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: "success",
      data: null,
    });
  }
);
