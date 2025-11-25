// src/models/orderModel.ts
import mongoose, { Schema } from "mongoose";
import { OrderDocument, OrderStatus } from "../types/order.types";

const orderItemSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    image: {
      type: String,
      required: [true, "Product image is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    product: {
      type: Schema.Types.ObjectId,
      required: [true, "Product reference is required"],
      ref: "Product",
    },
    variation: {
      size: String,
      color: String,
      material: String,
      style: String,
      sku: String,
    },
  },
  { _id: false }
);

const shippingAddressSchema = new Schema(
  {
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    postalCode: {
      type: String,
      required: [true, "Postal code is required"],
      trim: true,
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const paymentResultSchema = new Schema(
  {
    id: { type: String },
    status: { type: String },
    update_time: { type: String },
    email_address: { type: String },
    paymentMethod: { type: String },
    transactionFee: { type: Number },
  },
  { _id: false }
);

const discountSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: [0, "Discount value cannot be negative"],
    },
    description: { type: String },
  },
  { _id: false }
);

const statusHistorySchema = new Schema(
  {
    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
        "on-hold",
        "failed",
        "completed",
      ],
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    note: { type: String },
  },
  { _id: false }
);

const shippingInfoSchema = new Schema(
  {
    carrier: { type: String },
    trackingNumber: { type: String },
    estimatedDeliveryDate: { type: Date },
    shippedAt: { type: Date },
  },
  { _id: false }
);

const refundSchema = new Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: [0, "Refund amount cannot be negative"],
    },
    reason: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["pending", "processed", "rejected"],
      default: "pending",
    },
  },
  { _id: false }
);

const orderSchema = new Schema<OrderDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: [true, "User reference is required"],
      ref: "User",
      index: true,
    },
    orderNumber: {
      type: String,
      unique: true,
      uppercase: true,
      index: true,
      // Not required here because it's auto-generated in pre-save hook
      // Validation happens before pre-save, so we can't require it
    },
    orderItems: {
      type: [orderItemSchema],
      required: [true, "Order items are required"],
      validate: {
        validator: function (items: any[]) {
          return items && items.length > 0;
        },
        message: "Order must contain at least one item",
      },
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: [true, "Shipping address is required"],
    },
    paymentMethod: {
      type: String,
      required: [true, "Payment method is required"],
      trim: true,
    },
    paymentResult: paymentResultSchema,
    itemsPrice: {
      type: Number,
      required: true,
      default: 0.0,
      min: [0, "Items price cannot be negative"],
    },
    subtotal: {
      type: Number,
      required: true,
      default: 0.0,
      min: [0, "Subtotal cannot be negative"],
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0.0,
      min: [0, "Tax price cannot be negative"],
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0.0,
      min: [0, "Shipping price cannot be negative"],
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
      min: [0, "Total price cannot be negative"],
    },
    discount: discountSchema,
    discountAmount: {
      type: Number,
      default: 0.0,
      min: [0, "Discount amount cannot be negative"],
    },
    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
        "on-hold",
        "failed",
        "completed",
      ],
      default: "pending",
      required: true,
      index: true,
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Customer notes cannot exceed 500 characters"],
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: [1000, "Admin notes cannot exceed 1000 characters"],
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    isDelivered: {
      type: Boolean,
      required: true,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
    shipping: {
      type: shippingInfoSchema,
      default: {},
    },
    refund: refundSchema,
    invoiceUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for better query performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ user: 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ "orderItems.product": 1 });
orderSchema.index({ "shippingAddress.city": 1 });
orderSchema.index({ isPaid: 1, isDelivered: 1 });

// Generate unique order number before validation
orderSchema.pre("validate", function (next) {
  // Generate order number before validation runs
  if (this.isNew && !this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");

    // Use last 6 characters of _id for uniqueness
    const uniquePart = (this._id as mongoose.Types.ObjectId)
      .toString()
      .slice(-6)
      .toUpperCase();

    this.orderNumber = `ORD-${year}${month}${day}-${uniquePart}`;
  }

  next();
});

// Initialize status history before saving
orderSchema.pre("save", function (next) {
  // Initialize status history if new order
  if (this.isNew && (!this.statusHistory || this.statusHistory.length === 0)) {
    this.statusHistory = [
      {
        status: this.status as OrderStatus,
        date: new Date(),
        note: "Order created",
      },
    ];
  }

  next();
});

// Validate prices before saving
orderSchema.pre("save", function (next) {
  // Calculate expected itemsPrice from order items
  const calculatedItemsPrice = this.orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Validate itemsPrice matches sum of items (allow 0.02 tolerance for rounding)
  if (Math.abs(calculatedItemsPrice - this.itemsPrice) > 0.02) {
    return next(
      new Error(
        `Items price mismatch. Expected: ${calculatedItemsPrice.toFixed(
          2
        )}, Got: ${this.itemsPrice.toFixed(2)}`
      )
    );
  }

  // Validate subtotal calculation (itemsPrice - discount)
  const expectedSubtotal = this.itemsPrice - this.discountAmount;
  if (Math.abs(expectedSubtotal - this.subtotal) > 0.02) {
    return next(
      new Error(
        `Subtotal mismatch. Expected: ${expectedSubtotal.toFixed(
          2
        )}, Got: ${this.subtotal.toFixed(2)}`
      )
    );
  }

  // Validate total price calculation
  // Total = subtotal (already discounted) + tax + shipping
  const expectedTotal = this.subtotal + this.taxPrice + this.shippingPrice;

  if (Math.abs(expectedTotal - this.totalPrice) > 0.02) {
    return next(
      new Error(
        `Total price mismatch. Expected: ${expectedTotal.toFixed(
          2
        )}, Got: ${this.totalPrice.toFixed(2)} (Subtotal: ${
          this.subtotal
        }, Tax: ${this.taxPrice}, Shipping: ${this.shippingPrice})`
      )
    );
  }

  next();
});

// Prevent modification of completed/cancelled orders
orderSchema.pre("save", function (next) {
  if (!this.isNew) {
    const originalStatus = (this as any)._original?.status;

    if (originalStatus === "completed" && this.status !== "completed") {
      return next(new Error("Cannot modify a completed order"));
    }

    if (originalStatus === "cancelled" && this.status !== "cancelled") {
      return next(new Error("Cannot modify a cancelled order"));
    }
  }

  next();
});

// Store original document for comparison
orderSchema.post("init", function (doc) {
  (doc as any)._original = doc.toObject();
});

const Order = mongoose.model<OrderDocument>("Order", orderSchema);

export default Order;
