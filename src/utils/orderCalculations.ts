// src/utils/orderCalculations.ts
import AdminSettings from "../models/adminSettingsModel";
import {
  DiscountCode,
  ShippingRate,
  TaxRate,
} from "../types/adminSettings.types";

interface CalculationResult {
  itemsPrice: number;
  subtotal: number;
  taxPrice: number;
  shippingPrice: number;
  discountAmount: number;
  totalPrice: number;
  taxDetails?: {
    rate: number;
    rateName: string;
    taxableAmount: number;
  };
  shippingDetails?: {
    rateName: string;
    type: string;
    originalRate?: number;
    isFree: boolean;
  };
  discountDetails?: {
    code: string;
    type: string;
    value: number;
    description?: string;
  };
  error?: string;
}

interface ShippingAddressInput {
  country: string;
  state?: string;
  city?: string;
  postalCode?: string;
}

/**
 * Calculate tax based on admin settings and shipping address
 */
async function calculateTax(
  subtotal: number,
  shippingAddress: ShippingAddressInput
): Promise<{
  taxPrice: number;
  taxDetails?: { rate: number; rateName: string; taxableAmount: number };
}> {
  const settings = await AdminSettings.findOne();

  if (!settings || !settings.taxEnabled) {
    return { taxPrice: 0 };
  }

  // Find applicable tax rate based on location
  let applicableTaxRate: TaxRate | null = null;
  let highestPriority = -1;

  for (const taxRate of settings.taxRates) {
    if (!taxRate.isActive) continue;

    let matches = true;

    // Check country match
    if (taxRate.country && taxRate.country !== shippingAddress.country) {
      matches = false;
    }

    // Check state match
    if (
      matches &&
      taxRate.state &&
      shippingAddress.state &&
      taxRate.state !== shippingAddress.state
    ) {
      matches = false;
    }

    // Check city match
    if (
      matches &&
      taxRate.city &&
      shippingAddress.city &&
      taxRate.city !== shippingAddress.city
    ) {
      matches = false;
    }

    // Check postal code match
    if (
      matches &&
      taxRate.postalCodes &&
      taxRate.postalCodes.length > 0 &&
      shippingAddress.postalCode
    ) {
      if (!taxRate.postalCodes.includes(shippingAddress.postalCode)) {
        matches = false;
      }
    }

    // If matches and has higher priority, use this tax rate
    if (matches && taxRate.priority > highestPriority) {
      applicableTaxRate = taxRate;
      highestPriority = taxRate.priority;
    }
  }

  // If no specific rate found, use default rate
  if (!applicableTaxRate) {
    applicableTaxRate =
      settings.taxRates.find((rate) => rate.isDefault && rate.isActive) || null;
  }

  if (!applicableTaxRate) {
    return { taxPrice: 0 };
  }

  const taxPrice = (subtotal * applicableTaxRate.rate) / 100;

  return {
    taxPrice: parseFloat(taxPrice.toFixed(2)),
    taxDetails: {
      rate: applicableTaxRate.rate,
      rateName: applicableTaxRate.name,
      taxableAmount: subtotal,
    },
  };
}

/**
 * Calculate shipping based on admin settings
 */
