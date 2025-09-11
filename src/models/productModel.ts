import mongoose, { Schema } from "mongoose";
import { ProductDocument } from "../types/product.types";

const reviewSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId as any,
      required: true,
      ref: "User",
    },
    name: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
    title: {
      type: String,
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
  }
);

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

// Updated schema name for consistency
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
      type: String,
      required: [true, "Product category is required"],
    },
    subcategories: [String],
    brand: {
      type: String,
      required: [true, "Product brand is required"],
    },
    images: {
      type: [String],
      default: ["/images/sample.jpg"],
      validate: {
        validator: function (images) {
          // Allow both HTTP URLs and relative paths
          return images.every((img: string) => {
            if (img.startsWith("http") || img.startsWith("https")) {
              return /^https?:\/\/.*\.(jpg|jpeg|png|gif|webp)$/i.test(img);
            }
            return /^\/.*\.(jpg|jpeg|png|gif|webp)$/i.test(img);
          });
        },
        message: "All images must be valid URLs or relative paths",
      },
    },
    mainImage: {
      type: String,
      default: "/images/sample.jpg",
      validate: {
        validator: function (img) {
          if (img.startsWith("http") || img.startsWith("https")) {
            return /^https?:\/\/.*\.(jpg|jpeg|png|gif|webp)$/i.test(img);
          }
          return /^\/.*\.(jpg|jpeg|png|gif|webp)$/i.test(img);
        },
        message: "Main image must be a valid URL or relative path",
      },
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
    variations: [productVariationSchema], // Updated to use consistent naming
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
    reviews: [reviewSchema],
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
  }
);

// Create text index for product search
productSchema.index({
  name: "text",
  description: "text",
  brand: "text",
  category: "text",
});

// Define slug as unique in the index definition
productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ onSale: 1 });
productSchema.index({ featured: 1 });

const Product = mongoose.model<ProductDocument>("Product", productSchema);

export default Product;
