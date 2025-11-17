// src/controllers/categoryController.ts

import { Request, Response } from "express";
import { deleteImage, getImagePath } from "../middleware/uploadMiddleware";
import Category from "../models/categoryModel";
import APIFeatures from "../utils/apiFeatures";
import catchAsync from "../utils/catchAsync";
import mongoose from "mongoose";

/**
 * @desc    Create a new category
 * @route   POST /api/v1/categories
 * @access  Private/Admin
 */
export const createCategory = catchAsync(
  async (req: Request, res: Response) => {
    const { name, description, parentCategory, isActive } = req.body;

    // Handle uploaded image
    let imagePath;
    if (req.file) {
      imagePath = getImagePath(req.file.filename, "categories");
    }

    const category = await Category.create({
      name,
      description,
      image: imagePath,
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
 * @desc    Get all ACTIVE categories for public users
 * @route   GET /api/v1/categories
 * @access  Public
 */
export const getAllCategories = catchAsync(
  async (req: Request, res: Response) => {
    // Create a query that ONLY includes active categories
    const activeQuery = Category.find({ isActive: true }).populate(
      "subcategories"
    );

    const features = new APIFeatures(activeQuery, req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const categories = await features.query;

    // IMPORTANT: Count only ACTIVE categories for accurate pagination
    const total = await Category.countDocuments({
      isActive: true,
      ...features["filterConditions"],
    });

    res.status(200).json({
      status: "success",
      results: categories.length,
      total, // This now correctly reflects ONLY active categories
      data: {
        categories,
      },
    });
  }
);

/**
 * @desc    Get all categories for admin (including inactive)
 * @route   GET /api/v1/categories/admin/all
 * @access  Private/Admin
 */
export const getAllCategoriesAdmin = catchAsync(
  async (req: Request, res: Response) => {
    // Admin sees ALL categories (no isActive filter)
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
      total, // This includes both active and inactive
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
    const { id } = req.params;

    // Check if the parameter is a valid MongoDB ObjectId
    const isValidObjectId =
      mongoose.Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id);

    // Query by _id if valid ObjectId, otherwise query by slug
    const query = isValidObjectId ? { _id: id } : { slug: id };

    const category = await Category.findOne(query).populate("subcategories");

    if (!category || category.isActive === false) {
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
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Handle image update
    if (req.file) {
      // Delete old image if exists
      if (category.image) {
        deleteImage(category.image);
      }
      req.body.image = getImagePath(req.file.filename, "categories");
    }

    const updatedCategory = await Category.findByIdAndUpdate(
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
        category: updatedCategory,
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
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Delete image if exists
    if (category.image) {
      deleteImage(category.image);
    }

    await Category.findByIdAndDelete(req.params.id);

    // Note: Consider what happens to products in this category.
    // You might want to set their category to null or a default category.

    res.status(204).json({
      status: "success",
      data: null,
    });
  }
);

/**
 * @desc    Toggle category active status
 * @route   PUT /api/v1/categories/:id/toggle-active
 * @access  Private/Admin
 */
export const toggleCategoryActive = catchAsync(
  async (req: Request, res: Response) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    category.isActive = !category.isActive;
    await category.save();

    res.status(200).json({
      status: "success",
      data: {
        category,
      },
    });
  }
);

/**
 * @desc    Search categories for public users (only active categories)
 * @route   GET /api/v1/categories/search
 * @access  Public
 */
export const searchCategories = catchAsync(
  async (req: Request, res: Response) => {
    const { q } = req.query;

    // Search only active categories by name or description
    const searchQuery = {
      isActive: true,
      $or: [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ],
    };

    const features = new APIFeatures(
      Category.find(searchQuery).populate("subcategories"),
      req.query
    )
      .sort()
      .limitFields()
      .paginate();

    const categories = await features.query;
    const total = await Category.countDocuments(searchQuery);

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
 * @desc    Search ALL categories for administrators
 * @route   GET /api/v1/categories/admin/search
 * @access  Private/Admin
 */
export const searchCategoriesAdmin = catchAsync(
  async (req: Request, res: Response) => {
    const { q } = req.query;

    // Search all categories (active and inactive) by name or description
    const searchQuery = {
      $or: [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ],
    };

    const features = new APIFeatures(
      Category.find(searchQuery).populate("subcategories"),
      req.query
    )
      .sort()
      .limitFields()
      .paginate();

    const categories = await features.query;
    const total = await Category.countDocuments(searchQuery);

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