async function calculateShipping(
  subtotal: number,
  weight: number,
  shippingAddress: ShippingAddressInput
): Promise<{
  shippingPrice: number;
  shippingDetails?: {
    rateName: string;
    type: string;
    originalRate?: number;
    isFree: boolean;
  };
}> {
  const settings = await AdminSettings.findOne();

  if (!settings || !settings.shippingEnabled) {
    return { shippingPrice: 0 };
  }

  // Check for free shipping
  if (
    settings.freeShippingEnabled &&
    settings.freeShippingThreshold > 0 &&
    subtotal >= settings.freeShippingThreshold
  ) {
    return {
      shippingPrice: 0,
      shippingDetails: {
        rateName: "Free Shipping",
        type: "free",
        isFree: true,
      },
    };
  }

  // Find active shipping rates
  const activeRates = settings.shippingRates.filter((rate) => rate.isActive);

  if (activeRates.length === 0) {
    return { shippingPrice: 0 };
  }

  // Use first active rate for calculation
  const shippingRate = activeRates[0];
  let calculatedRate = 0;
  let isFree = false;

  switch (shippingRate.type) {
    case "flat":
      calculatedRate = shippingRate.flatRate || 0;

      // Check rate-specific free shipping threshold
      if (
        shippingRate.freeShippingThreshold &&
        subtotal >= shippingRate.freeShippingThreshold
      ) {
        calculatedRate = 0;
        isFree = true;
      }
      break;

    case "weight-based":
      if (shippingRate.weightRanges && shippingRate.weightRanges.length > 0) {
        const weightRange = shippingRate.weightRanges.find(
          (range) => weight >= range.minWeight && weight <= range.maxWeight
        );
        calculatedRate = weightRange ? weightRange.rate : 0;
      }
      break;

    case "price-based":
      if (shippingRate.priceRanges && shippingRate.priceRanges.length > 0) {
        const priceRange = shippingRate.priceRanges.find(
          (range) => subtotal >= range.minPrice && subtotal <= range.maxPrice
        );
        calculatedRate = priceRange ? priceRange.rate : 0;
      }
      break;

    default:
      calculatedRate = 0;
  }

  return {
    shippingPrice: parseFloat(calculatedRate.toFixed(2)),
    shippingDetails: {
      rateName: shippingRate.name,
      type: shippingRate.type,
      originalRate: calculatedRate,
      isFree,
    },
  };
}

/**
 * Apply and validate discount code
 */
async function applyDiscount(
  subtotal: number,
  discountCode: string,
  productIds: string[],
  categoryIds: string[],
  userId?: string
): Promise<{
  discountAmount: number;
  discountDetails?: {
    code: string;
    type: string;
    value: number;
    description?: string;
  };
  error?: string;
}> {
  if (!discountCode) {
    return { discountAmount: 0 };
  }

  const settings = await AdminSettings.findOne();

  if (!settings) {
    return { discountAmount: 0, error: "Settings not found" };
  }

  const discount = settings.discountCodes.find(
    (dc: DiscountCode) => dc.code === discountCode.toUpperCase() && dc.isActive
  );

  if (!discount) {
    return { discountAmount: 0, error: "Invalid or inactive discount code" };
  }

  const now = new Date();

  // Check validity period
  if (now < discount.validFrom || now > discount.validUntil) {
    return {
      discountAmount: 0,
      error: "Discount code has expired or not yet valid",
    };
  }

  // Check minimum order amount
  if (subtotal < discount.minOrderAmount) {
    return {
      discountAmount: 0,
      error: `Minimum order amount of ${discount.minOrderAmount} required`,
    };
  }

  // Check usage limit
  if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
    return { discountAmount: 0, error: "Discount code usage limit reached" };
  }

  // Check per-user limit
  if (discount.perUserLimit && userId) {
    const userUsage = discount.usedBy.find(
      (u) => u.user.toString() === userId.toString()
    );

    if (userUsage && userUsage.usedCount >= discount.perUserLimit) {
      return {
        discountAmount: 0,
        error: "You have reached the usage limit for this code",
      };
    }
  }

  // Check product restrictions
  if (discount.applicableProducts && discount.applicableProducts.length > 0) {
    const hasApplicableProduct = productIds.some((pid) =>
      discount.applicableProducts!.some((ap) => ap.toString() === pid)
    );

    if (!hasApplicableProduct) {
      return {
        discountAmount: 0,
        error: "Discount code not applicable to cart products",
      };
    }
  }

  // Check category restrictions
  if (
    discount.applicableCategories &&
    discount.applicableCategories.length > 0
  ) {
    const hasApplicableCategory = categoryIds.some((cid) =>
      discount.applicableCategories!.some((ac) => ac.toString() === cid)
    );

    if (!hasApplicableCategory) {
      return {
        discountAmount: 0,
        error: "Discount code not applicable to cart categories",
      };
    }
  }

  // Check excluded products
  if (discount.excludedProducts && discount.excludedProducts.length > 0) {
    const hasExcludedProduct = productIds.some((pid) =>
      discount.excludedProducts!.some((ep) => ep.toString() === pid)
    );

    if (hasExcludedProduct) {
      return {
        discountAmount: 0,
        error: "Cart contains products excluded from this discount",
      };
    }
  }

  // Check excluded categories
  if (discount.excludedCategories && discount.excludedCategories.length > 0) {
    const hasExcludedCategory = categoryIds.some((cid) =>
      discount.excludedCategories!.some((ec) => ec.toString() === cid)
    );

    if (hasExcludedCategory) {
      return {
        discountAmount: 0,
        error: "Cart contains categories excluded from this discount",
      };
    }
  }

  // Calculate discount amount
  let discountAmount = 0;

  if (discount.type === "percentage") {
    discountAmount = (subtotal * discount.value) / 100;
  } else {
    discountAmount = discount.value;
  }

  // Apply max discount limit
  if (
    discount.maxDiscountAmount &&
    discountAmount > discount.maxDiscountAmount
  ) {
    discountAmount = discount.maxDiscountAmount;
  }

  // Ensure discount doesn't exceed subtotal
  if (discountAmount > subtotal) {
    discountAmount = subtotal;
  }

  return {
    discountAmount: parseFloat(discountAmount.toFixed(2)),
    discountDetails: {
      code: discount.code,
      type: discount.type,
      value: discount.value,
      description: discount.description,
    },
  };
}

