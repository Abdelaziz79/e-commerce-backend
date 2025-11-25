import { Response } from "express";
import Product from "../models/productModel";
import User from "../models/userModel";
import { ProductDocument } from "../types/product.types";
import { AuthRequest } from "../types/user.types";
import catchAsync from "../utils/catchAsync";
import { calculateOrderTotals } from "../utils/orderCalculations";

interface PopulatedCartItem {
  product: ProductDocument | null;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variation?: {
    size?: string;
    color?: string;
    material?: string;
    style?: string;
    sku?: string;
  };
  _id?: string;
}

/**
 * @desc    Calculate cart totals with tax, shipping, and discount
 * @route   POST /api/users/cart/calculate
 * @access  Private
 * @body    { shippingAddress, discountCode? }
 */
export const calculateCartTotals = catchAsync(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { shippingAddress, discountCode } = req.body;

    // Validate shipping address
    if (!shippingAddress || !shippingAddress.country || !shippingAddress.city) {
      return res.status(400).json({
        status: "error",
        message: "Valid shipping address is required",
      });
    }

    const user = await User.findById(req.user._id).populate({
      path: "cart.product",
      select: "name price weight category",
      populate: {
        path: "category",
        select: "_id name",
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.cart.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Cart is empty",
      });
    }

    // Calculate items price
    const itemsPrice = user.cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Get product IDs and categories
    const productIds: string[] = [];
    const categoryIds: Set<string> = new Set();
    let totalWeight = 0;

    user.cart.forEach((item: any) => {
      if (item.product) {
        productIds.push(item.product._id.toString());
        if (item.product.category) {
          categoryIds.add(item.product.category._id.toString());
        }
        totalWeight += (item.product.weight || 0) * item.quantity;
      }
    });

    // Calculate totals with tax, shipping, and discount
    const totals = await calculateOrderTotals(
      itemsPrice,
      shippingAddress,
      totalWeight,
      discountCode,
      productIds,
      Array.from(categoryIds),
      req.user._id.toString()
    );

    // IMPROVED: If there's a discount error, return valid totals WITHOUT discount
    if (totals.error) {
      // Return response with error but valid tax/shipping calculations
      return res.status(200).json({
        status: "success",
        data: {
          itemsPrice: parseFloat(itemsPrice.toFixed(2)),
          subtotal: parseFloat(itemsPrice.toFixed(2)), // No discount applied
          tax: totals.taxPrice,
          taxDetails: totals.taxDetails,
          shipping: totals.shippingPrice,
          shippingDetails: totals.shippingDetails,
          discount: 0, // No discount
          discountDetails: undefined, // Clear discount details
          total: parseFloat(
            (itemsPrice + totals.taxPrice + totals.shippingPrice).toFixed(2)
          ),
          error: totals.error, // Include error message
          breakdown: {
            "Items Total": parseFloat(itemsPrice.toFixed(2)),
            "After Discount": parseFloat(itemsPrice.toFixed(2)),
            Tax: totals.taxPrice,
            Shipping: totals.shippingPrice,
            "Final Total": parseFloat(
              (itemsPrice + totals.taxPrice + totals.shippingPrice).toFixed(2)
            ),
          },
        },
      });
    }

    // Valid discount or no discount - return normal totals
    res.status(200).json({
      status: "success",
      data: {
        itemsPrice: parseFloat(itemsPrice.toFixed(2)),
        subtotal: totals.subtotal,
        tax: totals.taxPrice,
        taxDetails: totals.taxDetails,
        shipping: totals.shippingPrice,
        shippingDetails: totals.shippingDetails,
        discount: totals.discountAmount,
        discountDetails: totals.discountDetails,
        total: totals.totalPrice,
        breakdown: {
          "Items Total": parseFloat(itemsPrice.toFixed(2)),
          ...(totals.discountAmount > 0 && {
            Discount: `-${totals.discountAmount.toFixed(2)}`,
          }),
          "After Discount": totals.subtotal,
          Tax: totals.taxPrice,
          Shipping: totals.shippingPrice,
          "Final Total": totals.totalPrice,
        },
      },
    });
  }
);

