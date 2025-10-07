// src/controllers/categoryController.ts

import { Request, Response } from "express";
import Category from "../models/categoryModel";
import APIFeatures from "../utils/apiFeatures";
import catchAsync from "../utils/catchAsync";

/**
 * @desc    Create a new category
 * @route   POST /api/v1/categories
 * @access  Private/Admin
 */
export const createCategory = catchAsync(
  async (req: Request, res: Response) => {
    const { name, description, image, parentCategory, isActive } = req.body;

    const category = await Category.create({
      name,
      description,
      image,
      parentCategory,
      isActive,
    });

    res.status(201).json({
      status: "success",
      data: {
        category,
      },
    });
  }
);

/**
 * @desc    Get all categories
 * @route   GET /api/v1/categories
 * @access  Public
 */
export const getAllCategories = catchAsync(
  async (req: Request, res: Response) => {
    const features = new APIFeatures(
      Category.find().populate("subcategories"),
      req.query
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const categories = await features.query;
    const total = await features.getTotalCount();

    res.status(200).json({
      status: "success",
      results: categories.length,
      total,
      data: {
        categories,
      },
    });
  }
);

/**
 * @desc    Get a single category by ID or slug
 * @route   GET /api/v1/categories/:id
 * @access  Public
 */
export const getCategoryById = catchAsync(
  async (req: Request, res: Response) => {
    const category = await Category.findById(req.params.id).populate(
      "subcategories"
    );

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({
      status: "success",
      data: {
        category,
      },
    });
  }
);

/**
 * @desc    Update a category
 * @route   PUT /api/v1/categories/:id
 * @access  Private/Admin
 */
export const updateCategory = catchAsync(
  async (req: Request, res: Response) => {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({
      status: "success",
      data: {
        category,
      },
    });
  }
);

/**
 * @desc    Delete a category
 * @route   DELETE /api/v1/categories/:id
 * @access  Private/Admin
 */
export const deleteCategory = catchAsync(
  async (req: Request, res: Response) => {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Note: Consider what happens to products in this category.
    // You might want to set their category to null or a default category.

    res.status(204).json({
      status: "success",
      data: null,
    });
  }
);
