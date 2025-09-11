import { Request, Response } from "express";
import { validationResult } from "express-validator";
import Order from "../models/orderModel";
import { AuthRequest } from "../types/user.types";
import catchAsync from "../utils/catchAsync";
import APIFeatures from "../utils/apiFeatures";
import mongoose from "mongoose";
import { OrderStatus } from "../types/order.types";

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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
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

    // Validate required fields
    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: "No order items" });
    }

    // Calculate subtotal (before tax and shipping)
    const subtotal = Number(itemsPrice);

    // Calculate discount amount if applicable
    let discountAmount = 0;
    if (discount) {
      if (discount.type === "percentage") {
        discountAmount = (subtotal * discount.value) / 100;
      } else {
        discountAmount = discount.value;
      }
      // Ensure discount doesn't exceed order value
      discountAmount = Math.min(discountAmount, subtotal);
    }

    // Create order
    const order = new Order({
      orderItems,
      user: req.user._id,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      subtotal,
      discount,
      discountAmount,
      notes,
      status: "pending" as OrderStatus,
    });

    const createdOrder = await order.save();
    res.status(201).json({
      status: "success",
      data: createdOrder,
    });
  }
);

/**
 * @desc    Get order by ID or order number
 * @route   GET /api/orders/:id
 * @access  Private
 */
export const getOrderById = catchAsync(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
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
    if (!req.user) {
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
    if (!req.user || req.user.role !== "admin") {
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
    if (!req.user || req.user.role !== "admin") {
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
    if (!req.user) {
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
  if (!req.user || req.user.role !== "admin") {
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
    if (!req.user || req.user.role !== "admin") {
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
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Verify owner or admin
    // Get the user ID string from the order.user (could be ObjectId or string)
    let orderUserId: string;

    // Ensure we can safely call toString()
    if (order.user) {
      orderUserId = order.user.toString();
    } else {
      // Fallback if user is somehow undefined
      orderUserId = "";
    }

    if (orderUserId !== req.user._id.toString() && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to cancel this order" });
    }

    // Only allow cancellation of pending or processing orders
    if (!["pending", "processing"].includes(order.status)) {
      return res.status(400).json({
        message: "Cannot cancel order. Order is already shipped or processed",
      });
    }

    // Update order
    order.status = "cancelled";

    // Add to status history
    order.statusHistory.push({
      status: "cancelled",
      date: new Date(),
      note: req.body.reason || "Cancelled by customer",
    });

    const updatedOrder = await order.save();

    res.status(200).json({
      status: "success",
      data: updatedOrder,
    });
  }
);
