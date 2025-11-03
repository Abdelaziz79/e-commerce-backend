import { Response } from "express";
import mongoose, { FilterQuery } from "mongoose";
import Order from "../models/orderModel";
import Product from "../models/productModel";
import User from "../models/userModel";
import { OrderDocument, OrderStatus } from "../types/order.types";
import { AuthRequest } from "../types/user.types";
import APIFeatures from "../utils/apiFeatures";
import catchAsync from "../utils/catchAsync";

interface PopulatedUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
}

/**
 * @desc    Create new order
 * @route   POST /api/orders
 * @access  Private
 */
export const createOrder = catchAsync(
  async (req: AuthRequest, res: Response) => {
    if (!req.user?._id) {
      return res.status(401).json({
        status: "error",
        message: "Not authorized",
      });
    }

    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      discount,
      notes,
    } = req.body;

    // Validate order items
    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "No order items provided",
      });
    }

    // Validate required fields
    if (!shippingAddress || !paymentMethod) {
      return res.status(400).json({
        status: "error",
        message: "Shipping address and payment method are required",
      });
    }

    const session = await mongoose.startSession();

    try {
      const createdOrder = await session.withTransaction(async () => {
        // Fetch all UNIQUE products in one query
        const productIds = orderItems.map((item: any) => item.product);
        const uniqueProductIds = [...new Set(productIds)];

        const products = await Product.find<any>({
          _id: { $in: uniqueProductIds },
        }).session(session);

        // Check if we found all unique products
        if (products.length !== uniqueProductIds.length) {
          const foundIds = new Set(products.map((p) => p._id.toString()));
          const missingIds = uniqueProductIds.filter(
            (id: any) => !foundIds.has(id.toString())
          );
          throw new Error(`Products not found: ${missingIds.join(", ")}`);
        }

        const productMap = new Map(products.map((p) => [p._id.toString(), p]));

        // Validate items and check stock
        const stockUpdates: Array<{
          productId: string;
          sku?: string;
          quantity: number;
        }> = [];

        for (const item of orderItems) {
          const product = productMap.get(item.product);
          if (!product) {
            throw new Error(`Product with ID ${item.product} not found`);
          }

          let expectedPrice = product.price;
          let availableStock = product.countInStock;

          // Handle variations
          if (product.hasVariations && item.variation?.sku) {
            const variation = product.variations?.find(
              (v: any) => v.sku === item.variation.sku
            );

            if (!variation) {
              throw new Error(
                `Variation "${item.variation.sku}" not found for "${product.name}"`
              );
            }

            expectedPrice = variation.price;
            availableStock = variation.countInStock;

            stockUpdates.push({
              productId: item.product,
              sku: item.variation.sku,
              quantity: item.quantity,
            });
          } else {
            stockUpdates.push({
              productId: item.product,
              quantity: item.quantity,
            });
          }

          // Validate stock
          if (availableStock < item.quantity) {
            throw new Error(
              `Insufficient stock for "${product.name}". Available: ${availableStock}, Requested: ${item.quantity}`
            );
          }

          // Validate price (allow 0.01 difference for rounding)
          if (Math.abs(expectedPrice - item.price) > 0.01) {
            throw new Error(
              `Price mismatch for "${
                product.name
              }". Expected: ${expectedPrice.toFixed(
                2
              )}, Got: ${item.price.toFixed(2)}`
            );
          }
        }

        // Calculate and validate prices
        const calculatedItemsPrice = orderItems.reduce(
          (sum: number, item: any) => sum + item.price * item.quantity,
          0
        );

        if (Math.abs(calculatedItemsPrice - itemsPrice) > 0.01) {
          throw new Error(
            `Items price mismatch. Expected: ${calculatedItemsPrice.toFixed(
              2
            )}, Got: ${itemsPrice.toFixed(2)}`
          );
        }

        // Calculate discount amount based on type
        let discountAmount = 0;
        if (discount?.value) {
          if (discount.type === "percentage") {
            discountAmount = (calculatedItemsPrice * discount.value) / 100;
          } else if (discount.type === "fixed") {
            discountAmount = discount.value;
          }
        }

        const subtotal = calculatedItemsPrice;
        const calculatedTotal =
          subtotal + taxPrice + shippingPrice - discountAmount;

        if (Math.abs(calculatedTotal - totalPrice) > 0.01) {
          throw new Error(
            `Total price mismatch. Expected: ${calculatedTotal.toFixed(
              2
            )}, Got: ${totalPrice.toFixed(2)}`
          );
        }

        // Update stock for all items
        for (const update of stockUpdates) {
          if (update.sku) {
            const result = await Product.updateOne(
              {
                _id: update.productId,
                "variations.sku": update.sku,
              },
              {
                $inc: { "variations.$.countInStock": -update.quantity },
              },
              { session }
            );

            if (result.matchedCount === 0) {
              throw new Error(
                `Failed to update stock for variation ${update.sku}`
              );
            }
          } else {
            const result = await Product.updateOne(
              { _id: update.productId },
              {
                $inc: { countInStock: -update.quantity },
              },
              { session }
            );

            if (result.matchedCount === 0) {
              throw new Error(
                `Failed to update stock for product ${update.productId}`
              );
            }
          }
        }

        // Create order
        const order = new Order({
          user: req.user!._id,
          orderItems,
          shippingAddress,
          paymentMethod,
          itemsPrice,
          subtotal,
          taxPrice,
          shippingPrice,
          totalPrice,
          discount,
          discountAmount,
          notes,
          status: "pending",
        });

        const savedOrder = await order.save({ session });

        // Update user's order history
        await User.findByIdAndUpdate(
          req.user!._id,
          {
            $push: {
              orderHistory: {
                order: savedOrder._id,
                totalPrice: savedOrder.totalPrice,
                status: savedOrder.status,
                createdAt: savedOrder.createdAt,
              },
            },
            $set: { cart: [] },
          },
          { session }
        );

        return savedOrder;
      });

      // Populate user after transaction
      await createdOrder!.populate("user", "name email");

      res.status(201).json({
        status: "success",
        message: "Order created successfully",
        data: { order: createdOrder },
      });
    } catch (error: any) {
      return res.status(400).json({
        status: "error",
        message: error.message || "Failed to create order",
      });
    } finally {
      await session.endSession();
    }
  }
);

