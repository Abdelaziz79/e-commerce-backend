import crypto from "crypto";
import { Request, Response } from "express";
import Product from "../models/productModel";
import User from "../models/userModel";
import { Address, AuthRequest, UserDocument } from "../types/user.types";
import APIFeatures from "../utils/apiFeatures";
import catchAsync from "../utils/catchAsync";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../utils/emailService";
import generateToken from "../utils/generateToken";

/**
 * @desc    Auth user & get token
 * @route   POST /api/users/login
 * @access  Public
 */
export const loginUser = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = (await User.findOne({ email }).select(
    "+password"
  )) as UserDocument | null;

  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  res.status(200).json({
    status: "success",
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      token: generateToken(user._id),
    },
  });
});

/**
 * @desc    Register a new user
 * @route   POST /api/users
 * @access  Public
 */
export const registerUser = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password, phone } = req.body;

  // Check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
  }

  // Create new user
  const user = (await User.create({
    name,
    email,
    password,
    phone,
  })) as UserDocument;

  // Generate email verification token
  const verificationToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // Create verification URL
  const verificationURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/verify-email/${verificationToken}`;

  try {
    // Send verification email
    await sendVerificationEmail(user.email, user.name, verificationURL);

    res.status(201).json({
      status: "success",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        token: generateToken(user._id),
      },
      // In a real application, you would remove the following line
      verificationURL: verificationURL,
    });
  } catch (err) {
    // If there's an error sending the email, reset the token fields but keep the user
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(201).json({
      status: "success",
      message:
        "User registered successfully but verification email could not be sent",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        token: generateToken(user._id),
      },
    });
  }
});

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
        isEmailVerified: updatedUser.isEmailVerified,
        phone: updatedUser.phone,
        token: generateToken(updatedUser._id),
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

    const { address, city, postalCode, country, isDefault } = req.body;

    const newAddress: Address = {
      address,
      city,
      postalCode,
      country,
      isDefault: isDefault || false,
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
 * @desc    Add item to cart
 * @route   POST /api/users/cart
 * @access  Private
 */
export const addToCart = catchAsync(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(404).json({ message: "User not found" });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const { productId, name, price, quantity, image } = req.body;

  // Validate that product exists
  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  // Check if product already in cart
  const existingProductIndex = user.cart.findIndex(
    (item: any) => item.product.toString() === productId
  );

  if (existingProductIndex >= 0) {
    // Update quantity if product already in cart
    user.cart[existingProductIndex].quantity += quantity || 1;
  } else {
    // Add new product to cart
    user.cart.push({
      product: productId,
      name: name || product.name, // Use product name if not provided
      price: price || product.price, // Use product price if not provided
      quantity: quantity || 1,
      image: image || product.images[0], // Use product image if not provided
    });
  }

  await user.save();

  res.status(200).json({
    status: "success",
    data: {
      cart: user.cart,
    },
  });
});

/**
 * @desc    Update cart item
 * @route   PUT /api/users/cart/:productId
 * @access  Private
 */
export const updateCartItem = catchAsync(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { productId } = req.params;
    const { quantity } = req.body;

    // Find product in cart
    const productIndex = user.cart.findIndex(
      (item: any) => item.product.toString() === productId
    );

    if (productIndex === -1) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    // Update quantity or remove if quantity is 0
    if (quantity <= 0) {
      user.cart = user.cart.filter(
        (item: any) => item.product.toString() !== productId
      );
    } else {
      user.cart[productIndex].quantity = quantity;
    }

    await user.save();

    res.status(200).json({
      status: "success",
      data: {
        cart: user.cart,
      },
    });
  }
);

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/users/cart/:productId
 * @access  Private
 */
export const removeFromCart = catchAsync(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { productId } = req.params;

    // Remove product from cart
    user.cart = user.cart.filter(
      (item: any) => item.product.toString() !== productId
    );

    await user.save();

    res.status(200).json({
      status: "success",
      data: {
        cart: user.cart,
      },
    });
  }
);

/**
 * @desc    Clear cart
 * @route   DELETE /api/users/cart
 * @access  Private
 */
export const clearCart = catchAsync(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(404).json({ message: "User not found" });
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  user.cart = [];
  await user.save();

  res.status(200).json({
    status: "success",
    data: {
      cart: user.cart,
    },
  });
});

/**
 * @desc    Add product to favorites/wishlist
 * @route   POST /api/users/favorites
 * @access  Private
 */
export const addToFavorites = catchAsync(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(404).json({ message: "User not found" });
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
    const existingFavorite = user.favorites.find(
      (item) => item.product.toString() === productId
    );

    if (existingFavorite) {
      return res.status(400).json({
        message: "Product already in favorites",
      });
    }

    // Add to favorites
    user.favorites.push({
      product: productId,
      addedAt: new Date(),
    });

    await user.save();

    res.status(200).json({
      status: "success",
      data: {
        favorites: user.favorites,
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
      return res.status(404).json({ message: "User not found" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { productId } = req.params;

    // Remove from favorites
    user.favorites = user.favorites.filter(
      (item) => item.product.toString() !== productId
    );

    await user.save();

    res.status(200).json({
      status: "success",
      data: {
        favorites: user.favorites,
      },
    });
  }
);

/**
 * @desc    Get user favorites/wishlist
 * @route   GET /api/users/favorites
 * @access  Private
 */
export const getFavorites = catchAsync(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = await User.findById(req.user._id).populate({
      path: "favorites.product",
      select: "name price images description rating numReviews",
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      status: "success",
      results: user.favorites.length,
      data: {
        favorites: user.favorites,
      },
    });
  }
);

/**
 * @desc    Get user order history
 * @route   GET /api/users/orders
 * @access  Private
 */
export const getOrderHistory = catchAsync(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = await User.findById(req.user._id).populate({
      path: "orderHistory.order",
      select:
        "orderItems shippingAddress paymentMethod totalPrice isPaid paidAt isDelivered deliveredAt",
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      status: "success",
      results: user.orderHistory.length,
      data: {
        orderHistory: user.orderHistory,
      },
    });
  }
);

/**
 * @desc    Verify user email
 * @route   GET /api/users/verify-email/:token
 * @access  Public
 */
export const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const { token } = req.params;

  // Hash the token from the URL to compare with stored hashed token
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // Find user with the token and check if token is still valid
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      status: "fail",
      message: "Token is invalid or has expired",
    });
  }

  // Update user verification status
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    message: "Email verified successfully",
  });
});

/**
 * @desc    Request password reset
 * @route   POST /api/users/forgot-password
 * @access  Public
 */
export const forgotPassword = catchAsync(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "No user found with that email" });
    }

    // Generate reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetURL = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/users/reset-password/${resetToken}`;

    // In a production environment, you would send an email with the reset URL
    // For this implementation, we'll just return the token in the response
    // NOTE: In a real application, you would NOT send the token in the response for security reasons

    try {
      // Send password reset email
      await sendPasswordResetEmail(user.email, user.name, resetURL);

      res.status(200).json({
        status: "success",
        message: "Password reset token sent to email",
        // In a real application, you would remove the following line
        resetURL: resetURL,
      });
    } catch (err) {
      // If there's an error sending the email, reset the token fields
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        status: "error",
        message: "There was an error sending the email. Try again later.",
      });
    }
  }
);

/**
 * @desc    Reset password
 * @route   POST /api/users/reset-password/:token
 * @access  Public
 */
export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { token } = req.params;
  const { password } = req.body;

  // Hash the token from the URL to compare with stored hashed token
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // Find user with the token and check if token is still valid
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      status: "fail",
      message: "Token is invalid or has expired",
    });
  }

  // Update password and clear reset token fields
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Generate new JWT token for the user
  const jwtToken = generateToken(user._id);

  res.status(200).json({
    status: "success",
    message: "Password reset successfully",
    data: {
      token: jwtToken,
    },
  });
});
