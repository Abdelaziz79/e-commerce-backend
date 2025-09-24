import { Response } from "express";
import mongoose from "mongoose";
import Order from "../models/orderModel";
import Product from "../models/productModel";
import User from "../models/userModel";
import { OrderStatus } from "../types/order.types";
import { AuthRequest } from "../types/user.types";
import APIFeatures from "../utils/apiFeatures";
import catchAsync from "../utils/catchAsync";

// Type for populated user field in order
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
    // 1. Authenticate user
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

    // 2. Validate incoming data
    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "No order items provided",
      });
    }

    // 3. Start a database session and transaction
    const session = await mongoose.startSession();
    try {
      // The result of the transaction will be stored in 'createdOrder'
      const createdOrder = await session.withTransaction(async () => {
        // --- START OF TRANSACTION LOGIC ---

        const productIds = orderItems.map((item: any) => item.product);
        const products = await Product.find({ _id: { $in: productIds } })
          .session(session)
          .lean();
        const productMap = new Map(products.map((p) => [p._id.toString(), p]));

        // Validate each item and prepare for stock update
        for (const item of orderItems) {
          const product = productMap.get(item.product);
          if (!product) {
            throw new Error(`Product "${item.name}" not found`);
          }

          let expectedPrice = product.price;
          let availableStock = product.countInStock;

          if (product.hasVariations && item.variation?.sku) {
            const variation = product.variations?.find(
              (v) => v.sku === item.variation.sku
            );
            if (!variation) {
              throw new Error(
                `Variation with SKU "${item.variation.sku}" not found for "${item.name}"`
              );
            }
            expectedPrice = variation.price;
            availableStock = variation.countInStock;
          }

          if (availableStock < item.quantity) {
            throw new Error(
              `Insufficient stock for "${item.name}". Available: ${availableStock}, Requested: ${item.quantity}`
            );
          }
          if (Math.abs(expectedPrice - item.price) > 0.01) {
            throw new Error(
              `Price mismatch for "${item.name}". Expected: ${expectedPrice}, Provided: ${item.price}`
            );
          }
        }

        // Update stock for all products
        for (const item of orderItems) {
          if (item.variation?.sku) {
            await Product.updateOne(
              { _id: item.product, "variations.sku": item.variation.sku },
              { $inc: { "variations.$.countInStock": -item.quantity } },
              { session }
            );
          } else {
            await Product.updateOne(
              { _id: item.product },
              { $inc: { countInStock: -item.quantity } },
              { session }
            );
          }
        }

        // Generate a unique order number
        const date = new Date();
        const year = date.getFullYear().toString().substr(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        const randomPart = Math.floor(
          100000 + Math.random() * 900000
        ).toString();
        const orderNumber = `ORD-${year}${month}${day}-${randomPart}`;

        // Create the new order
        const order = new Order({
          orderNumber,
          orderItems,
          user: req.user!._id,
          shippingAddress,
          paymentMethod,
          itemsPrice,
          taxPrice,
          shippingPrice,
          totalPrice,
          discount,
          notes,
          status: "pending",
          statusHistory: [
            { status: "pending", date: new Date(), note: "Order created" },
          ],
        });

        const newOrder = await order.save({ session });

        // Update user's order history
        await User.findByIdAndUpdate(
          req.user!._id,
          {
            $push: {
              orderHistory: {
                order: newOrder._id,
                totalPrice: newOrder.totalPrice,
                status: newOrder.status,
                createdAt: newOrder.createdAt,
              },
            },
          },
          { session }
        );

        return newOrder; // This is returned by session.withTransaction
        // --- END OF TRANSACTION LOGIC ---
      });

      // If the transaction was successful, 'createdOrder' will be defined
      if (createdOrder) {
        // Populate user details for the response outside the transaction
        await createdOrder.populate("user", "name email");

        res.status(201).json({
          status: "success",
          message: "Order created successfully",
          data: { order: createdOrder },
        });
      } else {
        // This case should ideally not be reached if an error isn't thrown
        throw new Error("Order creation failed after transaction.");
      }
    } catch (error: any) {
      // The catch block handles any error thrown inside the transaction
      return res.status(400).json({
        status: "error",
        message: error.message || "Failed to create order",
      });
    } finally {
      // 4. End the session
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
      return res.status(401).json({ message: "Not authorized" });
    }

    let order;
    const { id } = req.params;

    // Check if ID is MongoDB ObjectId or order number
    if (mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id).populate<{ user: PopulatedUser }>(
        "user",
        "name email"
      );
    } else {
      // Search by order number
      order = await Order.findOne({ orderNumber: id }).populate<{
        user: PopulatedUser;
      }>("user", "name email");
    }

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if order belongs to user or user is admin
    if (
      order.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to access this order" });
    }

    res.status(200).json({
      status: "success",
      data: order,
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
      return res.status(401).json({ message: "Not authorized" });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update order
    order.isPaid = true;
    order.paidAt = new Date();
    order.status = "processing";

    // Add payment result
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.email_address,
      paymentMethod: req.body.payment_method,
      transactionFee: req.body.transaction_fee,
    };

    // Update status history
    order.statusHistory.push({
      status: order.status,
      date: new Date(),
      note: "Payment received, order processing",
    });

    const updatedOrder = await order.save();

    res.status(200).json({
      status: "success",
      data: updatedOrder,
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
      return res.status(401).json({ message: "Not authorized" });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const { status, note } = req.body;

    // Validate status
    const validStatuses: OrderStatus[] = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
      "on-hold",
      "failed",
      "completed",
    ];

    if (!validStatuses.includes(status as OrderStatus)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Update order status
    order.status = status as OrderStatus;

    // Add status history entry
    order.statusHistory.push({
      status: status as OrderStatus,
      date: new Date(),
      note: note || `Status updated to ${status}`,
    });

    // Handle specific status changes
    if (status === "delivered") {
      order.isDelivered = true;
      order.deliveredAt = new Date();
    } else if (status === "shipped") {
      // Update shipping info if provided
      if (req.body.carrier) {
        order.shipping = {
          ...order.shipping,
          carrier: req.body.carrier,
          trackingNumber: req.body.trackingNumber,
          estimatedDeliveryDate: req.body.estimatedDeliveryDate
            ? new Date(req.body.estimatedDeliveryDate)
            : undefined,
          shippedAt: new Date(),
        };
      }
    } else if (status === "refunded" && req.body.refundAmount) {
      // Add refund information
      order.refund = {
        amount: Number(req.body.refundAmount),
        reason: req.body.refundReason || "Customer request",
        date: new Date(),
        status: "processed",
      };
    }

    // Add admin notes if provided
    if (req.body.adminNotes) {
      order.adminNotes = req.body.adminNotes;
    }

    const updatedOrder = await order.save();

    res.status(200).json({
      status: "success",
      data: updatedOrder,
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
      return res.status(401).json({ message: "Not authorized" });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update order
    order.isDelivered = true;
    order.deliveredAt = new Date();
    order.status = "delivered";

    // Update status history
    order.statusHistory.push({
      status: "delivered",
      date: new Date(),
      note: req.body.note || "Order delivered",
    });

    const updatedOrder = await order.save();

    res.status(200).json({
      status: "success",
      data: updatedOrder,
    });
  }
);

/**
 * @desc    Get logged in user orders
 * @route   GET /api/orders/myorders
 * @access  Private
 */
export const getMyOrders = catchAsync(
  async (req: AuthRequest, res: Response) => {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const features = new APIFeatures(
      Order.find({ user: req.user._id }),
      req.query
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const orders = await features.query;
    const total = await features.getTotalCount();

    res.status(200).json({
      status: "success",
      results: orders.length,
      total,
      data: orders,
    });
  }
);

/**
 * @desc    Get all orders with filtering, sorting, and pagination
 * @route   GET /api/orders
 * @access  Private/Admin
 */
export const getOrders = catchAsync(async (req: AuthRequest, res: Response) => {
  if (!req.user?._id || req.user.role !== "admin") {
    return res.status(401).json({ message: "Not authorized" });
  }

  const features = new APIFeatures(
    Order.find().populate("user", "id name email"),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const orders = await features.query;
  const total = await features.getTotalCount();

  const page = Number(req.query.page?.toString() || "1");
  const limit = Number(req.query.limit?.toString() || "10");

  res.status(200).json({
    status: "success",
    results: orders.length,
    page,
    pages: Math.ceil(total / limit),
    total,
    data: orders,
  });
});

/**
 * @desc    Add tracking information to order
 * @route   PUT /api/orders/:id/tracking
 * @access  Private/Admin
 */
export const addTrackingInfo = catchAsync(
  async (req: AuthRequest, res: Response) => {
    if (!req.user?._id || req.user.role !== "admin") {
      return res.status(401).json({ message: "Not authorized" });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const { carrier, trackingNumber, estimatedDeliveryDate } = req.body;

    // Update shipping info
    order.shipping = {
      carrier,
      trackingNumber,
      estimatedDeliveryDate: estimatedDeliveryDate
        ? new Date(estimatedDeliveryDate)
        : undefined,
      shippedAt: new Date(),
    };

    // Update order status if it's not already shipped or beyond
    if (order.status === "pending" || order.status === "processing") {
      order.status = "shipped";

      // Add to status history
      order.statusHistory.push({
        status: "shipped",
        date: new Date(),
        note: `Order shipped via ${carrier}, tracking #${trackingNumber}`,
      });
    }

    const updatedOrder = await order.save();

    res.status(200).json({
      status: "success",
      data: updatedOrder,
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
    // 1. Authenticate user
    if (!req.user?._id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // 2. Start a database session
    const session = await mongoose.startSession();

    try {
      // 3. Execute logic within a transaction
      const updatedOrder = await session.withTransaction(async () => {
        // --- START OF TRANSACTION LOGIC ---
        const order = await Order.findById(req.params.id).session(session);

        if (!order) {
          throw new Error("Order not found");
        }

        // Verify user is the owner or an admin
        const orderUserId = order.user.toString();
        if (
          orderUserId !== req.user!._id.toString() &&
          req.user!.role !== "admin"
        ) {
          throw new Error("Not authorized to cancel this order");
        }

        // Check if the order is in a cancellable state
        if (!["pending", "processing"].includes(order.status)) {
          throw new Error(
            "Cannot cancel order. It has already been shipped or completed."
          );
        }

        // Restore inventory for each item in the order
        for (const item of order.orderItems) {
          if (item.variation?.sku) {
            // Restore variation stock
            await Product.updateOne(
              { _id: item.product, "variations.sku": item.variation.sku },
              { $inc: { "variations.$.countInStock": item.quantity } },
              { session }
            );
          } else {
            // Restore main product stock
            await Product.updateOne(
              { _id: item.product },
              { $inc: { countInStock: item.quantity } },
              { session }
            );
          }
        }

        // Update the order status
        order.status = "cancelled";
        order.statusHistory.push({
          status: "cancelled",
          date: new Date(),
          note: req.body.reason || "Cancelled by user",
        });

        await order.save({ session });
        return order; // This is returned by session.withTransaction
        // --- END OF TRANSACTION LOGIC ---
      });

      res.status(200).json({
        status: "success",
        data: updatedOrder,
      });
    } catch (error: any) {
      // The catch block handles any error thrown inside the transaction
      return res.status(400).json({
        status: "error",
        message: error.message || "Failed to cancel order",
      });
    } finally {
      // 4. End the session
      await session.endSession();
    }
  }
);

/**
 * @desc    Search orders by order number, address, city
 * @route   GET /api/orders/search
 * @access  Private/Admin
 */
export const searchOrders = catchAsync(
  async (req: AuthRequest, res: Response) => {
    if (!req.user?._id || req.user.role !== "admin") {
      return res.status(401).json({ message: "Not authorized" });
    }

    const { q } = req.query;

    if (!q || typeof q !== "string") {
      return res.status(400).json({ message: "Search query required" });
    }

    const searchQuery = {
      $or: [
        { orderNumber: { $regex: q, $options: "i" } },
        { "shippingAddress.address": { $regex: q, $options: "i" } },
        { "shippingAddress.city": { $regex: q, $options: "i" } },
        { "orderItems.name": { $regex: q, $options: "i" } },
      ],
    };

    const orders = await Order.find(searchQuery)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      status: "success",
      results: orders.length,
      data: orders,
    });
  }
);

/**
 * @desc    Get order analytics for admin dashboard
 * @route   GET /api/orders/analytics
 * @access  Private/Admin
 */
export const getOrderAnalytics = catchAsync(
  async (req: AuthRequest, res: Response) => {
    if (!req.user?._id || req.user.role !== "admin") {
      return res.status(401).json({ message: "Not authorized" });
    }

    const [statusCounts, monthlyRevenue, recentOrders, totalRevenue] =
      await Promise.all([
        // Order status distribution
        Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),

        // Monthly revenue for last 12 months
        Order.aggregate([
          {
            $match: {
              isPaid: true,
              createdAt: {
                $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
              },
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
            },
          },
          { $sort: { "_id.year": -1, "_id.month": -1 } },
        ]),

        // Recent orders count (last 24 hours)
        Order.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        }),

        // Total revenue
        Order.aggregate([
          { $match: { isPaid: true } },
          { $group: { _id: null, total: { $sum: "$totalPrice" } } },
        ]),
      ]);

    res.status(200).json({
      status: "success",
      data: {
        statusCounts,
        monthlyRevenue,
        recentOrdersCount: recentOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
      },
    });
  }
);

/**
 * @desc    Export orders for reporting
 * @route   GET /api/orders/export
 * @access  Private/Admin
 */
export const exportOrders = catchAsync(
  async (req: AuthRequest, res: Response) => {
    if (!req.user?._id || req.user.role !== "admin") {
      return res.status(401).json({ message: "Not authorized" });
    }

    const { startDate, endDate, status } = req.query;

    const query: any = {};
    if (startDate) query.createdAt = { $gte: new Date(startDate as string) };
    if (endDate)
      query.createdAt = {
        ...query.createdAt,
        $lte: new Date(endDate as string),
      };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    // Format for CSV export
    const csvData = orders.map((order) => ({
      orderNumber: order.orderNumber,
      customerName: (order.user as any)?.name,
      customerEmail: (order.user as any)?.email,
      status: order.status,
      itemsPrice: order.itemsPrice,
      taxPrice: order.taxPrice,
      shippingPrice: order.shippingPrice,
      totalPrice: order.totalPrice,
      isPaid: order.isPaid,
      isDelivered: order.isDelivered,
      createdAt: order.createdAt.toISOString(),
      paidAt: order.paidAt?.toISOString() || "",
      deliveredAt: order.deliveredAt?.toISOString() || "",
      shippingAddress: `${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.postalCode}, ${order.shippingAddress.country}`,
      paymentMethod: order.paymentMethod,
      trackingNumber: order.shipping?.trackingNumber || "",
      carrier: order.shipping?.carrier || "",
    }));

    res.status(200).json({
      status: "success",
      count: csvData.length,
      data: csvData,
    });
  }
);

/**
 * @desc    Get order statistics for a specific user
 * @route   GET /api/orders/user-stats
 * @access  Private
 */
export const getUserOrderStats = catchAsync(
  async (req: AuthRequest, res: Response) => {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const userId = req.user._id;

    const [orderStats, recentOrders] = await Promise.all([
      Order.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalSpent: { $sum: "$totalPrice" },
            averageOrderValue: { $avg: "$totalPrice" },
            statusBreakdown: {
              $push: "$status",
            },
          },
        },
      ]),

      Order.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("orderNumber status totalPrice createdAt"),
    ]);

    const stats = orderStats[0] || {
      totalOrders: 0,
      totalSpent: 0,
      averageOrderValue: 0,
      statusBreakdown: [],
    };

    // Count status occurrences
    const statusCounts = stats.statusBreakdown.reduce(
      (acc: any, status: string) => {
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {}
    );

    res.status(200).json({
      status: "success",
      data: {
        totalOrders: stats.totalOrders,
        totalSpent: stats.totalSpent,
        averageOrderValue: stats.averageOrderValue,
        statusCounts,
        recentOrders,
      },
    });
  }
);