/**
 * @desc    Get order by ID or order number
 * @route   GET /api/orders/:id
 * @access  Private
 */
export const getOrderById = catchAsync(
  async (req: AuthRequest, res: Response) => {
    if (!req.user?._id) {
      return res.status(401).json({
        status: "error",
        message: "Not authorized",
      });
    }

    const { id } = req.params;
    let order;

    // Check if it's a valid ObjectId or order number
    if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
      order = await Order.findById(id)
        .populate<{ user: PopulatedUser }>("user", "name email")
        .populate("orderItems.product", "name slug mainImage");
    } else {
      order = await Order.findOne({ orderNumber: id.toUpperCase() })
        .populate<{ user: PopulatedUser }>("user", "name email")
        .populate("orderItems.product", "name slug mainImage");
    }

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "Order not found",
      });
    }

    // Check authorization
    const orderUserId = order.user._id.toString();
    if (orderUserId !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to access this order",
      });
    }

    res.status(200).json({
      status: "success",
      data: { order },
    });
  }
);

/**
 * @desc    Update order to paid
 * @route   PUT /api/orders/:id/pay
 * @access  Private
 */
export const updateOrderToPaid = catchAsync(
  async (req: AuthRequest, res: Response) => {
    if (!req.user?._id) {
      return res.status(401).json({
        status: "error",
        message: "Not authorized",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "Order not found",
      });
    }

    // Check authorization
    const orderUserId = order.user.toString();
    if (orderUserId !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to modify this order",
      });
    }

    // Check if already paid
    if (order.isPaid) {
      return res.status(400).json({
        status: "error",
        message: "Order is already paid",
      });
    }

    // Check if order is cancelled
    if (order.status === "cancelled") {
      return res.status(400).json({
        status: "error",
        message: "Cannot pay for cancelled order",
      });
    }

    // Update payment info
    order.isPaid = true;
    order.paidAt = new Date();
    order.status = "processing";

    order.paymentResult = {
      id: req.body.id || "",
      status: req.body.status || "completed",
      update_time: req.body.update_time || new Date().toISOString(),
      email_address: req.body.email_address || req.user.email,
      paymentMethod: req.body.payment_method,
      transactionFee: req.body.transaction_fee,
    };

    order.statusHistory.push({
      status: "processing",
      date: new Date(),
      note: "Payment received and verified",
    });

    const updatedOrder = await order.save();

    res.status(200).json({
      status: "success",
      message: "Payment updated successfully",
      data: { order: updatedOrder },
    });
  }
);

/**
 * @desc    Update order status
 * @route   PUT /api/orders/:id/status
 * @access  Private/Admin
 */