/**
 * @desc    Add item to cart
 * @route   POST /api/users/cart
 * @access  Private
 * @body    { productId, quantity?, variation? }
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

  // Get price, stock, and image based on variation or main product
  let availableStock = product.countInStock;
  let productPrice = product.price;
  let productImage = product.mainImage || product.images[0];
  let selectedVariation = undefined;

  // If variation is provided, validate and use it
  if (variation && variation.sku) {
    if (!product.hasVariations) {
      return res.status(400).json({
        message: "This product does not support variations",
      });
    }

    const productVariation = product.variations.find(
      (v) => v.sku === variation.sku
    );

    if (!productVariation) {
      return res.status(400).json({ message: "Product variation not found" });
    }

    // Use variation-specific data
    availableStock = productVariation.countInStock;
    productPrice = productVariation.price;
    selectedVariation = {
      size: productVariation.size,
      color: productVariation.color,
      material: productVariation.material,
      style: productVariation.style,
      sku: productVariation.sku,
    };
  }

  // Apply sale price if available (only for main product, not variations)
  if (!selectedVariation && product.onSale && product.salePrice) {
    productPrice = product.salePrice;
  }

  // Check if enough stock is available
  if (availableStock < quantity) {
    return res.status(400).json({
      message: `Only ${availableStock} items available in stock`,
    });
  }

  // Find existing cart item (same product + same/no variation)
  const existingProductIndex = user.cart.findIndex((item: any) => {
    // Convert both to string for proper comparison
    const sameProduct = item.product.toString() === productId.toString();
    if (!sameProduct) return false;

    // Both have no variation or undefined variation
    if (!selectedVariation && (!item.variation || !item.variation.sku)) {
      return true;
    }

    // Both have variation - compare SKU
    if (selectedVariation && item.variation && item.variation.sku) {
      return item.variation.sku === selectedVariation.sku;
    }

    // One has variation, other doesn't - different items
    return false;
  });

  if (existingProductIndex >= 0) {
    // Product already in cart, update quantity
    const newQuantity = user.cart[existingProductIndex].quantity + quantity;

    if (newQuantity > availableStock) {
      const canAdd = availableStock - user.cart[existingProductIndex].quantity;
      return res.status(400).json({
        message: `Cannot add ${quantity} more items. Only ${canAdd} more can be added`,
      });
    }

    user.cart[existingProductIndex].quantity = newQuantity;
    user.cart[existingProductIndex].price = productPrice; // Update price in case it changed
  } else {
    // Add new item to cart
    user.cart.push({
      product: productId,
      name: product.name,
      price: productPrice,
      quantity: quantity,
      image: productImage,
      variation: selectedVariation,
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
 * @desc    Get user's cart with automatic stock adjustment
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
      "name price images countInStock hasVariations variations onSale salePrice mainImage",
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  let cartTotal = 0;
  let cartModified = false;
  const cartWithValidation: any[] = [];
  const itemsToRemove: number[] = []; // Track indices of items to remove

  for (let i = 0; i < user.cart.length; i++) {
    const item = user.cart[i] as any as PopulatedCartItem;
    const cartItem: any = {
      product: item.product?._id || null,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
      variation: item.variation,
    };

    // Handle deleted products - mark for removal
    if (!item.product) {
      cartItem.stockStatus = "unavailable";
      cartItem.maxQuantity = 0;
      cartItem.currentPrice = 0;
      cartItem.priceChanged = false;
      cartItem.quantity = 0;
      itemsToRemove.push(i);
      cartWithValidation.push(cartItem);
      continue;
    }

    const productData = item.product;
    let availableStock = 0;
    let currentPrice = 0;

    // If item has variation, use variation's stock and price
    if (item.variation?.sku) {
      const variation = productData.variations?.find(
        (v) => v.sku === item.variation!.sku
      );

      if (!variation) {
        // Variation was deleted - mark for removal
        cartItem.stockStatus = "unavailable";
        cartItem.maxQuantity = 0;
        cartItem.currentPrice = 0;
        cartItem.priceChanged = false;
        cartItem.quantity = 0;
        itemsToRemove.push(i);
        cartWithValidation.push(cartItem);
        continue;
      }

      availableStock = variation.countInStock;
      currentPrice = variation.price;
    } else {
      // No variation - use main product stock and price
      availableStock = productData.countInStock;
      currentPrice = productData.price;

      // Check for sale price on main product only
      if (productData.onSale && productData.salePrice) {
        currentPrice = productData.salePrice;
      }
    }

    // AUTO-ADJUST QUANTITY if exceeds available stock
    let adjustedQuantity = item.quantity;

    if (availableStock === 0) {
      // No stock - mark for removal
      adjustedQuantity = 0;
      itemsToRemove.push(i);
      cartModified = true;
    } else if (item.quantity > availableStock) {
      // Partial stock - adjust to available
      adjustedQuantity = availableStock;
      (user.cart[i] as any).quantity = adjustedQuantity;
      cartModified = true;
    }

    // Set stock status
    cartItem.stockStatus = availableStock > 0 ? "available" : "out_of_stock";
    cartItem.maxQuantity = availableStock;
    cartItem.currentPrice = currentPrice;
    cartItem.priceChanged = Math.abs(currentPrice - item.price) > 0.01;
    cartItem.quantity = adjustedQuantity;

    // Update price if it changed (only for items not being removed)
    if (cartItem.priceChanged && availableStock > 0) {
      (user.cart[i] as any).price = currentPrice;
      cartModified = true;
    }

    // Calculate total only for available items
    if (availableStock > 0 && adjustedQuantity > 0) {
      cartTotal += currentPrice * adjustedQuantity;
    }

    cartWithValidation.push(cartItem);
  }

  // Remove out-of-stock items from cart (in reverse order to maintain indices)
  if (itemsToRemove.length > 0) {
    for (let i = itemsToRemove.length - 1; i >= 0; i--) {
      user.cart.splice(itemsToRemove[i], 1);
    }
    cartModified = true;
  }

  // Save cart if any modifications were made
  if (cartModified) {
    await user.save();
  }

  // Filter out items with 0 quantity
  const activeCart = cartWithValidation.filter((item) => item.quantity > 0);

  res.status(200).json({
    status: "success",
    data: {
      cart: cartWithValidation,
      activeCart,
      cartCount: activeCart.reduce((total, item) => total + item.quantity, 0),
      cartTotal: parseFloat(cartTotal.toFixed(2)),
      adjustmentsMade: cartModified,
    },
  });
});

/**
 * @desc    Update cart item quantity
 * @route   PUT /api/users/cart/:productId
 * @access  Private
 * @body    { quantity, variationSku? }
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

    // Find cart item
    const productIndex = user.cart.findIndex((item: any) => {
      const sameProduct = item.product.toString() === productId;
      if (!sameProduct) return false;

      // Match by variation SKU if provided
      if (variationSku) {
        return item.variation?.sku === variationSku;
      }

      // No variation provided - match items without variation
      return !item.variation || !item.variation.sku;
    });

    if (productIndex === -1) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    // Remove if quantity is 0 or less
    if (quantity <= 0) {
      user.cart.splice(productIndex, 1);
      await user.save();

      return res.status(200).json({
        status: "success",
        message: "Item removed from cart",
        data: {
          cart: user.cart,
          cartCount: user.cart.reduce(
            (total, item) => total + item.quantity,
            0
          ),
        },
      });
    }

    // Validate stock before updating
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product no longer exists" });
    }

    let availableStock = product.countInStock;
    let currentPrice = product.price;

    // Check variation stock if provided
    if (variationSku) {
      const variation = product.variations?.find((v) => v.sku === variationSku);
      if (!variation) {
        return res.status(400).json({ message: "Product variation not found" });
      }
      availableStock = variation.countInStock;
      currentPrice = variation.price;
    } else {
      // Check for sale price on main product
      if (product.onSale && product.salePrice) {
        currentPrice = product.salePrice;
      }
    }

    if (quantity > availableStock) {
      return res.status(400).json({
        message: `Only ${availableStock} items available in stock`,
      });
    }

    user.cart[productIndex].quantity = quantity;
    user.cart[productIndex].price = currentPrice; // Update price
    await user.save();

    res.status(200).json({
      status: "success",
      message: "Cart updated successfully",
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
 * @query   { variationSku? }
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

    const originalLength = user.cart.length;

    // Filter out the item(s) to remove
    user.cart = user.cart.filter((item: any) => {
      const sameProduct = item.product.toString() === productId;
      if (!sameProduct) return true; // Keep items with different product ID

      // If variation SKU specified, only remove that specific variation
      if (variationSku) {
        return item.variation?.sku !== variationSku;
      }

      // No variation specified - only remove items without variations
      return item.variation && item.variation.sku;
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
