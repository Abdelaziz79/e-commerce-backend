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
  // Create API features instance
  const features = new APIFeatures(Product.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  // Execute the query
  const products = await features.query;

  // Get total count for pagination
  const total = await features.getTotalCount();

  // Calculate pagination metadata
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
    let product;

    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id);
    } else {
      // Try to find by slug
      product = await Product.findOne({ slug: id });
    }

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

    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const {
      name,
      description,
      price,
      category,
      brand,
      countInStock,
      images,
      richDescription,
      hasVariations,
      variations,
      featured,
      isNewProduct,
      onSale,
      salePrice,
      saleEndDate,
      tags,
      dimensions,
      weight,
      weightUnit,
      relatedProducts,
      warranty,
      attributes,
    } = req.body;

    // Generate slug from name
    const slug = slugify(name, { lower: true, strict: true });

    // Check if slug already exists
    const existingProduct = await Product.findOne({ slug });
    if (existingProduct) {
      return res.status(400).json({
        message:
          "Product with similar name already exists. Please use a unique name.",
      });
    }

    // Process images
    const productImages = images || ["/images/sample.jpg"];
    const mainImage = productImages[0] || "/images/sample.jpg";

    const product = new Product({
      name,
      slug,
      description,
      price,
      category,
      brand,
      countInStock: countInStock || 0,
      images: productImages,
      mainImage,
      numReviews: 0,
      rating: 0,
      richDescription: richDescription || description,
      hasVariations: hasVariations || false,
      variations: variations || [],
      featured: featured || false,
      isNewProduct: isNewProduct || true, // New products are marked as new by default
      onSale: onSale || false,
      salePrice,
      saleEndDate,
      tags: tags || [],
      dimensions,
      weight,
      weightUnit: weightUnit || "kg",
      relatedProducts,
      warranty,
      attributes,
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

    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const {
      name,
      description,
      price,
      category,
      brand,
      countInStock,
      images,
      mainImage,
      richDescription,
      hasVariations,
      variations,
      featured,
      isNewProduct,
      onSale,
      salePrice,
      saleEndDate,
      tags,
      dimensions,
      weight,
      weightUnit,
      relatedProducts,
      warranty,
      attributes,
    } = req.body;

    // Handle slug update if name changes
    if (name && name !== product.name) {
      product.slug = slugify(name, { lower: true, strict: true });

      // Check if new slug already exists
      const existingProduct = await Product.findOne({
        slug: product.slug,
        _id: { $ne: product._id }, // Exclude current product
      });

      if (existingProduct) {
        return res.status(400).json({
          message:
            "Product with similar name already exists. Please use a unique name.",
        });
      }
    }

    // Update fields
    product.name = name || product.name;
    product.description = description || product.description;
    product.richDescription = richDescription || product.richDescription;
    product.price = price !== undefined ? price : product.price;
    product.category = category || product.category;
    product.brand = brand || product.brand;
    product.countInStock =
      countInStock !== undefined ? countInStock : product.countInStock;

    // Handle images update
    if (images && images.length > 0) {
      product.images = images;
      product.mainImage = mainImage || images[0];
    }

    if (mainImage) {
      product.mainImage = mainImage;
    }

    // Handle product variations
    if (hasVariations !== undefined) {
      product.hasVariations = hasVariations;
    }

    if (variations && variations.length > 0) {
      product.variations = variations;
    }

    // Update marketing related fields
    if (featured !== undefined) product.featured = featured;
    if (isNewProduct !== undefined) product.isNewProduct = isNewProduct;
    if (onSale !== undefined) product.onSale = onSale;
    if (salePrice !== undefined) product.salePrice = salePrice;
    if (saleEndDate !== undefined) product.saleEndDate = saleEndDate;

    // Update additional details
    if (tags) product.tags = tags;
    if (dimensions) product.dimensions = dimensions;
    if (weight !== undefined) product.weight = weight;
    if (weightUnit) product.weightUnit = weightUnit;
    if (relatedProducts) product.relatedProducts = relatedProducts;
    if (warranty !== undefined) product.warranty = warranty;
    if (attributes) product.attributes = attributes;

    const updatedProduct = await product.save();

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
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await product.deleteOne();

    res.status(200).json({
      status: "success",
      message: "Product deleted successfully",
    });
  }
);

/**
 * @desc    Create new review
 * @route   POST /api/products/:id/reviews
 * @access  Private
 */
export const createProductReview = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const { rating, comment, title, images } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if user already reviewed
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user?._id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({ message: "Product already reviewed" });
    }

    const review = {
      name: req.user.name,
      rating: Number(rating),
      comment,
      title: title || "",
      user: req.user._id,
      images: images || [],
      isVerifiedPurchase: false, // This would be set based on order history
      helpfulVotes: 0,
    };

    product.reviews.push(review as any);
    product.numReviews = product.reviews.length;

    // Calculate new average rating
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();

    res.status(201).json({
      status: "success",
      message: "Review added successfully",
    });
  }
);

/**
 * @desc    Get product reviews
 * @route   GET /api/products/:id/reviews
 * @access  Public
 */
export const getProductReviews = catchAsync(
  async (req: Request, res: Response) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      status: "success",
      results: product.reviews.length,
      data: product.reviews,
    });
  }
);
