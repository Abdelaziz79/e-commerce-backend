// src/controllers/productController.ts

import { Request, Response } from "express";
import { validationResult } from "express-validator";
import Product from "../models/productModel";
import { AuthRequest } from "../types/user.types";
import catchAsync from "../utils/catchAsync";
import APIFeatures from "../utils/apiFeatures";
import mongoose from "mongoose";
import slugify from "slugify";

/**
 * @desc    Fetch all products with advanced filtering, sorting, and pagination
 * @route   GET /api/products
 * @access  Public
 */
export const getProducts = catchAsync(async (req: Request, res: Response) => {
  const features = new APIFeatures(
    Product.find().populate("category brand"),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const products = await features.query;
  const total = await features.getTotalCount();
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const pages = Math.ceil(total / limit);

  res.status(200).json({
    status: "success",
    results: products.length,
    page,
    pages,
    total,
    data: products,
  });
});

/**
 * @desc    Fetch featured products
 * @route   GET /api/products/featured
 * @access  Public
 */
export const getFeaturedProducts = catchAsync(
  async (req: Request, res: Response) => {
    const limit = Number(req.query.limit) || 5;
    const products = await Product.find({ featured: true })
      .populate("category brand")
      .limit(limit)
      .sort("-createdAt");

    res.status(200).json({
      status: "success",
      results: products.length,
      data: products,
    });
  }
);

/**
 * @desc    Fetch products on sale
 * @route   GET /api/products/sale
 * @access  Public
 */
export const getOnSaleProducts = catchAsync(
  async (req: Request, res: Response) => {
    const limit = Number(req.query.limit) || 10;
    const products = await Product.find({
      onSale: true,
      saleEndDate: { $gte: new Date() },
    })
      .populate("category brand")
      .limit(limit)
      .sort("-createdAt");
    res.status(200).json({
      status: "success",
      results: products.length,
      data: products,
    });
  }
);

/**
 * @desc    Fetch single product by ID or slug
 * @route   GET /api/products/:id
 * @access  Public
 */
export const getProductById = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    let query;

    if (mongoose.Types.ObjectId.isValid(id)) {
      query = Product.findById(id);
    } else {
      query = Product.findOne({ slug: id });
    }

    const product = await query.populate("category brand").populate("reviews");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      status: "success",
      data: product,
    });
  }
);

/**
 * @desc    Create a product
 * @route   POST /api/products
 * @access  Private/Admin
 */
export const createProduct = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name } = req.body;
    const slug = slugify(name, { lower: true, strict: true });
    const existingProduct = await Product.findOne({ slug });
    if (existingProduct) {
      return res.status(400).json({
        message: "Product with a similar name already exists.",
      });
    }

    const product = new Product({
      ...req.body,
      slug,
    });

    const createdProduct = await product.save();
    res.status(201).json({
      status: "success",
      data: createdProduct,
    });
  }
);

/**
 * @desc    Update a product
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
export const updateProduct = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (req.body.name) {
      req.body.slug = slugify(req.body.name, { lower: true, strict: true });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      status: "success",
      data: updatedProduct,
    });
  }
);

/**
 * @desc    Delete a product
 * @route   DELETE /api/products/:id
 * @access  Private/Admin
 */
export const deleteProduct = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      status: "success",
      message: "Product deleted successfully",
    });
  }
);
