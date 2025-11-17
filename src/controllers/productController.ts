// src/controllers/productController.ts

import { Request, Response } from "express";
import { validationResult } from "express-validator";
import mongoose from "mongoose";
import slugify from "slugify";
import { deleteImage, getImagePath } from "../middleware/uploadMiddleware";
import Product from "../models/productModel";
import { AuthRequest } from "../types/user.types";
import APIFeatures from "../utils/apiFeatures";
import catchAsync from "../utils/catchAsync";

/**
 * @desc    Fetch all products with advanced filtering, sorting, and pagination
 * @route   GET /api/products
 * @access  Public
 */
export const getProducts = catchAsync(async (req: Request, res: Response) => {
  // --- FIX START ---
  // Add a safeguard to prevent a CastError if the frontend sends 'undefined'
  // as a query parameter value.
  if (req.query.brand === "undefined") {
    delete req.query.brand;
  }

  if (req.query.category === "undefined") {
    delete req.query.category;
  }

  // --- FIX END ---

  const features = new APIFeatures(
    Product.find()
      .populate({ path: "category", select: "name slug" })
      .populate({ path: "brand", select: "name slug" }),
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

    const product = await query
      .populate({ path: "category", select: "name slug" })
      .populate({ path: "brand", select: "name slug" })
      // .populate("reviews")
      .populate({
        path: "relatedProducts",
        select:
          "name slug price salePrice onSale images mainImage countInStock rating numReviews brand category featured isNewProduct",
        populate: [
          { path: "brand", select: "name slug" },
          { path: "category", select: "name slug" },
        ],
      });

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
    const {
      name,
      mainImageIndex,
      images: imageUrls,
      mainImage: mainImageUrl,
    } = req.body;
    const slug = slugify(name, { lower: true, strict: true });

    // Check if product with similar name exists
    const existingProduct = await Product.findOne({ slug });
    if (existingProduct) {
      // Delete uploaded images if product already exists
      if (req.files) {
        const files = req.files as {
          [fieldname: string]: Express.Multer.File[];
        };
        if (files.images) {
          files.images.forEach((file) => {
            deleteImage(getImagePath(file.filename, "products"));
          });
        }
        if (files.mainImage) {
          files.mainImage.forEach((file) => {
            deleteImage(getImagePath(file.filename, "products"));
          });
        }
      }
      return res.status(400).json({
        message: "Product with a similar name already exists.",
      });
    }

    // Handle images - prioritize uploaded files, fallback to URLs from body
    let imagePaths: string[] = [];
    let mainImagePath: string | undefined;

    if (req.files) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      // Handle regular images from file upload
      if (files.images) {
        imagePaths = files.images.map((file) =>
          getImagePath(file.filename, "products")
        );
      }

      // Handle main image from file upload
      if (files.mainImage && files.mainImage.length > 0) {
        mainImagePath = getImagePath(files.mainImage[0].filename, "products");
      } else if (
        mainImageIndex !== undefined &&
        imagePaths[parseInt(mainImageIndex)]
      ) {
        mainImagePath = imagePaths[parseInt(mainImageIndex)];
      } else if (imagePaths.length > 0) {
        // Default to first image if no mainImage specified
        mainImagePath = imagePaths[0];
      }
    }

    // If no files uploaded, use URL strings from body
    if (imagePaths.length === 0 && imageUrls && Array.isArray(imageUrls)) {
      imagePaths = imageUrls;
    }

    if (!mainImagePath && mainImageUrl) {
      mainImagePath = mainImageUrl;
    } else if (
      !mainImagePath &&
      mainImageIndex !== undefined &&
      imagePaths[parseInt(mainImageIndex)]
    ) {
      mainImagePath = imagePaths[parseInt(mainImageIndex)];
    } else if (!mainImagePath && imagePaths.length > 0) {
      mainImagePath = imagePaths[0];
    }

    const product = new Product({
      ...req.body,
      slug,
      images: imagePaths,
      ...(mainImagePath && { mainImage: mainImagePath }),
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
    const {
      mainImageIndex,
      images: imageUrls,
      mainImage: mainImageUrl,
    } = req.body;

    // find product
    const product = await Product.findById(req.params.id);
    if (!product) {
      // delete uploaded images if product not found
      if (req.files) {
        const files = req.files as {
          [fieldname: string]: Express.Multer.File[];
        };
        if (files.images) {
          files.images.forEach((file) => {
            deleteImage(getImagePath(file.filename, "products"));
          });
        }
        if (files.mainImage) {
          files.mainImage.forEach((file) => {
            deleteImage(getImagePath(file.filename, "products"));
          });
        }
      }
      return res.status(404).json({ message: "Product not found" });
    }

    // name changed -> slug changed
    if (req.body.name) {
      const slug = slugify(req.body.name, { lower: true, strict: true });

      // check if slug exists for a different product
      const existingProduct = await Product.findOne({
        slug,
        _id: { $ne: req.params.id },
      });

      if (existingProduct) {
        return res
          .status(400)
          .json({ message: "Product with a similar name already exists." });
      }

      req.body.slug = slug;
    }

    let newImagePaths: string[] = [];
    let newMainImagePath: string | undefined;
    let shouldDeleteOldImages = false;

    // Handle uploaded files
    if (req.files) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      // Handle regular images from file upload
      if (files.images) {
        shouldDeleteOldImages = true;
        newImagePaths = files.images.map((file) =>
          getImagePath(file.filename, "products")
        );
      }

      // Handle main image from file upload
      if (files.mainImage && files.mainImage.length > 0) {
        newMainImagePath = getImagePath(
          files.mainImage[0].filename,
          "products"
        );
      } else if (
        mainImageIndex !== undefined &&
        newImagePaths[parseInt(mainImageIndex)]
      ) {
        newMainImagePath = newImagePaths[parseInt(mainImageIndex)];
      }
    }

    // If no files uploaded but URLs provided in body, use those
    if (newImagePaths.length === 0 && imageUrls && Array.isArray(imageUrls)) {
      shouldDeleteOldImages = true;
      newImagePaths = imageUrls;
    }

    if (!newMainImagePath && mainImageUrl) {
      newMainImagePath = mainImageUrl;
    } else if (
      !newMainImagePath &&
      mainImageIndex !== undefined &&
      newImagePaths[parseInt(mainImageIndex)]
    ) {
      newMainImagePath = newImagePaths[parseInt(mainImageIndex)];
    }

    // Delete old images if we have new ones
    if (shouldDeleteOldImages && product.images && product.images.length > 0) {
      product.images.forEach((imagePath) => {
        // Only delete local file paths, not URLs
        if (imagePath.startsWith("/")) {
          deleteImage(imagePath);
        }
      });
    }

    // Delete old main image if it's being replaced and it's a local file
    if (
      newMainImagePath &&
      product.mainImage &&
      product.mainImage !== newMainImagePath &&
      !product.images?.includes(product.mainImage) &&
      product.mainImage.startsWith("/")
    ) {
      deleteImage(product.mainImage);
    }

    // Update request body with new image paths
    if (newImagePaths.length > 0) {
      req.body.images = newImagePaths;
    }
    if (newMainImagePath) {
      req.body.mainImage = newMainImagePath;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate("category brand");

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
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Delete product images from filesystem
    if (product.images && product.images.length > 0) {
      product.images.forEach((imagePath) => deleteImage(imagePath));
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: "success",
      message: "Product deleted successfully",
    });
  }
);

/**
 * @desc    Search products with enhanced query
 * @route   GET /api/products/search
 * @access  Public
 */
export const searchProducts = catchAsync(
  async (req: Request, res: Response) => {
    const { q, limit = 10, page = 1 } = req.query;

    // Validation is already handled by middleware, but double-check
    if (!q || typeof q !== "string") {
      return res.status(400).json({
        status: "fail",
        message: "Search query is required",
      });
    }

    // Enhanced search query - searches across multiple fields
    const searchQuery = {
      $or: [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { richDescription: { $regex: q, $options: "i" } },
        { tags: { $regex: q, $options: "i" } },
        // Optional: Search in variation SKUs if you want
        // { "variations.sku": { $regex: q, $options: "i" } },
      ],
    };

    const limitNum = Number(limit);
    const pageNum = Number(page);
    const skip = (pageNum - 1) * limitNum;

    // Execute search with populated references
    const products = await Product.find(searchQuery)
      .populate({ path: "category", select: "name slug" })
      .populate({ path: "brand", select: "name slug" })
      .limit(limitNum)
      .skip(skip)
      .sort("-createdAt");

    // Get total count for pagination
    const total = await Product.countDocuments(searchQuery);

    res.status(200).json({
      status: "success",
      results: products.length,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      total,
      data: products,
    });
  }
);

/**
 * @desc    Get product statistics
 * @route   GET /api/products/stats
 * @access  Private/Admin
 */
export const getProductStats = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const stats = await Product.aggregate([
      {
        $facet: {
          totalProducts: [{ $count: "count" }],
          totalValue: [{ $group: { _id: null, total: { $sum: "$price" } } }],
          averagePrice: [{ $group: { _id: null, avg: { $avg: "$price" } } }],
          outOfStock: [{ $match: { countInStock: 0 } }, { $count: "count" }],
          featured: [{ $match: { featured: true } }, { $count: "count" }],
          onSale: [{ $match: { onSale: true } }, { $count: "count" }],
          byCategory: [
            {
              $group: {
                _id: "$category",
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
            { $limit: 5 },
            {
              $lookup: {
                from: "categories",
                localField: "_id",
                foreignField: "_id",
                as: "categoryInfo",
              },
            },
          ],
          byBrand: [
            {
              $group: {
                _id: "$brand",
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
            { $limit: 5 },
            {
              $lookup: {
                from: "brands",
                localField: "_id",
                foreignField: "_id",
                as: "brandInfo",
              },
            },
          ],
        },
      },
    ]);

    res.status(200).json({
      status: "success",
      data: stats[0],
    });
  }
);

/**
 * @desc    Bulk update products
 * @route   PATCH /api/products/bulk
 * @access  Private/Admin
 */
export const bulkUpdateProducts = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { productIds, updates } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        message: "Product IDs array is required",
      });
    }

    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: updates },
      { runValidators: true }
    );

    res.status(200).json({
      status: "success",
      message: `${result.modifiedCount} products updated`,
      data: result,
    });
  }
);

