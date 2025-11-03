// Updated user.types.ts
import { Request } from "express";
import { Document } from "mongoose";

// Updated cart item interface to match model
export interface CartItem {
  product: string; // Product ID
  name: string; // Product name for quick access
  price: number; // Price when added to cart
  quantity: number;
  image: string; // Product image for quick access
  variation?: {
    // Added variation support to match model
    size?: string;
    color?: string;
    material?: string;
    style?: string;
    sku?: string;
  };
}

// Updated address interface to match model requirements
export interface Address {
  _id?: string; // Added to match model
  address: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean; // Made required to match model default
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
  _id: string;
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
  avatar: string; // User profile avatar
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;

  // Essential ecommerce fields
  cart: CartItem[]; // Shopping cart
  addresses: Address[]; // Shipping addresses
  favorites: FavoriteProduct[]; // Favorite/wishlist products
  orderHistory: OrderHistory[]; // Quick reference to user's orders
  phone?: string; // For delivery contact

  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
  createPasswordResetToken(): string;
  createEmailVerificationToken(): string;
}

export interface AuthRequest extends Request {
  user?: UserDocument;
}
