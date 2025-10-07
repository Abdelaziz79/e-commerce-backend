// src/models/productModel.ts

import mongoose, { Schema } from "mongoose";
import { ProductDocument } from "../types/product.types";

const dimensionSchema = new Schema(
  {
    length: {
      type: Number,
      required: true,
    },
    width: {
      type: Number,
      required: true,
    },
    height: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      required: true,
      default: "cm",
    },
  },
  { _id: false }
);

const productVariationSchema = new Schema(
  {
    size: String,
    color: String,
    material: String,
    style: String,
    sku: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    countInStock: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true }
);

const productSchema = new Schema<ProductDocument>(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
    },
    richDescription: {
      type: String,
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      default: 0,
      min: [0, "Price cannot be negative"],
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Product category is required"],
    },
    brand: {
      type: Schema.Types.ObjectId,
      ref: "Brand",
      required: [true, "Product brand is required"],
    },
    images: {
      type: [String],
      default: ["/images/sample.jpg"],
    },
    mainImage: {
      type: String,
      default: "/images/sample.jpg",
    },
    countInStock: {
      type: Number,
      required: [true, "Count in stock is required"],
      default: 0,
      min: [0, "Count in stock cannot be negative"],
    },
    hasVariations: {
      type: Boolean,
      default: false,
    },
    variations: [productVariationSchema],
    rating: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 5,
    },
    numReviews: {
      type: Number,
      required: true,
      default: 0,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    isNewProduct: {
      type: Boolean,
      default: false,
    },
    onSale: {
      type: Boolean,
      default: false,
    },
    salePrice: {
      type: Number,
      min: 0,
    },
    saleEndDate: {
      type: Date,
    },
    tags: [String],
    weight: {
      type: Number,
      min: 0,
    },
    weightUnit: {
      type: String,
      default: "kg",
    },
    dimensions: dimensionSchema,
    relatedProducts: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    warranty: String,
    attributes: {
      type: Map,
      of: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual populate for reviews
productSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "product",
  localField: "_id",
});

productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });

const Product = mongoose.model<ProductDocument>("Product", productSchema);

export default Product;