/**
 * @desc    Bulk delete products
 * @route   DELETE /api/products/bulk
 * @access  Private/Admin
 */
export const bulkDeleteProducts = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        message: "Product IDs array is required",
      });
    }

    const result = await Product.deleteMany({ _id: { $in: productIds } });

    res.status(200).json({
      status: "success",
      message: `${result.deletedCount} products deleted`,
    });
  }
);

/**
 * @desc    Get low stock products
 * @route   GET /api/products/low-stock
 * @access  Private/Admin
 */
export const getLowStockProducts = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const threshold = Number(req.query.threshold) || 10;

    const products = await Product.find({
      countInStock: { $lte: threshold, $gt: 0 },
    })
      .populate("category brand")
      .sort("countInStock")
      .limit(50);

    res.status(200).json({
      status: "success",
      results: products.length,
      data: products,
    });
  }
);

/**
 * @desc    Adjust product stock
 * @route   PATCH /api/products/:id/stock
 * @access  Private/Admin
 */
export const adjustStock = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { adjustment, reason } = req.body;

    if (typeof adjustment !== "number") {
      return res.status(400).json({
        message: "Adjustment must be a number",
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const newStock = product.countInStock + adjustment;

    if (newStock < 0) {
      return res.status(400).json({
        message: "Insufficient stock",
      });
    }

    product.countInStock = newStock;
    await product.save();

    res.status(200).json({
      status: "success",
      data: product,
      message: `Stock adjusted by ${adjustment}. Reason: ${reason || "N/A"}`,
    });
  }
);
