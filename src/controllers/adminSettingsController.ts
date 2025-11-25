// src/controllers/adminSettingsController.ts
import { Response } from "express";
import AdminSettings from "../models/adminSettingsModel";
import { AuthRequest } from "../types/user.types";
import catchAsync from "../utils/catchAsync";
import mongoose from "mongoose";

/**
 * @desc    Get admin settings
 * @route   GET /api/admin/settings
 * @access  Private/Admin
 */
export const getSettings = catchAsync(
  async (req: AuthRequest, res: Response) => {
    let settings = await AdminSettings.findOne()
      .populate("discountCodes.applicableCategories", "name slug")
      .populate("discountCodes.applicableProducts", "name slug")
      .populate("discountCodes.excludedCategories", "name slug")
      .populate("discountCodes.excludedProducts", "name slug");

    // Create default settings if none exist
    if (!settings) {
      settings = await AdminSettings.create({
        taxRates: [],
        discountCodes: [],
        shippingRates: [],
      });
    }

    res.status(200).json({
      status: "success",
      data: settings,
    });
  }
);

/**
 * @desc    Update general settings
 * @route   PUT /api/admin/settings/general
 * @access  Private/Admin
 */
export const updateGeneralSettings = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const settings = await AdminSettings.findOne();

    if (!settings) {
      return res.status(404).json({
        status: "error",
        message: "Settings not found",
      });
    }

    const allowedFields = [
      "storeName",
      "storeEmail",
      "storeCurrency",
      "storeTimezone",
      "orderPrefix",
      "minimumOrderAmount",
      "maximumOrderAmount",
      "allowGuestCheckout",
      "orderNotificationEmail",
      "sendOrderConfirmation",
      "sendShippingNotification",
      "maintenanceMode",
      "maintenanceMessage",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        (settings as any)[field] = req.body[field];
      }
    });

    await settings.save();

    res.status(200).json({
      status: "success",
      message: "General settings updated successfully",
      data: settings,
    });
  }
);

// ============================================================================
// TAX RATE MANAGEMENT
// ============================================================================

/**
 * @desc    Add tax rate
 * @route   POST /api/admin/settings/tax
 * @access  Private/Admin
 */
export const addTaxRate = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const settings = await AdminSettings.findOne();

    if (!settings) {
      return res.status(404).json({
        status: "error",
        message: "Settings not found",
      });
    }

    const { isDefault } = req.body;

    // If this is default, unset other defaults
    if (isDefault) {
      settings.taxRates.forEach((rate: any) => {
        rate.isDefault = false;
      });
    }

    settings.taxRates.push(req.body);
    await settings.save();

    res.status(201).json({
      status: "success",
      message: "Tax rate added successfully",
      data: settings.taxRates[settings.taxRates.length - 1],
    });
  }
);

/**
 * @desc    Update tax rate
 * @route   PUT /api/admin/settings/tax/:id
 * @access  Private/Admin
 */
export const updateTaxRate = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const settings = await AdminSettings.findOne();

    if (!settings) {
      return res.status(404).json({
        status: "error",
        message: "Settings not found",
      });
    }

    // Find tax rate by _id using find() method
    const taxRateIndex = settings.taxRates.findIndex(
      (rate: any) => rate._id.toString() === req.params.id
    );

    if (taxRateIndex === -1) {
      return res.status(404).json({
        status: "error",
        message: "Tax rate not found",
      });
    }

    const { isDefault } = req.body;

    // If setting as default, unset other defaults
    if (isDefault) {
      settings.taxRates.forEach((rate: any) => {
        if (rate._id.toString() !== req.params.id) {
          rate.isDefault = false;
        }
      });
    }

    // Update the tax rate
    Object.assign(settings.taxRates[taxRateIndex], req.body);
    await settings.save();

    res.status(200).json({
      status: "success",
      message: "Tax rate updated successfully",
      data: settings.taxRates[taxRateIndex],
    });
  }
);

