import { Request, Response } from "express";
import Order from "../models/orderModel";
import Product from "../models/productModel";
import User from "../models/userModel";
import { Address, AuthRequest, UserDocument } from "../types/user.types";
import APIFeatures from "../utils/apiFeatures";
import catchAsync from "../utils/catchAsync";
import generateToken from "../utils/generateToken";
import { deleteImage, getImagePath } from "../middleware/uploadMiddleware";

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
export const getUserProfile = catchAsync(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get fresh user data with all fields
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      status: "success",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        phone: user.phone,
        cart: user.cart,
        addresses: user.addresses,
        favorites: user.favorites,
        orderHistory: user.orderHistory,
        createdAt: user.createdAt,
      },
    });
  }
);

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateUserProfile = catchAsync(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = (await User.findById(req.user._id)) as UserDocument | null;

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;

    const updatedUser = await user.save();

    res.status(200).json({
      status: "success",
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
        isEmailVerified: updatedUser.isEmailVerified,
        phone: updatedUser.phone,
        token: generateToken(updatedUser._id as string),
      },
    });
  }
);

/**
 * @desc    Upload/Update user avatar
 * @route   PUT /api/users/avatar
 * @access  Private
 */
export const uploadAvatar = catchAsync(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete old avatar if it exists and is not the default
    if (user.avatar && !user.avatar.includes("default-avatar")) {
      deleteImage(user.avatar);
    }

    // Set new avatar path
    user.avatar = getImagePath(req.file.filename, "avatars");
    await user.save();

    res.status(200).json({
      status: "success",
      message: "Avatar uploaded successfully",
      data: {
        avatar: user.avatar,
      },
    });
  }
);

/**
 * @desc    Delete user avatar (reset to default)
 * @route   DELETE /api/users/avatar
 * @access  Private
 */
export const deleteAvatar = catchAsync(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete current avatar if not default
    if (user.avatar && !user.avatar.includes("default-avatar")) {
      deleteImage(user.avatar);
    }

    // Reset to default avatar
    user.avatar = "/uploads/avatars/default-avatar.png";
    await user.save();

    res.status(200).json({
      status: "success",
      message: "Avatar deleted successfully",
      data: {
        avatar: user.avatar,
      },
    });
  }
);

/**
 * @desc    Update user password
 * @route   PUT /api/users/password
 * @access  Private
 */
export const updateUserPassword = catchAsync(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(404).json({ message: "User not found" });
    }
    const user = (await User.findById(req.user._id).select(
      "+password"
    )) as UserDocument | null;
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const isMatch = await user.comparePassword(req.body.currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }
    user.password = req.body.newPassword;
    await user.save();
    res.status(200).json({
      status: "success",
      message: "Password updated successfully",
    });
  }
);

/**
 * @desc    Get all users with filtering, sorting, and pagination
 * @route   GET /api/users
 * @access  Private/Admin
 */
export const getUsers = catchAsync(async (req: Request, res: Response) => {
  // Create base query
  const features = new APIFeatures(User.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  // Execute query
  const users = await features.query;

  // Get total count for pagination (without pagination applied)
  const totalFeatures = new APIFeatures(User.find(), req.query).filter();
  const total = await User.countDocuments(totalFeatures.query.getFilter());

  const page = Number(req.query.page?.toString() || "1");
  const limit = Number(req.query.limit?.toString() || "10");

  res.status(200).json({
    status: "success",
    results: users.length,
    page,
    pages: Math.ceil(total / limit),
    total,
    data: users,
  });
});

/**
 * @desc    Add address to user profile
 * @route   POST /api/users/address
 * @access  Private
 */
export const addUserAddress = catchAsync(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { address, city, postalCode, country, isDefault, phoneNumber } =
      req.body;

    const newAddress: Address = {
      address,
      city,
      postalCode,
      country,
      isDefault: isDefault || false,
      phoneNumber,
    };

    // If new address is default, remove default from other addresses
    if (newAddress.isDefault) {
      user.addresses.forEach((addr: any) => {
        addr.isDefault = false;
      });
    }

    user.addresses.push(newAddress);
    await user.save();

    res.status(201).json({
      status: "success",
      data: {
        addresses: user.addresses,
      },
    });
  }
);

/**
 * @desc    Update user address
 * @route   PUT /api/users/address/:addressId
 * @access  Private
 */
export const updateUserAddress = catchAsync(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(404).json({ message: "User not found" });
    }

    const addressId = req.params.addressId;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find address in user's addresses
    const addressIndex = user.addresses.findIndex(
      (addr: any) => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({ message: "Address not found" });
    }

    const { address, city, postalCode, country, isDefault } = req.body;

    // Update address fields
    if (address) user.addresses[addressIndex].address = address;
    if (city) user.addresses[addressIndex].city = city;
    if (postalCode) user.addresses[addressIndex].postalCode = postalCode;
    if (country) user.addresses[addressIndex].country = country;

    // Handle default address
    if (isDefault !== undefined) {
      if (isDefault) {
        // Remove default from other addresses
        user.addresses.forEach((addr: any, index: number) => {
          if (index !== addressIndex) {
            addr.isDefault = false;
          }
        });
        user.addresses[addressIndex].isDefault = true;
      } else {
        // Explicitly set this address as non-default
        user.addresses[addressIndex].isDefault = false;
      }
    }

    await user.save();

    res.status(200).json({
      status: "success",
      data: {
        addresses: user.addresses,
      },
    });
  }
);

/**
 * @desc    Delete user address
 * @route   DELETE /api/users/address/:addressId
 * @access  Private
 */
