// src/models/adminSettingsModel.ts
import mongoose, { Schema } from "mongoose";
import { AdminSettingsDocument } from "../types/adminSettings.types";

const shippingRateSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ["flat", "weight-based", "price-based"],
      default: "flat",
    },
    flatRate: {
      type: Number,
      min: 0,
      default: 0,
    },
    freeShippingThreshold: {
      type: Number,
      min: 0,
    },
    weightRanges: [
      {
        minWeight: { type: Number, min: 0 },
        maxWeight: { type: Number, min: 0 },
        rate: { type: Number, min: 0, required: true },
      },
    ],
    priceRanges: [
      {
        minPrice: { type: Number, min: 0 },
        maxPrice: { type: Number, min: 0 },
        rate: { type: Number, min: 0, required: true },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

const discountCodeSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    maxDiscountAmount: {
      type: Number,
      min: 0,
    },
    usageLimit: {
      type: Number,
      min: 0,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    perUserLimit: {
      type: Number,
      min: 0,
    },
    validFrom: {
      type: Date,
      required: true,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    applicableCategories: [
      {
        type: Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    applicableProducts: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    excludedCategories: [
      {
        type: Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    excludedProducts: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    usedBy: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        usedCount: {
          type: Number,
          default: 1,
        },
        lastUsed: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { _id: true, timestamps: true }
);

const taxRateSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    description: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    postalCodes: [String],
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    priority: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

const adminSettingsSchema = new Schema<AdminSettingsDocument>(
  {
    // Tax settings
    taxRates: [taxRateSchema],
    taxEnabled: {
      type: Boolean,
      default: true,
    },
    pricesIncludeTax: {
      type: Boolean,
      default: false,
    },

    // Shipping settings
    shippingRates: [shippingRateSchema],
    shippingEnabled: {
      type: Boolean,
      default: true,
    },
    freeShippingEnabled: {
      type: Boolean,
      default: false,
    },
    freeShippingThreshold: {
      type: Number,
      min: 0,
      default: 0,
    },

    // Discount codes
    discountCodes: [discountCodeSchema],

    // General settings
    storeName: {
      type: String,
      default: "My Store",
      trim: true,
    },
    storeEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    storeCurrency: {
      type: String,
      default: "USD",
      uppercase: true,
    },
    storeTimezone: {
      type: String,
      default: "UTC",
    },

    // Order settings
    orderPrefix: {
      type: String,
      default: "ORD",
      uppercase: true,
    },
    minimumOrderAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    maximumOrderAmount: {
      type: Number,
      min: 0,
    },
    allowGuestCheckout: {
      type: Boolean,
      default: false,
    },

    // Notification settings
    orderNotificationEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    sendOrderConfirmation: {
      type: Boolean,
      default: true,
    },
    sendShippingNotification: {
      type: Boolean,
      default: true,
    },

    // Maintenance mode
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    maintenanceMessage: {
      type: String,
      default: "We're currently performing scheduled maintenance.",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
discountCodeSchema.index({ code: 1 }, { unique: true }); // Made unique here instead
discountCodeSchema.index({ validFrom: 1, validUntil: 1 });
taxRateSchema.index({ country: 1, state: 1, city: 1 });
shippingRateSchema.index({ isActive: 1 });

// Ensure only one settings document exists
adminSettingsSchema.pre("save", async function (next) {
  const count = await mongoose.models.AdminSettings.countDocuments();
  if (count > 0 && this.isNew) {
    throw new Error("Admin settings already exist. Use update instead.");
  }
  next();
});

// Validate discount code dates
discountCodeSchema.pre("save", function (next) {
  if (this.validFrom >= this.validUntil) {
    return next(new Error("Valid from date must be before valid until date"));
  }
  next();
});

// Validate percentage discounts
discountCodeSchema.pre("save", function (next) {
  if (this.type === "percentage" && this.value > 100) {
    return next(new Error("Percentage discount cannot exceed 100%"));
  }
  next();
});

const AdminSettings = mongoose.model<AdminSettingsDocument>(
  "AdminSettings",
  adminSettingsSchema
);

export default AdminSettings;
