// src/controllers/brandController.ts

import { Request, Response } from "express";
import { deleteImage, getImagePath } from "../middleware/uploadMiddleware";
import Brand from "../models/brandModel";
import APIFeatures from "../utils/apiFeatures";
import catchAsync from "../utils/catchAsync";
import mongoose from "mongoose";

/**
 * @desc    Create a new brand
 * @route   POST /api/v1/brands
 * @access  Private/Admin
 */
export const createBrand = catchAsync(async (req: Request, res: Response) => {
  const { name, description, website, isActive } = req.body;
  // Handle uploaded logo
  let logoPath;
  if (req.file) {
    logoPath = getImagePath(req.file.filename, "brands");
  }

  const brand = await Brand.create({
    name,
    description,
    logo: logoPath,
    website,
    isActive,
  });

  res.status(201).json({
    status: "success",
    data: {
      brand,
    },
  });
});

/**
 * @desc    Get all ACTIVE brands for public users
 * @route   GET /api/v1/brands
 * @access  Public
 */
export const getAllBrands = catchAsync(async (req: Request, res: Response) => {
  // Create a query that ONLY includes active brands
  const activeBrandsQuery = Brand.find({ isActive: true });

  const features = new APIFeatures(activeBrandsQuery, req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const brands = await features.query;

  // IMPORTANT: Count only ACTIVE brands for accurate pagination
  const total = await Brand.countDocuments({
    isActive: true,
    ...features["filterConditions"],
  });

  res.status(200).json({
    status: "success",
    results: brands.length,
    total, // This now correctly reflects ONLY active brands
    data: {
      brands,
    },
  });
});

/**
 * @desc    Get all brands for admin (including inactive)
 * @route   GET /api/v1/brands/admin/all
 * @access  Private/Admin
 */
export const getAllBrandsAdmin = catchAsync(
  async (req: Request, res: Response) => {
    // Admin sees ALL brands (no isActive filter)
    const features = new APIFeatures(Brand.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const brands = await features.query;
    const total = await features.getTotalCount();

    res.status(200).json({
      status: "success",
      results: brands.length,
      total, // This includes both active and inactive
      data: {
        brands,
      },
    });
  }
);

/**
 * @desc    Get a single brand by ID or slug
 * @route   GET /api/v1/brands/:id
 * @access  Public
 */
export const getBrandById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if the parameter is a valid MongoDB ObjectId
  const isValidObjectId =
    mongoose.Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id);

  // Query by _id if valid ObjectId, otherwise query by slug
  const query = isValidObjectId ? { _id: id } : { slug: id };

  const brand = await Brand.findOne(query);

  if (!brand || brand.isActive === false) {
    return res.status(404).json({ message: "Brand not found" });
  }

  res.status(200).json({
    status: "success",
    data: {
      brand,
    },
  });
});
/**
 * @desc    Update a brand
 * @route   PUT /api/v1/brands/:id
 * @access  Private/Admin
 */
export const updateBrand = catchAsync(async (req: Request, res: Response) => {
  const brand = await Brand.findById(req.params.id);

  if (!brand) {
    return res.status(404).json({ message: "Brand not found" });
  }

  // Handle logo update
  if (req.file) {
    // Delete old logo if exists
    if (brand.logo) {
      deleteImage(brand.logo);
    }
    req.body.logo = getImagePath(req.file.filename, "brands");
  }

  const updatedBrand = await Brand.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: {
      brand: updatedBrand,
    },
  });
});

/**
 * @desc    Delete a brand
 * @route   DELETE /api/v1/brands/:id
 * @access  Private/Admin
 */
export const deleteBrand = catchAsync(async (req: Request, res: Response) => {
  const brand = await Brand.findById(req.params.id);

  if (!brand) {
    return res.status(404).json({ message: "Brand not found" });
  }

  // Delete logo if exists
  if (brand.logo) {
    deleteImage(brand.logo);
  }

  await Brand.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

/**
 * @desc    Toggle brand active status
 * @route   PUT /api/v1/brands/:id/toggle-active
 * @access  Private/Admin
 */
export const toggleBrandActive = catchAsync(
  async (req: Request, res: Response) => {
    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    brand.isActive = !brand.isActive;
    await brand.save();

    res.status(200).json({
      status: "success",
      data: {
        brand,
      },
    });
  }
);

/**
 * @desc    Search brands for public users (only active brands)
 * @route   GET /api/v1/brands/search
 * @access  Public
 */
export const searchBrands = catchAsync(async (req: Request, res: Response) => {
  const { q } = req.query;

  // Search only active brands by name, description, or website
  const searchQuery = {
    isActive: true,
    $or: [
      { name: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
      { website: { $regex: q, $options: "i" } },
    ],
  };

  const features = new APIFeatures(Brand.find(searchQuery), req.query)
    .sort()
    .limitFields()
    .paginate();

  const brands = await features.query;
  const total = await Brand.countDocuments(searchQuery);

  res.status(200).json({
    status: "success",
    results: brands.length,
    total,
    data: {
      brands,
    },
  });
});

/**
 * @desc    Search ALL brands for administrators
 * @route   GET /api/v1/brands/admin/search
 * @access  Private/Admin
 */
export const searchBrandsAdmin = catchAsync(
  async (req: Request, res: Response) => {
    const { q } = req.query;

    // Search all brands (active and inactive) by name, description, or website
    const searchQuery = {
      $or: [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { website: { $regex: q, $options: "i" } },
      ],
    };

    const features = new APIFeatures(Brand.find(searchQuery), req.query)
      .sort()
      .limitFields()
      .paginate();

    const brands = await features.query;
    const total = await Brand.countDocuments(searchQuery);

    res.status(200).json({
      status: "success",
      results: brands.length,
      total,
      data: {
        brands,
      },
    });
  }
);
