// src/utils/initializeSettings.ts
import AdminSettings from "../models/adminSettingsModel";

export const initializeAdminSettings = async () => {
  try {
    const existing = await AdminSettings.findOne();

    if (!existing) {
      await AdminSettings.create({
        // General settings
        storeName: "My E-Commerce Store",
        storeEmail: "admin@mystore.com",
        storeCurrency: "USD",
        storeTimezone: "UTC",
        orderPrefix: "ORD",
        minimumOrderAmount: 0,
        allowGuestCheckout: true,

        // Tax settings
        taxEnabled: true,
        pricesIncludeTax: false,
        taxRates: [
          {
            name: "Standard Tax",
            rate: 10,
            description: "Default tax rate for all orders",
            isDefault: true,
            isActive: true,
            priority: 0,
          },
        ],

        // Shipping settings
        shippingEnabled: true,
        freeShippingEnabled: true,
        freeShippingThreshold: 100,
        shippingRates: [
          {
            name: "Standard Shipping",
            description: "Delivery in 5-7 business days",
            type: "flat",
            flatRate: 9.99,
            freeShippingThreshold: 100,
            isActive: true,
          },
          {
            name: "Express Shipping",
            description: "Delivery in 2-3 business days",
            type: "flat",
            flatRate: 19.99,
            isActive: true,
          },
        ],

        // Discount codes - empty by default
        discountCodes: [],

        // Notification settings
        sendOrderConfirmation: true,
        sendShippingNotification: true,

        // Maintenance mode
        maintenanceMode: false,
        maintenanceMessage:
          "We're currently performing scheduled maintenance. We'll be back soon!",
      });

      console.log("✅ Admin settings initialized with default values");
    } else {
      console.log("ℹ️  Admin settings already exist");
    }
  } catch (error: any) {
    console.error("❌ Error initializing admin settings:", error.message);
    throw error;
  }
};
