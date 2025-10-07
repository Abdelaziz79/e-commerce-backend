// src/models/categoryModel.ts

import mongoose, { Schema } from "mongoose";
import { CategoryDocument } from "../types/category.types";
import slugify from "slugify";

const categorySchema = new Schema<CategoryDocument>(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
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
    image: {
      type: String,
    },
    parentCategory: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Middleware to generate slug before saving
categorySchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

// Virtual for subcategories
categorySchema.virtual("subcategories", {
  ref: "Category",
  localField: "_id",
  foreignField: "parentCategory",
});

const Category = mongoose.model<CategoryDocument>("Category", categorySchema);

export default Category;
