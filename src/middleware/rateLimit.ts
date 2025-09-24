import { Request, Response } from "express";
import rateLimit from "express-rate-limit";

// Rate limiting configuration types
interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  skipFunction?: (req: Request) => boolean;
}

// Predefined rate limit configurations
const RATE_LIMIT_CONFIGS = {
  // Authentication related
  AUTH_LOGIN: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: "Too many login attempts, please try again after 15 minutes",
  },
  AUTH_REGISTER: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 registrations per hour
    message: "Too many registration attempts, please try again later",
  },
  AUTH_FORGOT_PASSWORD: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour
    message: "Too many password reset requests, please try again later",
  },
  AUTH_RESET_PASSWORD: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour
    message: "Too many password reset attempts, please try again later",
  },

  // User operations
  PROFILE_UPDATE: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 profile updates per window
    message: "Too many profile updates, please try again later",
  },
  PASSWORD_CHANGE: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Very restrictive for password changes
    message: "Too many password change attempts, please try again later",
  },

  // E-commerce operations
  CART_OPERATIONS: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 cart operations per window
    message: "Too many cart operations, please try again later",
  },
  FAVORITES_OPERATIONS: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 favorites operations per window
    message: "Too many favorites operations, please try again later",
  },
  ORDER_CREATION: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 orders per window
    message: "Too many orders created, please try again after 15 minutes",
  },
  ORDER_PAYMENT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 payment updates per window
    message: "Too many payment attempts, please try again later",
  },
  ORDER_CANCEL: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 cancellations per window
    message: "Too many order cancellations, please try again later",
  },
  ADMIN_ORDER_OPERATIONS: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 admin operations per window
    message: "Too many admin order operations, please try again later",
  },

  // Product operations
  PRODUCT_REVIEW: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 reviews per hour
    message: "Too many review submissions, please try again later",
  },
  PRODUCT_CREATE: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 products per hour (for admins)
    message: "Too many product creations, please try again later",
  },

  // General API
  GENERAL_API: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per window
    message: "Too many requests, please try again later",
  },
  STRICT_API: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: "Rate limit exceeded, please try again later",
  },
} as const;

/**
 * Creates a rate limiter with the specified configuration
 */
function createRateLimit(config: RateLimitConfig) {
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    message: {
      status: "error",
      message: config.message,
      retryAfter: Math.ceil(config.windowMs / 1000), // in seconds
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: config.skipSuccessfulRequests || false,
    skipFailedRequests: config.skipFailedRequests || false,
    skip: config.skipFunction || (() => false),
  });
}

/**
 * Creates a rate limiter that skips admin users
 */
function createRateLimitWithAdminSkip(config: RateLimitConfig) {
  return createRateLimit({
    ...config,
    skipFunction: (req: Request) => {
      // Skip rate limiting for admin users
      return (req as any).user?.role === "admin";
    },
  });
}

/**
 * Creates a rate limiter based on user authentication status
 */
function createAuthBasedRateLimit(
  authenticatedConfig: RateLimitConfig,
  unauthenticatedConfig: RateLimitConfig
) {
  return (req: Request, res: Response, next: any) => {
    const isAuthenticated = !!(req as any).user;
    const config = isAuthenticated
      ? authenticatedConfig
      : unauthenticatedConfig;
    return createRateLimit(config)(req, res, next);
  };
}

// Export predefined rate limiters
export const authRateLimiters = {
  login: createRateLimit(RATE_LIMIT_CONFIGS.AUTH_LOGIN),
  register: createRateLimit(RATE_LIMIT_CONFIGS.AUTH_REGISTER),
  forgotPassword: createRateLimit(RATE_LIMIT_CONFIGS.AUTH_FORGOT_PASSWORD),
  resetPassword: createRateLimit(RATE_LIMIT_CONFIGS.AUTH_RESET_PASSWORD),
};

export const userRateLimiters = {
  profileUpdate: createRateLimit(RATE_LIMIT_CONFIGS.PROFILE_UPDATE),
  passwordChange: createRateLimit(RATE_LIMIT_CONFIGS.PASSWORD_CHANGE),
};

export const ecommerceRateLimiters = {
  cart: createRateLimit(RATE_LIMIT_CONFIGS.CART_OPERATIONS),
  favorites: createRateLimit(RATE_LIMIT_CONFIGS.FAVORITES_OPERATIONS),
  orderCreation: createRateLimitWithAdminSkip(
    RATE_LIMIT_CONFIGS.ORDER_CREATION
  ),
};

export const orderRateLimiters = {
  creation: createRateLimitWithAdminSkip(RATE_LIMIT_CONFIGS.ORDER_CREATION),
  payment: createRateLimit(RATE_LIMIT_CONFIGS.ORDER_PAYMENT),
  cancel: createRateLimit(RATE_LIMIT_CONFIGS.ORDER_CANCEL),
  adminOperations: createRateLimitWithAdminSkip(
    RATE_LIMIT_CONFIGS.ADMIN_ORDER_OPERATIONS
  ),
};

export const productRateLimiters = {
  review: createRateLimit(RATE_LIMIT_CONFIGS.PRODUCT_REVIEW),
  create: createRateLimitWithAdminSkip(RATE_LIMIT_CONFIGS.PRODUCT_CREATE),
};

export const generalRateLimiters = {
  api: createRateLimit(RATE_LIMIT_CONFIGS.GENERAL_API),
  strict: createRateLimit(RATE_LIMIT_CONFIGS.STRICT_API),
};

// Backward compatibility - keeping your existing exports
export const cartRateLimit = ecommerceRateLimiters.cart;
export const favoritesRateLimit = ecommerceRateLimiters.favorites;
export const profileRateLimit = userRateLimiters.profileUpdate;
export const passwordRateLimit = userRateLimiters.passwordChange;
export const orderRateLimit = ecommerceRateLimiters.orderCreation;

// Utility functions for custom rate limiting
export {
  createAuthBasedRateLimit,
  createRateLimit,
  createRateLimitWithAdminSkip,
};
export type { RateLimitConfig };
