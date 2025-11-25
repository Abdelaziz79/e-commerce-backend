// src/types/adminSettings.types.ts
import { Document, Types } from "mongoose";

export interface ShippingRate {
  _id?: Types.ObjectId;
  name: string;
  description?: string;
  type: "flat" | "weight-based" | "price-based";
  flatRate?: number;
  freeShippingThreshold?: number;
  weightRanges?: {
    minWeight: number;
    maxWeight: number;
    rate: number;
  }[];
  priceRanges?: {
    minPrice: number;
    maxPrice: number;
    rate: number;
  }[];
  isActive: boolean;
}

export interface DiscountCodeUsage {
  user: Types.ObjectId;
  usedCount: number;
  lastUsed: Date;
}

export interface DiscountCode {
  _id?: Types.ObjectId;
  code: string;
  description?: string;
  type: "percentage" | "fixed";
  value: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageCount: number;
  perUserLimit?: number;
  validFrom: Date;
  validUntil: Date;
  applicableCategories?: Types.ObjectId[];
  applicableProducts?: Types.ObjectId[];
  excludedCategories?: Types.ObjectId[];
  excludedProducts?: Types.ObjectId[];
  isActive: boolean;
  usedBy: DiscountCodeUsage[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TaxRate {
  _id?: Types.ObjectId;
  name: string;
  rate: number;
  description?: string;
  country?: string;
  state?: string;
  city?: string;
  postalCodes?: string[];
  isDefault: boolean;
  isActive: boolean;
  priority: number;
}

export interface AdminSettingsDocument extends Document {
  // Tax settings
  taxRates: TaxRate[];
  taxEnabled: boolean;
  pricesIncludeTax: boolean;

  // Shipping settings
  shippingRates: ShippingRate[];
  shippingEnabled: boolean;
  freeShippingEnabled: boolean;
  freeShippingThreshold: number;

  // Discount codes
  discountCodes: DiscountCode[];

  // General settings
  storeName: string;
  storeEmail?: string;
  storeCurrency: string;
  storeTimezone: string;

  // Order settings
  orderPrefix: string;
  minimumOrderAmount: number;
  maximumOrderAmount?: number;
  allowGuestCheckout: boolean;

  // Notification settings
  orderNotificationEmail?: string;
  sendOrderConfirmation: boolean;
  sendShippingNotification: boolean;

  // Maintenance mode
  maintenanceMode: boolean;
  maintenanceMessage: string;

  createdAt: Date;
  updatedAt: Date;
}