export const deleteUserAddress = catchAsync(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(404).json({ message: "User not found" });
    }

    const addressId = req.params.addressId;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find and remove address
    user.addresses = user.addresses.filter(
      (addr: any) => addr._id.toString() !== addressId
    );

    await user.save();

    res.status(200).json({
      status: "success",
      data: {
        addresses: user.addresses,
      },
    });
  }
);

/**
 * @desc    Toggle product in favorites/wishlist
 * @route   POST /api/users/favorites
 * @access  Private
 */
export const toggleFavorite = catchAsync(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { productId } = req.body;

    // Validate that product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if product already in favorites
    const favoriteIndex = user.favorites.findIndex(
      (item) => item.product.toString() === productId
    );

    let message: string;
    let isAdded: boolean;

    if (favoriteIndex !== -1) {
      // Remove from favorites
      user.favorites.splice(favoriteIndex, 1);
      message = "Product removed from favorites successfully";
      isAdded = false;
    } else {
      // Add to favorites
      user.favorites.push({
        product: productId,
        addedAt: new Date(),
      });
      message = "Product added to favorites successfully";
      isAdded = true;
    }

    await user.save();

    res.status(200).json({
      status: "success",
      message,
      data: {
        isAdded,
        favorites: user.favorites,
        favoritesCount: user.favorites.length,
      },
    });
  }
);

/**
 * @desc    Remove product from favorites/wishlist
 * @route   DELETE /api/users/favorites/:productId
 * @access  Private
 */
export const removeFromFavorites = catchAsync(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { productId } = req.params;

    // Store original length to check if item was found
    const originalLength = user.favorites.length;

    // Remove from favorites
    user.favorites = user.favorites.filter(
      (item) => item.product.toString() !== productId
    );

    if (user.favorites.length === originalLength) {
      return res
        .status(404)
        .json({ message: "Product not found in favorites" });
    }

    await user.save();

    res.status(200).json({
      status: "success",
      message: "Product removed from favorites successfully",
      data: {
        favorites: user.favorites,
        favoritesCount: user.favorites.length,
      },
    });
  }
);

/**
 * @desc    Get user favorites/wishlist
 * @route   GET /api/users/favorites
 * @access  Private
 * @query   ?page=1&limit=10&sort=-createdAt&keyword=search&price[gte]=100
 */
export const getFavorites = catchAsync(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = await User.findById(req.user._id).select("favorites");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Filter out favorites where product no longer exists and get product IDs
    const validFavoriteIds = [];
    const validFavorites = [];

    for (const favorite of user.favorites) {
      if (favorite.product) {
        validFavoriteIds.push(favorite.product);
        validFavorites.push(favorite);
      }
    }

    // Update user if some favorites were invalid
    if (validFavorites.length !== user.favorites.length) {
      user.favorites = validFavorites;
      await user.save();
    }

    if (validFavoriteIds.length === 0) {
      return res.status(200).json({
        status: "success",
        results: 0,
        page: 1,
        pages: 0,
        total: 0,
        data: {
          favorites: [],
        },
      });
    }

    // Create base query for products in favorites
    const baseQuery = Product.find({ _id: { $in: validFavoriteIds } });

    // Apply API features
    const features = new APIFeatures(baseQuery, req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // Execute query
    const products = await features.query.select(
      "name price images description rating numReviews onSale salePrice countInStock"
    );

    // Get total count for pagination (without pagination applied)
    const totalFeatures = new APIFeatures(
      Product.find({ _id: { $in: validFavoriteIds } }),
      req.query
    ).filter();
    const total = await Product.countDocuments(totalFeatures.query.getFilter());

    const page = Number(req.query.page?.toString() || "1");
    const limit = Number(req.query.limit?.toString() || "10");

    res.status(200).json({
      status: "success",
      results: products.length,
      page,
      pages: Math.ceil(total / limit),
      total,
      data: {
        favorites: products,
      },
    });
  }
);

/**
 * @desc    Get user order history
 * @route   GET /api/users/orders
 * @access  Private
 * @query   ?page=1&limit=10&sort=-createdAt&status=delivered&totalPrice[gte]=100
 */
export const getOrderHistory = catchAsync(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = await User.findById(req.user._id).select("orderHistory");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Filter out orders where order no longer exists and get order IDs
    const validOrderIds = [];
    const validOrderHistory = [];

    for (const orderRef of user.orderHistory) {
      if (orderRef.order) {
        validOrderIds.push(orderRef.order);
        validOrderHistory.push(orderRef);
      }
    }

    // Update user if some orders were invalid
    if (validOrderHistory.length !== user.orderHistory.length) {
      user.orderHistory = validOrderHistory;
      await user.save();
    }

    if (validOrderIds.length === 0) {
      return res.status(200).json({
        status: "success",
        results: 0,
        page: 1,
        pages: 0,
        total: 0,
        data: {
          orderHistory: [],
        },
      });
    }

    // Create base query for orders in history
    const baseQuery = Order.find({ _id: { $in: validOrderIds } });

    // Apply API features
    const features = new APIFeatures(baseQuery, req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // Execute query
    const orders = await features.query.select(
      "orderItems shippingAddress paymentMethod totalPrice isPaid paidAt isDelivered deliveredAt status createdAt"
    );

    // Get total count for pagination (without pagination applied)
    const totalFeatures = new APIFeatures(
      Order.find({ _id: { $in: validOrderIds } }),
      req.query
    ).filter();
    const total = await Order.countDocuments(totalFeatures.query.getFilter());

    const page = Number(req.query.page?.toString() || "1");
    const limit = Number(req.query.limit?.toString() || "10");

    res.status(200).json({
      status: "success",
      results: orders.length,
      page,
      pages: Math.ceil(total / limit),
      total,
      data: {
        orderHistory: orders,
      },
    });
  }
);
