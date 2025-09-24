import mongoose, { Schema } from "mongoose";
import { OrderDocument, OrderStatus } from "../types/order.types";

// Updated to use consistent field naming (quantity instead of qty)
const orderItemSchema = new Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true }, // Changed from qty to quantity
  image: { type: String, required: true },
  price: { type: Number, required: true },
  product: {
    type: Schema.Types.ObjectId as any,
    required: true,
    ref: "Product",
  },
  variation: {
    // Changed from variant to variation for consistency
    size: String,
    color: String,
    material: String,
    style: String,
    sku: { type: String },
  },
});

const shippingAddressSchema = new Schema({
  address: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
  phoneNumber: { type: String },
});

const paymentResultSchema = new Schema({
  id: { type: String },
  status: { type: String },
  update_time: { type: String },
  email_address: { type: String },
  paymentMethod: { type: String },
  transactionFee: { type: Number },
});

const discountSchema = new Schema({
  code: { type: String, required: true },
  type: { type: String, enum: ["percentage", "fixed"], required: true },
  value: { type: Number, required: true },
  description: { type: String },
});

const statusHistorySchema = new Schema({
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
  date: { type: Date, default: Date.now },
  note: { type: String },
});

const shippingInfoSchema = new Schema({
  carrier: { type: String },
  trackingNumber: { type: String },
  estimatedDeliveryDate: { type: Date },
  shippedAt: { type: Date },
});

const refundSchema = new Schema({
  amount: { type: Number, required: true },
  reason: { type: String, required: true },
  date: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["pending", "processed", "rejected"],
    default: "pending",
  },
});

const orderSchema = new Schema<OrderDocument>(
  {
    user: {
      type: Schema.Types.ObjectId as any,
      required: true,
      ref: "User",
    },
    orderNumber: {
      type: String,
      required: true,
    },
    orderItems: [orderItemSchema],
    shippingAddress: shippingAddressSchema,
    paymentMethod: {
      type: String,
      required: true,
    },
    paymentResult: paymentResultSchema,
    itemsPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    subtotal: {
      type: Number,
      required: true,
      default: 0.0,
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    discount: discountSchema,
    discountAmount: {
      type: Number,
      default: 0.0,
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
    },
    statusHistory: [statusHistorySchema],
    notes: {
      type: String,
    },
    adminNotes: {
      type: String,
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
    shipping: shippingInfoSchema,
    refund: refundSchema,
    invoiceUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
orderSchema.index({ user: 1 });
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ "orderItems.product": 1 });

// Generate order number automatically before saving
orderSchema.pre("save", async function (next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    // Take the last 6 characters of the unique _id
    const uniquePart = (this._id as mongoose.Types.ObjectId)
      .toString()
      .slice(-6)
      .toUpperCase();

    this.orderNumber = `ORD-${year}${month}${day}-${uniquePart}`;

    // Initialize status history with current status
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

const Order = mongoose.model<OrderDocument>("Order", orderSchema);

export default Order;