export const updateOrderStatus = catchAsync(
  async (req: AuthRequest, res: Response) => {
    if (!req.user?._id || req.user.role !== "admin") {
      return res.status(403).json({
        status: "error",
        message: "Not authorized",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "Order not found",
      });
    }

    const { status, note, adminNotes } = req.body;

    // Validate status transitions
    const invalidTransitions: Record<string, string[]> = {
      completed: ["pending", "processing", "shipped"],
      cancelled: ["shipped", "delivered", "completed"],
      refunded: ["pending", "processing"],
    };

    if (invalidTransitions[status]?.includes(order.status)) {
      return res.status(400).json({
        status: "error",
        message: `Cannot change status from ${order.status} to ${status}`,
      });
    }

    // Prevent changing completed/cancelled orders
    if (
      ["completed", "cancelled"].includes(order.status) &&
      order.status !== status
    ) {
      return res.status(400).json({
        status: "error",
        message: `Cannot modify ${order.status} order`,
      });
    }

    const oldStatus = order.status;
    order.status = status as OrderStatus;

    // Add to status history
    order.statusHistory.push({
      status: status as OrderStatus,
      date: new Date(),
      note: note || `Status changed from ${oldStatus} to ${status}`,
    });

    // Handle specific status changes
    if (status === "delivered" && !order.isDelivered) {
      order.isDelivered = true;
      order.deliveredAt = new Date();
    }

    if (status === "shipped" && req.body.shippingInfo) {
      order.shipping = {
        ...order.shipping,
        carrier: req.body.shippingInfo.carrier,
        trackingNumber: req.body.shippingInfo.trackingNumber,
        estimatedDeliveryDate: req.body.shippingInfo.estimatedDeliveryDate
          ? new Date(req.body.shippingInfo.estimatedDeliveryDate)
          : undefined,
        shippedAt: new Date(),
      };
    }

    if (status === "refunded" && req.body.refund) {
      order.refund = {
        amount: Number(req.body.refund.amount),
        reason: req.body.refund.reason || "Refund processed",
        date: new Date(),
        status: "processed",
      };
    }

    if (adminNotes) {
      order.adminNotes = adminNotes;
    }

    const updatedOrder = await order.save();

    res.status(200).json({
      status: "success",
      message: "Order status updated successfully",
      data: { order: updatedOrder },
    });
  }
);

/**
 * @desc    Update order to delivered
 * @route   PUT /api/orders/:id/deliver
 * @access  Private/Admin
 */
export const updateOrderToDelivered = catchAsync(
  async (req: AuthRequest, res: Response) => {
    if (!req.user?._id || req.user.role !== "admin") {
      return res.status(403).json({
        status: "error",
        message: "Not authorized",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "Order not found",
      });
    }

    if (order.status === "cancelled") {
      return res.status(400).json({
        status: "error",
        message: "Cannot deliver cancelled order",
      });
    }

    if (order.isDelivered) {
      return res.status(400).json({
        status: "error",
        message: "Order already delivered",
      });
    }

    order.isDelivered = true;
    order.deliveredAt = new Date();
    order.status = "delivered";

    order.statusHistory.push({
      status: "delivered",
      date: new Date(),
      note: req.body.note || "Order successfully delivered",
    });

    const updatedOrder = await order.save();

    res.status(200).json({
      status: "success",
      message: "Order marked as delivered",
      data: { order: updatedOrder },
    });
  }
);

/**
 * @desc    Get logged in user's orders
 * @route   GET /api/orders/myorders
 * @access  Private
 */
export const getMyOrders = catchAsync(
  async (req: AuthRequest, res: Response) => {
    if (!req.user?._id) {
      return res.status(401).json({
        status: "error",
        message: "Not authorized",
      });
    }

    const initialFilter: FilterQuery<OrderDocument> = {
      user: req.user._id,
    };

    const orderQuery = Order.find(initialFilter).populate(
      "orderItems.product",
      "name mainImage slug"
    );

    const features = new APIFeatures(orderQuery, req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const [orders, total] = await Promise.all([
      features.query,
      features.getTotalCount(),
    ]);

    const page = parseInt(String(req.query.page), 10) || 1;
    const limit = parseInt(String(req.query.limit), 10) || 10;
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      status: "success",
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    });
  }
);

/**
 * @desc    Get all orders (Admin)
 * @route   GET /api/orders
 * @access  Private/Admin
 */
