// src/models/reviewModel.ts

import mongoose, { Schema, Model } from "mongoose";
import { ReviewDocument } from "../types/review.types";
import Product from "./productModel"; // Import Product model

// Define statics interface for the model
interface ReviewModel extends Model<ReviewDocument> {
  calculateAverageRating(productId: mongoose.Types.ObjectId): Promise<void>;
}

const reviewSchema = new Schema<ReviewDocument, ReviewModel>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Review must belong to a product"],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user"],
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: [true, "Review comment cannot be empty"],
      trim: true,
    },
    title: {
      type: String,
      trim: true,
    },
    images: [String],
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
    helpfulVotes: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    // Ensure virtuals are included when converting to JSON
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Prevent user from submitting more than one review per product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Static method to calculate average rating and number of reviews
reviewSchema.statics.calculateAverageRating = async function (
  productId: mongoose.Types.ObjectId
) {
  const stats = await this.aggregate([
    {
      $match: { product: productId },
    },
    {
      $group: {
        _id: "$product",
        numReviews: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      rating: stats[0].avgRating,
      numReviews: stats[0].numReviews,
    });
  } else {
    // If no reviews, reset to default
    await Product.findByIdAndUpdate(productId, {
      rating: 0,
      numReviews: 0,
    });
  }
};

// Call calculateAverageRating after saving a review
reviewSchema.post("save", function () {
  (this.constructor as ReviewModel).calculateAverageRating(this.product);
});

// Call calculateAverageRating after removing a review
// Note: findByIdAndDelete triggers 'findOneAndDelete' middleware
reviewSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    await (doc.constructor as ReviewModel).calculateAverageRating(doc.product);
  }
});

const Review = mongoose.model<ReviewDocument, ReviewModel>(
  "Review",
  reviewSchema
);

export default Review;