/**
 * @desc    Delete tax rate
 * @route   DELETE /api/admin/settings/tax/:id
 * @access  Private/Admin
 */
export const deleteTaxRate = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const settings = await AdminSettings.findOne();

    if (!settings) {
      return res.status(404).json({
        status: "error",
        message: "Settings not found",
      });
    }

    // Find and remove tax rate
    const taxRateIndex = settings.taxRates.findIndex(
      (rate: any) => rate._id.toString() === req.params.id
    );

    if (taxRateIndex === -1) {
      return res.status(404).json({
        status: "error",
        message: "Tax rate not found",
      });
    }

    settings.taxRates.splice(taxRateIndex, 1);
    await settings.save();

    res.status(200).json({
      status: "success",
      message: "Tax rate deleted successfully",
    });
  }
);

/**
 * @desc    Toggle tax enabled
 * @route   PUT /api/admin/settings/tax/toggle
 * @access  Private/Admin
 */
export const toggleTaxEnabled = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const settings = await AdminSettings.findOne();

    if (!settings) {
      return res.status(404).json({
        status: "error",
        message: "Settings not found",
      });
    }

    settings.taxEnabled = !settings.taxEnabled;
    await settings.save();

    res.status(200).json({
      status: "success",
      message: `Tax ${
        settings.taxEnabled ? "enabled" : "disabled"
      } successfully`,
      data: { taxEnabled: settings.taxEnabled },
    });
  }
);

// ============================================================================
// SHIPPING RATE MANAGEMENT
// ============================================================================

/**
 * @desc    Add shipping rate
 * @route   POST /api/admin/settings/shipping
 * @access  Private/Admin
 */
export const addShippingRate = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const settings = await AdminSettings.findOne();

    if (!settings) {
      return res.status(404).json({
        status: "error",
        message: "Settings not found",
      });
    }

    settings.shippingRates.push(req.body);
    await settings.save();

    res.status(201).json({
      status: "success",
      message: "Shipping rate added successfully",
      data: settings.shippingRates[settings.shippingRates.length - 1],
    });
  }
);

/**
 * @desc    Update shipping rate
 * @route   PUT /api/admin/settings/shipping/:id
 * @access  Private/Admin
 */
export const updateShippingRate = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const settings = await AdminSettings.findOne();

    if (!settings) {
      return res.status(404).json({
        status: "error",
        message: "Settings not found",
      });
    }

    // Find shipping rate by _id
    const shippingRateIndex = settings.shippingRates.findIndex(
      (rate: any) => rate._id.toString() === req.params.id
    );

    if (shippingRateIndex === -1) {
      return res.status(404).json({
        status: "error",
        message: "Shipping rate not found",
      });
    }

    // Update the shipping rate
    Object.assign(settings.shippingRates[shippingRateIndex], req.body);
    await settings.save();

    res.status(200).json({
      status: "success",
      message: "Shipping rate updated successfully",
      data: settings.shippingRates[shippingRateIndex],
    });
  }
);

/**
 * @desc    Delete shipping rate
 * @route   DELETE /api/admin/settings/shipping/:id
 * @access  Private/Admin
 */
export const deleteShippingRate = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const settings = await AdminSettings.findOne();

    if (!settings) {
      return res.status(404).json({
        status: "error",
        message: "Settings not found",
      });
    }

    // Find and remove shipping rate
    const shippingRateIndex = settings.shippingRates.findIndex(
      (rate: any) => rate._id.toString() === req.params.id
    );

    if (shippingRateIndex === -1) {
      return res.status(404).json({
        status: "error",
        message: "Shipping rate not found",
      });
    }

    settings.shippingRates.splice(shippingRateIndex, 1);
    await settings.save();

    res.status(200).json({
      status: "success",
      message: "Shipping rate deleted successfully",
    });
  }
);

/**
 * @desc    Toggle shipping enabled
 * @route   PUT /api/admin/settings/shipping/toggle
 * @access  Private/Admin
 */