export const getOrders = catchAsync(async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      status: "error",
      message: "Not authorized",
    });
  }

  const initialFilter: FilterQuery<OrderDocument> = {};

  // Handle keyword search
  if (req.query.keyword && typeof req.query.keyword === "string") {
    const keyword = req.query.keyword;
    initialFilter.$or = [
      { orderNumber: { $regex: keyword, $options: "i" } },
      { "shippingAddress.address": { $regex: keyword, $options: "i" } },
      { "shippingAddress.city": { $regex: keyword, $options: "i" } },
    ];
    delete req.query.keyword;
  }

  const orderQuery = Order.find(initialFilter)
    .populate("user", "name email")
    .populate("orderItems.product", "name mainImage");

  const features = new APIFeatures(orderQuery, req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const [orders, total] = await Promise.all([
    features.query,
    features.getTotalCount(),
  ]);

  const page = parseInt(String(req.query.page), 10) || 1;
  const limit = parseInt(String(req.query.limit), 10) || 15;
  const totalPages = Math.ceil(total / limit);

  res.status(200).json({
    status: "success",
    data: {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    },
  });
});

/**
 * @desc    Add tracking information
 * @route   PUT /api/orders/:id/tracking
 * @access  Private/Admin
 */
export const addTrackingInfo = catchAsync(
  async (req: AuthRequest, res: Response) => {
    if (!req.user?._id || req.user.role !== "admin") {
      return res.status(403).json({
        status: "error",
        message: "Not authorized",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "Order not found",
      });
    }

    const { carrier, trackingNumber, estimatedDeliveryDate } = req.body;

    order.shipping = {
      carrier,
      trackingNumber,
      estimatedDeliveryDate: estimatedDeliveryDate
        ? new Date(estimatedDeliveryDate)
        : undefined,
      shippedAt: new Date(),
    };

    // Update status if needed
    if (["pending", "processing"].includes(order.status)) {
      order.status = "shipped";
      order.statusHistory.push({
        status: "shipped",
        date: new Date(),
        note: `Shipped via ${carrier}, tracking: ${trackingNumber}`,
      });
    }

    const updatedOrder = await order.save();

    res.status(200).json({
      status: "success",
      message: "Tracking information added",
      data: { order: updatedOrder },
    });
  }
);

/**
 * @desc    Cancel order
 * @route   PUT /api/orders/:id/cancel
 * @access  Private
 */
export const cancelOrder = catchAsync(
  async (req: AuthRequest, res: Response) => {
    if (!req.user?._id) {
      return res.status(401).json({
        status: "error",
        message: "Not authorized",
      });
    }

    const session = await mongoose.startSession();

    try {
      const updatedOrder = await session.withTransaction(async () => {
        const order = await Order.findById(req.params.id).session(session);

        if (!order) {
          throw new Error("Order not found");
        }

        // Check authorization
        const orderUserId = order.user.toString();
        if (
          orderUserId !== req.user!._id.toString() &&
          req.user!.role !== "admin"
        ) {
          throw new Error("Not authorized to cancel this order");
        }

        // Check if cancellable
        if (!["pending", "processing"].includes(order.status)) {
          throw new Error(`Cannot cancel order with status: ${order.status}`);
        }

        // Restore stock
        for (const item of order.orderItems) {
          if (item.variation?.sku) {
            const result = await Product.updateOne(
              {
                _id: item.product,
                "variations.sku": item.variation.sku,
              },
              {
                $inc: { "variations.$.countInStock": item.quantity },
              },
              { session }
            );

            if (result.matchedCount === 0) {
              throw new Error(
                `Failed to restore stock for variation ${item.variation.sku}`
              );
            }
          } else {
            const result = await Product.updateOne(
              { _id: item.product },
              {
                $inc: { countInStock: item.quantity },
              },
              { session }
            );

            if (result.matchedCount === 0) {
              throw new Error(
                `Failed to restore stock for product ${item.product}`
              );
            }
          }
        }

        order.status = "cancelled";
        order.statusHistory.push({
          status: "cancelled",
          date: new Date(),
          note: req.body.reason || "Order cancelled by user",
        });

        await order.save({ session });
        return order;
      });

      res.status(200).json({
        status: "success",
        message: "Order cancelled successfully",
        data: { order: updatedOrder },
      });
    } catch (error: any) {
      return res.status(400).json({
        status: "error",
        message: error.message || "Failed to cancel order",
      });
    } finally {
      await session.endSession();
    }
  }
);

/**
 * @desc    Search orders
 * @route   GET /api/orders/search
 * @access  Private/Admin
 */
