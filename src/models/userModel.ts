// Updated user.model.ts
import bcrypt from "bcryptjs";
import crypto from "crypto";
import mongoose, { Schema } from "mongoose";
import { UserDocument } from "../types/user.types";

// Cart item schema - Updated for consistency
const cartItemSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    image: {
      type: String,
      required: true,
      validate: {
        validator: function (img: string) {
          if (img.startsWith("http") || img.startsWith("https")) {
            return /^https?:\/\/.*\.(jpg|jpeg|png|gif|webp)$/i.test(img);
          }
          return /^\/.*\.(jpg|jpeg|png|gif|webp)$/i.test(img);
        },
        message: "Image must be a valid URL or relative path",
      },
    },
    variation: {
      // Updated to match order model naming
      size: String,
      color: String,
      material: String,
      style: String,
      sku: String,
    },
  },
  { _id: false }
); // Don't create _id for subdocuments

// Address schema
const addressSchema = new Schema(
  {
    address: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    postalCode: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
); // Keep _id for addresses so they can be referenced

// Favorite product schema
const favoriteProductSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// Order history schema
const orderHistorySchema = new Schema(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      required: true,
    },
  },
  { _id: false }
);

const userSchema = new Schema<UserDocument>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please enter a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    avatar: {
      type: String,
      default: "/uploads/avatars/default-avatar.png",
      validate: {
        validator: function (img: string) {
          if (img.startsWith("http") || img.startsWith("https")) {
            return /^https?:\/\/.*\.(jpg|jpeg|png|gif|webp)$/i.test(img);
          }
          return /^\/.*\.(jpg|jpeg|png|gif|webp)$/i.test(img);
        },
        message: "Avatar must be a valid URL or relative path",
      },
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,

    // Essential ecommerce fields
    cart: [cartItemSchema],
    addresses: [addressSchema],
    favorites: [favoriteProductSchema],
    orderHistory: [orderHistorySchema],
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s-()]{10,20}$/, "Please enter a valid phone number"],
    },
  },
  {
    timestamps: true,
  }
);

// Index for cart product lookups
userSchema.index({ "cart.product": 1 });
userSchema.index({ "favorites.product": 1 });
userSchema.index({ "orderHistory.order": 1 });

// Hash the password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Create password reset token
userSchema.methods.createPasswordResetToken = function (): string {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Token expires in 10 minutes
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);

  return resetToken;
};

// Create email verification token
userSchema.methods.createEmailVerificationToken = function (): string {
  const verificationToken = crypto.randomBytes(32).toString("hex");

  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  // Token expires in 24 hours
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  return verificationToken;
};

const User = mongoose.model<UserDocument>("User", userSchema);

export default User;