export const toggleShippingEnabled = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const settings = await AdminSettings.findOne();

    if (!settings) {
      return res.status(404).json({
        status: "error",
        message: "Settings not found",
      });
    }

    settings.shippingEnabled = !settings.shippingEnabled;
    await settings.save();

    res.status(200).json({
      status: "success",
      message: `Shipping ${
        settings.shippingEnabled ? "enabled" : "disabled"
      } successfully`,
      data: { shippingEnabled: settings.shippingEnabled },
    });
  }
);

// ============================================================================
// DISCOUNT CODE MANAGEMENT
// ============================================================================

/**
 * @desc    Add discount code
 * @route   POST /api/admin/settings/discount
 * @access  Private/Admin
 */
export const addDiscountCode = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const settings = await AdminSettings.findOne();

    if (!settings) {
      return res.status(404).json({
        status: "error",
        message: "Settings not found",
      });
    }

    const codeUpper = req.body.code.toUpperCase();

    // Check if code already exists
    const existingCode = settings.discountCodes.find(
      (dc: any) => dc.code === codeUpper
    );

    if (existingCode) {
      return res.status(400).json({
        status: "error",
        message: "Discount code already exists",
      });
    }

    // Add new discount code
    settings.discountCodes.push({
      ...req.body,
      code: codeUpper,
      usageCount: 0,
      usedBy: [],
    });

    await settings.save();

    // Get the newly added discount code
    const newCode = settings.discountCodes[settings.discountCodes.length - 1];

    res.status(201).json({
      status: "success",
      message: "Discount code added successfully",
      data: newCode,
    });
  }
);

/**
 * @desc    Update discount code
 * @route   PUT /api/admin/settings/discount/:id
 * @access  Private/Admin
 */
export const updateDiscountCode = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const settings = await AdminSettings.findOne();

    if (!settings) {
      return res.status(404).json({
        status: "error",
        message: "Settings not found",
      });
    }

    // Find discount code by _id
    const discountCodeIndex = settings.discountCodes.findIndex(
      (dc: any) => dc._id.toString() === req.params.id
    );

    if (discountCodeIndex === -1) {
      return res.status(404).json({
        status: "error",
        message: "Discount code not found",
      });
    }

    // If updating code, check for duplicates
    if (req.body.code) {
      const existingCode = settings.discountCodes.find(
        (dc: any) =>
          dc.code === req.body.code.toUpperCase() &&
          dc._id.toString() !== req.params.id
      );

      if (existingCode) {
        return res.status(400).json({
          status: "error",
          message: "Discount code already exists",
        });
      }

      req.body.code = req.body.code.toUpperCase();
    }

    // Update the discount code
    Object.assign(settings.discountCodes[discountCodeIndex], req.body);
    await settings.save();

    res.status(200).json({
      status: "success",
      message: "Discount code updated successfully",
      data: settings.discountCodes[discountCodeIndex],
    });
  }
);

/**
 * @desc    Delete discount code
 * @route   DELETE /api/admin/settings/discount/:id
 * @access  Private/Admin
 */
export const deleteDiscountCode = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const settings = await AdminSettings.findOne();

    if (!settings) {
      return res.status(404).json({
        status: "error",
        message: "Settings not found",
      });
    }

    // Find and remove discount code
    const discountCodeIndex = settings.discountCodes.findIndex(
      (dc: any) => dc._id.toString() === req.params.id
    );

    if (discountCodeIndex === -1) {
      return res.status(404).json({
        status: "error",
        message: "Discount code not found",
      });
    }

    settings.discountCodes.splice(discountCodeIndex, 1);
    await settings.save();

    res.status(200).json({
      status: "success",
      message: "Discount code deleted successfully",
    });
  }
);

/**
 * @desc    Validate discount code for order
 * @route   POST /api/admin/settings/discount/validate
 * @access  Private
 */
