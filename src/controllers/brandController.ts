// src/controllers/brandController.ts

import { Request, Response } from "express";
import Brand from "../models/brandModel";
import APIFeatures from "../utils/apiFeatures";
import catchAsync from "../utils/catchAsync";

/**
 * @desc    Create a new brand
 * @route   POST /api/v1/brands
 * @access  Private/Admin
 */
export const createBrand = catchAsync(async (req: Request, res: Response) => {
  const { name, description, logo, website } = req.body;

  const brand = await Brand.create({
    name,
    description,
    logo,
    website,
  });

  res.status(201).json({
    status: "success",
    data: {
      brand,
    },
  });
});

/**
 * @desc    Get all brands
 * @route   GET /api/v1/brands
 * @access  Public
 */
export const getAllBrands = catchAsync(async (req: Request, res: Response) => {
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
    total,
    data: {
      brands,
    },
  });
});

/**
 * @desc    Get a single brand by ID or slug
 * @route   GET /api/v1/brands/:id
 * @access  Public
 */
export const getBrandById = catchAsync(async (req: Request, res: Response) => {
  const brand = await Brand.findById(req.params.id);

  if (!brand) {
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
  const brand = await Brand.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!brand) {
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
 * @desc    Delete a brand
 * @route   DELETE /api/v1/brands/:id
 * @access  Private/Admin
 */
export const deleteBrand = catchAsync(async (req: Request, res: Response) => {
  const brand = await Brand.findByIdAndDelete(req.params.id);

  if (!brand) {
    return res.status(404).json({ message: "Brand not found" });
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});
