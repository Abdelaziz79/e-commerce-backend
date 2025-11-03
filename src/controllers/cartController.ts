import { Response } from "express";
import Product from "../models/productModel";
import User from "../models/userModel";
import { AuthRequest } from "../types/user.types";
import catchAsync from "../utils/catchAsync";

/**
 * @desc    Add item to cart
 * @route   POST /api/users/cart
 * @access  Private
 */
export const addToCart = catchAsync(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const { productId, quantity = 1, variation } = req.body;

  // Validate that product exists
  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  // Check stock availability for variations or main product
  let availableStock = product.countInStock;
  let productPrice = product.price;
  let productImage = product.mainImage || product.images[0];

  if (variation && product.hasVariations) {
    const productVariation = product.variations.find(
      (v) => v.sku === variation.sku
    );
    if (!productVariation) {
      return res.status(400).json({ message: "Product variation not found" });
    }
    availableStock = productVariation.countInStock;
    productPrice = productVariation.price;
  }

  // Check if enough stock is available
  if (availableStock < quantity) {
    return res.status(400).json({
      message: `Only ${availableStock} items available in stock`,
    });
  }

  // Check if product with same variation already in cart
  const existingProductIndex = user.cart.findIndex((item: any) => {
    const sameProduct = item.product.toString() === productId;
    if (!variation) return sameProduct;

    // Compare variations if they exist
    return sameProduct && item.variation?.sku === variation.sku;
  });

  if (existingProductIndex >= 0) {
    // Check if total quantity would exceed stock
    const newQuantity = user.cart[existingProductIndex].quantity + quantity;
    if (newQuantity > availableStock) {
      return res.status(400).json({
        message: `Cannot add ${quantity} more items. Only ${
          availableStock - user.cart[existingProductIndex].quantity
        } more can be added`,
      });
    }

    user.cart[existingProductIndex].quantity = newQuantity;
  } else {
    // Add new product to cart
    user.cart.push({
      product: productId,
      name: product.name,
      price: productPrice,
      quantity: quantity,
      image: productImage,
      variation: variation || undefined,
    });
  }

  await user.save();

  res.status(200).json({
    status: "success",
    message: "Item added to cart successfully",
    data: {
      cart: user.cart,
      cartCount: user.cart.reduce((total, item) => total + item.quantity, 0),
    },
  });
});

/**
 * @desc    Clear cart
 * @route   DELETE /api/users/cart
 * @access  Private
 */
export const clearCart = catchAsync(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  user.cart = [];
  await user.save();

  res.status(200).json({
    status: "success",
    message: "Cart cleared successfully",
    data: {
      cart: user.cart,
      cartCount: 0,
    },
  });
});

/**
 * @desc    Get user's cart
 * @route   GET /api/users/cart
 * @access  Private
 */
export const getCart = catchAsync(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const user = await User.findById(req.user._id).populate({
    path: "cart.product",
    select:
      "name price images countInStock hasVariations variations onSale salePrice",
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Calculate cart totals and validate stock
  let cartTotal = 0;
  const cartWithValidation = user.cart.map((item: any) => {
    const cartItem = item.toObject();

    // Check if product still exists and is in stock
    if (!item.product) {
      cartItem.stockStatus = "unavailable";
      cartItem.maxQuantity = 0;
    } else {
      let availableStock = item.product.countInStock;
      let currentPrice = item.product.price;

      // Handle variations
      if (item.variation && item.product.hasVariations) {
        const variation = item.product.variations.find(
          (v: any) => v.sku === item.variation.sku
        );
        if (variation) {
          availableStock = variation.countInStock;
          currentPrice = variation.price;
        }
      }

      // Check for sale price
      if (item.product.onSale && item.product.salePrice) {
        currentPrice = item.product.salePrice;
      }

      cartItem.stockStatus = availableStock > 0 ? "available" : "out_of_stock";
      cartItem.maxQuantity = availableStock;
      cartItem.currentPrice = currentPrice;
      cartItem.priceChanged = currentPrice !== item.price;

      if (availableStock > 0) {
        cartTotal += currentPrice * Math.min(item.quantity, availableStock);
      }
    }

    return cartItem;
  });

  res.status(200).json({
    status: "success",
    data: {
      cart: cartWithValidation,
      cartCount: user.cart.reduce((total, item) => total + item.quantity, 0),
      cartTotal: parseFloat(cartTotal.toFixed(2)),
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
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { productId } = req.params;
    const { quantity, variationSku } = req.body;

    // Find product in cart
    const productIndex = user.cart.findIndex((item: any) => {
      const sameProduct = item.product.toString() === productId;
      if (!variationSku) return sameProduct;
      return sameProduct && item.variation?.sku === variationSku;
    });

    if (productIndex === -1) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    // Update quantity or remove if quantity is 0
    if (quantity <= 0) {
      user.cart.splice(productIndex, 1);
    } else {
      // Validate stock before updating
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product no longer exists" });
      }

      let availableStock = product.countInStock;
      if (variationSku && product.hasVariations) {
        const variation = product.variations.find(
          (v) => v.sku === variationSku
        );
        if (!variation) {
          return res
            .status(400)
            .json({ message: "Product variation not found" });
        }
        availableStock = variation.countInStock;
      }

      if (quantity > availableStock) {
        return res.status(400).json({
          message: `Only ${availableStock} items available in stock`,
        });
      }

      user.cart[productIndex].quantity = quantity;
    }

    await user.save();

    res.status(200).json({
      status: "success",
      message:
        quantity > 0 ? "Cart updated successfully" : "Item removed from cart",
      data: {
        cart: user.cart,
        cartCount: user.cart.reduce((total, item) => total + item.quantity, 0),
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
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { productId } = req.params;
    const { variationSku } = req.query;

    // Store original cart length to check if item was found
    const originalLength = user.cart.length;

    // Remove product from cart
    user.cart = user.cart.filter((item: any) => {
      const sameProduct = item.product.toString() === productId;
      if (!variationSku) return !sameProduct;
      return !(sameProduct && item.variation?.sku === variationSku);
    });

    if (user.cart.length === originalLength) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    await user.save();

    res.status(200).json({
      status: "success",
      message: "Item removed from cart successfully",
      data: {
        cart: user.cart,
        cartCount: user.cart.reduce((total, item) => total + item.quantity, 0),
      },
    });
  }
);