export const searchOrders = catchAsync(
  async (req: AuthRequest, res: Response) => {
    if (!req.user?._id || req.user.role !== "admin") {
      return res.status(403).json({
        status: "error",
        message: "Not authorized",
      });
    }

    const { q } = req.query;

    if (!q || typeof q !== "string") {
      return res.status(400).json({
        status: "error",
        message: "Search query required",
      });
    }

    const searchQuery = {
      $or: [
        { orderNumber: { $regex: q, $options: "i" } },
        { "shippingAddress.address": { $regex: q, $options: "i" } },
        { "shippingAddress.city": { $regex: q, $options: "i" } },
        { "shippingAddress.postalCode": { $regex: q, $options: "i" } },
        { "orderItems.name": { $regex: q, $options: "i" } },
      ],
    };

    const orders = await Order.find(searchQuery)
      .populate("user", "name email")
      .populate("orderItems.product", "name mainImage")
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      status: "success",
      results: orders.length,
      data: { orders },
    });
  }
);

/**
 * @desc    Get order analytics
 * @route   GET /api/orders/analytics
 * @access  Private/Admin
 */
export const getOrderAnalytics = catchAsync(
  async (req: AuthRequest, res: Response) => {
    if (!req.user?._id || req.user.role !== "admin") {
      return res.status(403).json({
        status: "error",
        message: "Not authorized",
      });
    }

    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last12Months = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const [
      statusCounts,
      monthlyRevenue,
      recentOrdersCount,
      totalRevenue,
      last24HoursStats,
      last30DaysStats,
      topProducts,
    ] = await Promise.all([
      // Status distribution
      Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),

      // Monthly revenue for last 12 months
      Order.aggregate([
        {
          $match: {
            isPaid: true,
            createdAt: { $gte: last12Months },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            revenue: { $sum: "$totalPrice" },
            orders: { $sum: 1 },
            averageOrderValue: { $avg: "$totalPrice" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      // Recent orders (last 24 hours)
      Order.countDocuments({ createdAt: { $gte: last24Hours } }),

      // Total revenue (all time)
      Order.aggregate([
        { $match: { isPaid: true } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),

      // Last 24 hours stats - FIXED: Only count paid orders
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: last24Hours },
            isPaid: true,
          },
        },
        {
          $group: {
            _id: null,
            orders: { $sum: 1 },
            revenue: { $sum: "$totalPrice" },
          },
        },
      ]),

      // Last 30 days stats - FIXED: Calculate average only from paid orders
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: last30Days },
            isPaid: true,
          },
        },
        {
          $group: {
            _id: null,
            orders: { $sum: 1 },
            revenue: { $sum: "$totalPrice" },
            averageOrderValue: { $avg: "$totalPrice" },
          },
        },
      ]),

      // Top selling products - FIXED: Only from paid, non-cancelled orders
      Order.aggregate([
        {
          $match: {
            status: { $nin: ["cancelled", "failed"] },
            isPaid: true,
          },
        },
        { $unwind: "$orderItems" },
        {
          $group: {
            _id: "$orderItems.product",
            totalQuantity: { $sum: "$orderItems.quantity" },
            totalRevenue: {
              $sum: {
                $multiply: ["$orderItems.quantity", "$orderItems.price"],
              },
            },
            orderCount: { $sum: 1 },
            productName: { $first: "$orderItems.name" },
          },
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 10 },
      ]),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        overview: {
          totalOrders: statusCounts.reduce((sum, s) => sum + s.count, 0),
          totalRevenue: totalRevenue[0]?.total || 0,
          recentOrdersCount,
        },
        statusDistribution: statusCounts.reduce((acc: any, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        last24Hours: last24HoursStats[0] || { orders: 0, revenue: 0 },
        last30Days: last30DaysStats[0] || {
          orders: 0,
          revenue: 0,
          averageOrderValue: 0,
        },
        monthlyRevenue,
        topProducts,
      },
    });
  }
);

/**
 * @desc    Export orders
 * @route   GET /api/orders/export
 * @access  Private/Admin
 */
