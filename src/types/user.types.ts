// src/types/user.types.ts - Updated with status fields
import { Request } from "express";
import { Document, Types } from "mongoose";

// Cart item interface
export interface CartItem {
  product: string; // Product ID
  name: string; // Product name for quick access
  price: number; // Price when added to cart
  quantity: number;
  image: string; // Product image for quick access
  variation?: {
    size?: string;
    color?: string;
    material?: string;
    style?: string;
    sku?: string;
  };
}

// Address interface
export interface Address {
  _id?: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  phoneNumber?: string;
}

// Favorite product interface
export interface FavoriteProduct {
  product: string; // Product ID
  addedAt: Date;
}

// Order history reference interface
export interface OrderHistory {
  order: string; // Order ID reference
  totalPrice: number;
  status: string;
  createdAt: Date;
}

export interface UserDocument extends Document {
  _id: Types.ObjectId | string;
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";

  // NEW: Status fields
  status: "active" | "banned" | "suspended";
  banReason?: string;
  bannedAt?: Date;
  bannedBy?: Types.ObjectId;

  avatar: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;

  // Essential ecommerce fields
  cart: CartItem[];
  addresses: Address[];
  favorites: FavoriteProduct[];
  orderHistory: OrderHistory[];
  phone?: string;

  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
  createPasswordResetToken(): string;
  createEmailVerificationToken(): string;
}

export interface AuthRequest extends Request {
  user?: UserDocument;
}