export const validateDiscountCode = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { code, orderAmount, products, categories } = req.body;
    const userId = req.user?._id;

    const settings = await AdminSettings.findOne();

    if (!settings) {
      return res.status(404).json({
        status: "error",
        message: "Settings not found",
      });
    }

    const discountCode = settings.discountCodes.find(
      (dc: any) => dc.code === code.toUpperCase() && dc.isActive
    );

    if (!discountCode) {
      return res.status(404).json({
        status: "error",
        message: "Invalid or inactive discount code",
      });
    }

    const now = new Date();

    // Check validity period
    if (now < discountCode.validFrom || now > discountCode.validUntil) {
      return res.status(400).json({
        status: "error",
        message: "Discount code has expired or not yet valid",
      });
    }

    // Check minimum order amount
    if (orderAmount < discountCode.minOrderAmount) {
      return res.status(400).json({
        status: "error",
        message: `Minimum order amount of ${discountCode.minOrderAmount} required`,
      });
    }

    // Check usage limit
    if (
      discountCode.usageLimit &&
      discountCode.usageCount >= discountCode.usageLimit
    ) {
      return res.status(400).json({
        status: "error",
        message: "Discount code usage limit reached",
      });
    }

    // Check per-user limit
    if (discountCode.perUserLimit && userId) {
      const userUsage = discountCode.usedBy.find(
        (u: any) => u.user.toString() === userId.toString()
      );

      if (userUsage && userUsage.usedCount >= discountCode.perUserLimit) {
        return res.status(400).json({
          status: "error",
          message: "You have reached the usage limit for this code",
        });
      }
    }

    // Check product/category restrictions
    if (
      discountCode.applicableProducts &&
      discountCode.applicableProducts.length > 0
    ) {
      const hasApplicableProduct = products.some((p: string) =>
        discountCode.applicableProducts!.some(
          (ap) => ap.toString() === p.toString()
        )
      );

      if (!hasApplicableProduct) {
        return res.status(400).json({
          status: "error",
          message: "Discount code not applicable to cart products",
        });
      }
    }

    if (
      discountCode.applicableCategories &&
      discountCode.applicableCategories.length > 0
    ) {
      const hasApplicableCategory = categories.some((c: string) =>
        discountCode.applicableCategories!.some(
          (ac) => ac.toString() === c.toString()
        )
      );

      if (!hasApplicableCategory) {
        return res.status(400).json({
          status: "error",
          message: "Discount code not applicable to cart categories",
        });
      }
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (discountCode.type === "percentage") {
      discountAmount = (orderAmount * discountCode.value) / 100;
    } else {
      discountAmount = discountCode.value;
    }

    // Apply max discount limit
    if (
      discountCode.maxDiscountAmount &&
      discountAmount > discountCode.maxDiscountAmount
    ) {
      discountAmount = discountCode.maxDiscountAmount;
    }

    res.status(200).json({
      status: "success",
      data: {
        code: discountCode.code,
        type: discountCode.type,
        value: discountCode.value,
        discountAmount: parseFloat(discountAmount.toFixed(2)),
        description: discountCode.description,
      },
    });
  }
);

/**
 * @desc    Get public settings (tax and shipping info for cart)
 * @route   GET /api/admin/settings/public
 * @access  Public
 */
export const getPublicSettings = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const settings = await AdminSettings.findOne().select(
      "taxEnabled taxRates shippingEnabled shippingRates freeShippingEnabled freeShippingThreshold storeCurrency minimumOrderAmount"
    );

    if (!settings) {
      return res.status(404).json({
        status: "error",
        message: "Settings not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        taxEnabled: settings.taxEnabled,
        taxRates: settings.taxRates.filter((tr: any) => tr.isActive),
        shippingEnabled: settings.shippingEnabled,
        shippingRates: settings.shippingRates.filter((sr: any) => sr.isActive),
        freeShippingEnabled: settings.freeShippingEnabled,
        freeShippingThreshold: settings.freeShippingThreshold,
        storeCurrency: settings.storeCurrency,
        minimumOrderAmount: settings.minimumOrderAmount,
      },
    });
  }
);