export const exportOrders = catchAsync(
  async (req: AuthRequest, res: Response) => {
    if (!req.user?._id || req.user.role !== "admin") {
      return res.status(403).json({
        status: "error",
        message: "Not authorized",
      });
    }

    const { startDate, endDate, status } = req.query;

    const query: any = {};

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate as string);
      }
    }

    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate("user", "name email phone")
      .populate("orderItems.product", "name sku")
      .sort({ createdAt: -1 })
      .lean();

    // Format for export
    const exportData = orders.map((order: any) => ({
      orderNumber: order.orderNumber,
      orderDate: new Date(order.createdAt).toISOString(),
      customerName: order.user?.name || "N/A",
      customerEmail: order.user?.email || "N/A",
      customerPhone: order.user?.phone || "N/A",
      status: order.status,
      paymentMethod: order.paymentMethod,
      itemsCount: order.orderItems.length,
      subtotal: order.subtotal.toFixed(2),
      tax: order.taxPrice.toFixed(2),
      shipping: order.shippingPrice.toFixed(2),
      discount: order.discountAmount.toFixed(2),
      total: order.totalPrice.toFixed(2),
      isPaid: order.isPaid,
      paidAt: order.paidAt ? new Date(order.paidAt).toISOString() : "",
      isDelivered: order.isDelivered,
      deliveredAt: order.deliveredAt
        ? new Date(order.deliveredAt).toISOString()
        : "",
      shippingAddress: [
        order.shippingAddress.address,
        order.shippingAddress.city,
        order.shippingAddress.postalCode,
        order.shippingAddress.country,
      ].join(", "),
      trackingNumber: order.shipping?.trackingNumber || "",
      carrier: order.shipping?.carrier || "",
      notes: order.notes || "",
      adminNotes: order.adminNotes || "",
    }));

    res.status(200).json({
      status: "success",
      count: exportData.length,
      data: { orders: exportData },
    });
  }
);

/**
 * @desc    Get user order statistics
 * @route   GET /api/orders/user-stats
 * @access  Private
 */
export const getUserOrderStats = catchAsync(
  async (req: AuthRequest, res: Response) => {
    if (!req.user?._id) {
      return res.status(401).json({
        status: "error",
        message: "Not authorized",
      });
    }

    const userId = new mongoose.Types.ObjectId(req.user._id);

    const [orderStats, recentOrders, statusBreakdown] = await Promise.all([
      // Overall statistics - FIXED: Calculate from paid orders only
      Order.aggregate([
        { $match: { user: userId } },
        {
          $facet: {
            overall: [
              {
                $group: {
                  _id: null,
                  totalOrders: { $sum: 1 },
                  paidOrdersCount: {
                    $sum: { $cond: [{ $eq: ["$isPaid", true] }, 1, 0] },
                  },
                  totalSpent: {
                    $sum: {
                      $cond: [{ $eq: ["$isPaid", true] }, "$totalPrice", 0],
                    },
                  },
                  completedOrders: {
                    $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
                  },
                  cancelledOrders: {
                    $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
                  },
                  pendingOrders: {
                    $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
                  },
                  processingOrders: {
                    $sum: { $cond: [{ $eq: ["$status", "processing"] }, 1, 0] },
                  },
                  shippedOrders: {
                    $sum: { $cond: [{ $eq: ["$status", "shipped"] }, 1, 0] },
                  },
                },
              },
            ],
            paidOrders: [
              { $match: { isPaid: true } },
              {
                $group: {
                  _id: null,
                  averageOrderValue: { $avg: "$totalPrice" },
                  totalPaidAmount: { $sum: "$totalPrice" },
                },
              },
            ],
          },
        },
      ]),

      // Recent orders
      Order.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("orderNumber status totalPrice createdAt isPaid isDelivered")
        .lean(),

      // Status breakdown
      Order.aggregate([
        { $match: { user: userId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const overallStats = orderStats[0]?.overall[0] || {
      totalOrders: 0,
      paidOrdersCount: 0,
      totalSpent: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      pendingOrders: 0,
      processingOrders: 0,
      shippedOrders: 0,
    };

    const paidStats = orderStats[0]?.paidOrders[0] || {
      averageOrderValue: 0,
      totalPaidAmount: 0,
    };

    const statusCounts = statusBreakdown.reduce((acc: any, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    res.status(200).json({
      status: "success",
      data: {
        totalOrders: overallStats.totalOrders,
        totalSpent: overallStats.totalSpent,
        averageOrderValue: paidStats.averageOrderValue || 0,
        completedOrders: overallStats.completedOrders,
        cancelledOrders: overallStats.cancelledOrders,
        pendingOrders: overallStats.pendingOrders,
        processingOrders: overallStats.processingOrders,
        shippedOrders: overallStats.shippedOrders,
        paidOrdersCount: overallStats.paidOrdersCount,
        statusCounts,
        recentOrders,
      },
    });
  }
);
