// src/models/brandModel.ts

import mongoose, { Schema } from "mongoose";
import { BrandDocument } from "../types/brand.types";
import slugify from "slugify";

const brandSchema = new Schema<BrandDocument>(
  {
    name: {
      type: String,
      required: [true, "Brand name is required"],
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    logo: {
      type: String,
    },
    website: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Middleware to generate slug before saving
brandSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

const Brand = mongoose.model<BrandDocument>("Brand", brandSchema);

export default Brand;
