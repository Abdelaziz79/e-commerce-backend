import { Document } from "mongoose";

export interface OrderItem {
  name: string;
  quantity: number; // Changed from qty to quantity for consistency
  image: string;
  price: number;
  product: string;
  variation?: {
    // Changed from variant to variation for consistency
    size?: string;
    color?: string;
    material?: string;
    style?: string;
    sku?: string; // Made optional to match validation
  };
}

export interface ShippingAddress {
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phoneNumber?: string;
}

export interface PaymentResult {
  id: string;
  status: string;
  update_time: string;
  email_address: string;
  paymentMethod?: string;
  transactionFee?: number;
}

export interface Discount {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  description?: string;
}

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded"
  | "on-hold"
  | "failed"
  | "completed";

export interface StatusHistory {
  status: OrderStatus;
  date: Date;
  note?: string;
}

export interface ShippingInfo {
  carrier?: string;
  trackingNumber?: string;
  estimatedDeliveryDate?: Date;
  shippedAt?: Date;
}

export interface Refund {
  amount: number;
  reason: string;
  date: Date;
  status: "pending" | "processed" | "rejected";
}

export interface OrderDocument extends Document {
  user: string;
  orderItems: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  paymentResult?: PaymentResult;
  itemsPrice: number;
  taxPrice: number;
  shippingPrice: number;
  totalPrice: number;
  subtotal: number; // Before tax and shipping
  discount?: Discount;
  discountAmount: number;
  orderNumber: string; // Human-readable order ID
  status: OrderStatus;
  statusHistory: StatusHistory[];
  notes?: string; // Customer order notes
  adminNotes?: string; // Internal notes
  isPaid: boolean;
  paidAt?: Date;
  isDelivered: boolean;
  deliveredAt?: Date;
  shipping: ShippingInfo;
  refund?: Refund;
  invoiceUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