/**
 * Main function to calculate all order totals
 */
export async function calculateOrderTotals(
  itemsPrice: number,
  shippingAddress: ShippingAddressInput,
  weight: number = 0,
  discountCode?: string,
  productIds: string[] = [],
  categoryIds: string[] = [],
  userId?: string
): Promise<CalculationResult> {
  try {
    // Apply discount first (to itemsPrice)
    const {
      discountAmount,
      discountDetails,
      error: discountError,
    } = await applyDiscount(
      itemsPrice,
      discountCode || "",
      productIds,
      categoryIds,
      userId
    );

    // Calculate subtotal after discount
    const subtotal = itemsPrice - discountAmount;

    // Calculate shipping based on subtotal after discount
    const { shippingPrice, shippingDetails } = await calculateShipping(
      subtotal,
      weight,
      shippingAddress
    );

    // Calculate tax on subtotal (not including shipping)
    const { taxPrice, taxDetails } = await calculateTax(
      subtotal,
      shippingAddress
    );

    // Calculate final total
    const totalPrice = subtotal + shippingPrice + taxPrice;

    return {
      itemsPrice: parseFloat(itemsPrice.toFixed(2)),
      subtotal: parseFloat(subtotal.toFixed(2)),
      taxPrice: parseFloat(taxPrice.toFixed(2)),
      shippingPrice: parseFloat(shippingPrice.toFixed(2)),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      totalPrice: parseFloat(totalPrice.toFixed(2)),
      taxDetails,
      shippingDetails,
      discountDetails,
      error: discountError,
    };
  } catch (error: any) {
    console.error("Error calculating order totals:", error);
    return {
      itemsPrice: parseFloat(itemsPrice.toFixed(2)),
      subtotal: parseFloat(itemsPrice.toFixed(2)),
      taxPrice: 0,
      shippingPrice: 0,
      discountAmount: 0,
      totalPrice: parseFloat(itemsPrice.toFixed(2)),
      error: "Failed to calculate totals",
    };
  }
}

/**
 * Record discount code usage after successful order
 */
export async function recordDiscountUsage(
  discountCode: string,
  userId: string
): Promise<void> {
  try {
    const settings = await AdminSettings.findOne();
    if (!settings) return;

    const discountIndex = settings.discountCodes.findIndex(
      (dc: DiscountCode) => dc.code === discountCode.toUpperCase()
    );

    if (discountIndex === -1) return;

    const discount = settings.discountCodes[discountIndex];

    // Increment total usage count
    discount.usageCount += 1;

    // Update or add user usage
    const userUsageIndex = discount.usedBy.findIndex(
      (u) => u.user.toString() === userId.toString()
    );

    if (userUsageIndex !== -1) {
      discount.usedBy[userUsageIndex].usedCount += 1;
      discount.usedBy[userUsageIndex].lastUsed = new Date();
    } else {
      discount.usedBy.push({
        user: userId as any,
        usedCount: 1,
        lastUsed: new Date(),
      });
    }

    await settings.save();
  } catch (error) {
    console.error("Error recording discount usage:", error);
  }
}
