import { Response } from "express";
import mongoose from "mongoose";
import Order from "../models/orderModel";
import { OrderStatus } from "../types/order.types";
import { AuthRequest } from "../types/user.types";
import catchAsync from "../utils/catchAsync";

export const getOrderAnalytics = catchAsync(
  async (req: AuthRequest, res: Response) => {
    if (!req.user?._id || req.user.role !== "admin") {
      return res.status(403).json({
        status: "error",
        message: "Not authorized",
      });
    }

    const now = new Date();

    // Allow custom date ranges
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : now;

    // Calculate previous period for comparison
    const periodDuration = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodDuration);
    const previousEndDate = new Date(startDate.getTime());

    // Time period constants (for quick stats - NOT affected by date range)
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      // Core metrics (✅ NOW FILTERED BY DATE RANGE)
      statusCounts,
      totalRevenue,
      currentPeriodStats,
      previousPeriodStats,

      // Time-based stats (NOT affected by date range - always relative to now)
      last24HoursStats,
      last7DaysStats,
      last30DaysStats,
      monthlyRevenue,
      dailyRevenue,

      // Product analytics (✅ Already filtered by date range)
      topProducts,
      categoryPerformance,
      brandPerformance,

      // Customer analytics (✅ Already filtered by date range)
      customerStats,
      repeatCustomerRate,

      // Operational metrics (✅ Already filtered by date range)
      averageFulfillmentTime,
      orderStatusBreakdown,
      paymentMethodStats,
      shippingStats,

      // Financial metrics (✅ Already filtered by date range)
      discountUsage,
      refundStats,
      taxCollected,
    ] = await Promise.all([
      // 1. Status distribution (✅ NOW FILTERED BY DATE RANGE)
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }, // ✅ ADDED
          },
        },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      // 2. Total revenue (✅ NOW FILTERED BY DATE RANGE)
      Order.aggregate([
        {
          $match: {
            isPaid: true,
            createdAt: { $gte: startDate, $lte: endDate }, // ✅ ADDED
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$totalPrice" },
            count: { $sum: 1 },
          },
        },
      ]),

      // 3. Current period statistics (✅ Already filtered)
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            isPaid: true,
          },
        },
        {
          $group: {
            _id: null,
            orders: { $sum: 1 },
            revenue: { $sum: "$totalPrice" },
            averageOrderValue: { $avg: "$totalPrice" },
            totalItems: { $sum: { $size: "$orderItems" } },
            totalDiscount: { $sum: "$discountAmount" },
            totalTax: { $sum: "$taxPrice" },
            totalShipping: { $sum: "$shippingPrice" },
          },
        },
      ]),

      // 4. Previous period statistics (✅ Already filtered)
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: previousStartDate, $lt: previousEndDate },
            isPaid: true,
          },
        },
        {
          $group: {
            _id: null,
            orders: { $sum: 1 },
            revenue: { $sum: "$totalPrice" },
            averageOrderValue: { $avg: "$totalPrice" },
          },
        },
      ]),

      // 5. Last 24 hours stats (NOT filtered - always relative to now)
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: last24Hours },
            isPaid: true,
          },
        },
        {
          $group: {
            _id: null,
            orders: { $sum: 1 },
            revenue: { $sum: "$totalPrice" },
          },
        },
      ]),

      // 6. Last 7 days stats (NOT filtered - always relative to now)
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: last7Days },
            isPaid: true,
          },
        },
        {
          $group: {
            _id: null,
            orders: { $sum: 1 },
            revenue: { $sum: "$totalPrice" },
            averageOrderValue: { $avg: "$totalPrice" },
          },
        },
      ]),

      // 7. Last 30 days stats (NOT filtered - always relative to now)
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: last30Days },
            isPaid: true,
          },
        },
        {
          $group: {
            _id: null,
            orders: { $sum: 1 },
            revenue: { $sum: "$totalPrice" },
            averageOrderValue: { $avg: "$totalPrice" },
          },
        },
      ]),

      // 8. Monthly revenue trend (✅ Already filtered)
      Order.aggregate([
        {
          $match: {
            isPaid: true,
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            revenue: { $sum: "$totalPrice" },
            orders: { $sum: 1 },
            averageOrderValue: { $avg: "$totalPrice" },
            itemsSold: { $sum: { $size: "$orderItems" } },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      // 9. Daily revenue (✅ Already filtered)
      Order.aggregate([
        {
          $match: {
            isPaid: true,
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" },
            },
            revenue: { $sum: "$totalPrice" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
      ]),

      // 10. Top selling products (✅ Already filtered)
      Order.aggregate([
        {
          $match: {
            status: { $nin: ["cancelled", "failed"] },
            isPaid: true,
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        { $unwind: "$orderItems" },
        {
          $group: {
            _id: "$orderItems.product",
            totalQuantity: { $sum: "$orderItems.quantity" },
            totalRevenue: {
              $sum: {
                $multiply: ["$orderItems.quantity", "$orderItems.price"],
              },
            },
            orderCount: { $sum: 1 },
            productName: { $first: "$orderItems.name" },
            averagePrice: { $avg: "$orderItems.price" },
            variations: {
              $push: {
                sku: "$orderItems.variation.sku",
                size: "$orderItems.variation.size",
                color: "$orderItems.variation.color",
                quantity: "$orderItems.quantity",
              },
            },
          },
        },
        {
          $project: {
            totalQuantity: 1,
            totalRevenue: 1,
            orderCount: 1,
            productName: 1,
            averagePrice: 1,
            uniqueVariations: {
              $reduce: {
                input: "$variations",
                initialValue: [],
                in: {
                  $cond: [
                    { $in: ["$$this.sku", "$$value.sku"] },
                    "$$value",
                    { $concatArrays: ["$$value", ["$$this"]] },
                  ],
                },
              },
            },
          },
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 10 },
      ]),

      // 11. Category performance (✅ Already filtered)
      Order.aggregate([
        {
          $match: {
            status: { $nin: ["cancelled", "failed"] },
            isPaid: true,
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        { $unwind: "$orderItems" },
        {
          $lookup: {
            from: "products",
            localField: "orderItems.product",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        { $unwind: "$productDetails" },
        {
          $group: {
            _id: "$productDetails.category",
            totalQuantity: { $sum: "$orderItems.quantity" },
            totalRevenue: {
              $sum: {
                $multiply: ["$orderItems.quantity", "$orderItems.price"],
              },
            },
            orderCount: { $sum: 1 },
            uniqueProducts: { $addToSet: "$orderItems.product" },
          },
        },
        {
          $project: {
            totalQuantity: 1,
            totalRevenue: 1,
            orderCount: 1,
            uniqueProductCount: { $size: "$uniqueProducts" },
          },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 10 },
      ]),

      // 12. Brand performance (✅ Already filtered)
      Order.aggregate([
        {
          $match: {
            status: { $nin: ["cancelled", "failed"] },
            isPaid: true,
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        { $unwind: "$orderItems" },
        {
          $lookup: {
            from: "products",
            localField: "orderItems.product",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        { $unwind: "$productDetails" },
        {
          $group: {
            _id: "$productDetails.brand",
            totalQuantity: { $sum: "$orderItems.quantity" },
            totalRevenue: {
              $sum: {
                $multiply: ["$orderItems.quantity", "$orderItems.price"],
              },
            },
            orderCount: { $sum: 1 },
          },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 10 },
      ]),

      // 13. Customer statistics (✅ Already filtered)
      Order.aggregate([
        {
          $match: {
            isPaid: true,
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            uniqueCustomers: { $addToSet: "$user" },
            totalOrders: { $sum: 1 },
          },
        },
        {
          $project: {
            uniqueCustomers: { $size: "$uniqueCustomers" },
            totalOrders: 1,
            averageOrdersPerCustomer: {
              $divide: ["$totalOrders", { $size: "$uniqueCustomers" }],
            },
          },
        },
      ]),

      // 14. Repeat customer rate (✅ Already filtered)
      Order.aggregate([
        {
          $match: {
            isPaid: true,
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: "$user",
            orderCount: { $sum: 1 },
            totalSpent: { $sum: "$totalPrice" },
            firstOrderDate: { $min: "$createdAt" },
            lastOrderDate: { $max: "$createdAt" },
          },
        },
        {
          $group: {
            _id: null,
            totalCustomers: { $sum: 1 },
            repeatCustomers: {
              $sum: { $cond: [{ $gt: ["$orderCount", 1] }, 1, 0] },
            },
            averageOrdersPerCustomer: { $avg: "$orderCount" },
            averageLifetimeValue: { $avg: "$totalSpent" },
          },
        },
        {
          $project: {
            totalCustomers: 1,
            repeatCustomers: 1,
            repeatCustomerRate: {
              $multiply: [
                { $divide: ["$repeatCustomers", "$totalCustomers"] },
                100,
              ],
            },
            averageOrdersPerCustomer: 1,
            averageLifetimeValue: 1,
          },
        },
      ]),

      // 15. Average fulfillment time (✅ Already filtered)
      Order.aggregate([
        {
          $match: {
            isDelivered: true,
            deliveredAt: { $exists: true },
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $project: {
            fulfillmentTime: {
              $divide: [
                { $subtract: ["$deliveredAt", "$createdAt"] },
                1000 * 60 * 60 * 24,
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            averageFulfillmentDays: { $avg: "$fulfillmentTime" },
            minFulfillmentDays: { $min: "$fulfillmentTime" },
            maxFulfillmentDays: { $max: "$fulfillmentTime" },
          },
        },
      ]),

      // 16. Order status breakdown (✅ NOW FILTERED BY DATE RANGE)
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }, // ✅ ADDED
          },
        },
        {
          $facet: {
            byStatus: [
              {
                $group: {
                  _id: "$status",
                  count: { $sum: 1 },
                  totalValue: { $sum: "$totalPrice" },
                },
              },
            ],
            conversionRate: [
              {
                $group: {
                  _id: null,
                  totalOrders: { $sum: 1 },
                  paidOrders: {
                    $sum: { $cond: [{ $eq: ["$isPaid", true] }, 1, 0] },
                  },
                  completedOrders: {
                    $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
                  },
                  cancelledOrders: {
                    $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
                  },
                  failedOrders: {
                    $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
                  },
                },
              },
              {
                $project: {
                  totalOrders: 1,
                  paidOrders: 1,
                  completedOrders: 1,
                  cancelledOrders: 1,
                  failedOrders: 1,
                  paymentConversionRate: {
                    $cond: [
                      { $eq: ["$totalOrders", 0] },
                      0,
                      {
                        $multiply: [
                          { $divide: ["$paidOrders", "$totalOrders"] },
                          100,
                        ],
                      },
                    ],
                  },
                  completionRate: {
                    $cond: [
                      { $eq: ["$totalOrders", 0] },
                      0,
                      {
                        $multiply: [
                          { $divide: ["$completedOrders", "$totalOrders"] },
                          100,
                        ],
                      },
                    ],
                  },
                  cancellationRate: {
                    $cond: [
                      { $eq: ["$totalOrders", 0] },
                      0,
                      {
                        $multiply: [
                          { $divide: ["$cancelledOrders", "$totalOrders"] },
                          100,
                        ],
                      },
                    ],
                  },
                  failureRate: {
                    $cond: [
                      { $eq: ["$totalOrders", 0] },
                      0,
                      {
                        $multiply: [
                          { $divide: ["$failedOrders", "$totalOrders"] },
                          100,
                        ],
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      ]),

      // 17. Payment method statistics (✅ Already filtered)
      Order.aggregate([
        {
          $match: {
            isPaid: true,
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: "$paymentMethod",
            count: { $sum: 1 },
            totalRevenue: { $sum: "$totalPrice" },
            averageOrderValue: { $avg: "$totalPrice" },
          },
        },
        { $sort: { count: -1 } },
      ]),

      // 18. Shipping statistics (✅ Already filtered)
      Order.aggregate([
        {
          $match: {
            isPaid: true,
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: "$shippingAddress.country",
            orders: { $sum: 1 },
            revenue: { $sum: "$totalPrice" },
            averageShippingCost: { $avg: "$shippingPrice" },
            cities: { $addToSet: "$shippingAddress.city" },
          },
        },
        {
          $project: {
            orders: 1,
            revenue: 1,
            averageShippingCost: 1,
            uniqueCities: { $size: "$cities" },
          },
        },
        { $sort: { orders: -1 } },
        { $limit: 10 },
      ]),

      // 19. Discount usage statistics (✅ Already filtered)
      Order.aggregate([
        {
          $match: {
            isPaid: true,
            discountAmount: { $gt: 0 },
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: "$discount.code",
            usageCount: { $sum: 1 },
            totalDiscountGiven: { $sum: "$discountAmount" },
            totalRevenue: { $sum: "$totalPrice" },
            averageDiscount: { $avg: "$discountAmount" },
          },
        },
        { $sort: { usageCount: -1 } },
        { $limit: 10 },
      ]),

      // 20. Refund statistics (✅ Already filtered)
      Order.aggregate([
        {
          $match: {
            status: "refunded",
            "refund.amount": { $exists: true },
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            totalRefunds: { $sum: 1 },
            totalRefundAmount: { $sum: "$refund.amount" },
            averageRefundAmount: { $avg: "$refund.amount" },
          },
        },
      ]),

      // 21. Tax collected (✅ Already filtered)
      Order.aggregate([
        {
          $match: {
            isPaid: true,
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            totalTaxCollected: { $sum: "$taxPrice" },
            averageTaxPerOrder: { $avg: "$taxPrice" },
          },
        },
      ]),
    ]);

    // Calculate growth rates
    const currentStats = currentPeriodStats[0] || {
      orders: 0,
      revenue: 0,
      averageOrderValue: 0,
    };
    const previousStats = previousPeriodStats[0] || {
      orders: 0,
      revenue: 0,
      averageOrderValue: 0,
    };

    const calculateGrowthRate = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const growthRates = {
      revenue: calculateGrowthRate(currentStats.revenue, previousStats.revenue),
      orders: calculateGrowthRate(currentStats.orders, previousStats.orders),
      averageOrderValue: calculateGrowthRate(
        currentStats.averageOrderValue,
        previousStats.averageOrderValue
      ),
    };

    // Format response
    const analytics = {
      overview: {
        totalOrders: statusCounts.reduce((sum, s) => sum + s.count, 0),
        totalRevenue: totalRevenue[0]?.total || 0,
        totalPaidOrders: totalRevenue[0]?.count || 0,
        averageOrderValue:
          totalRevenue[0]?.total && totalRevenue[0]?.count
            ? totalRevenue[0].total / totalRevenue[0].count
            : 0,
      },
      periodAnalysis: {
        current: {
          startDate,
          endDate,
          orders: currentStats.orders,
          revenue: currentStats.revenue,
          averageOrderValue: currentStats.averageOrderValue,
          totalItems: currentStats.totalItems || 0,
          totalDiscount: currentStats.totalDiscount || 0,
          totalTax: currentStats.totalTax || 0,
          totalShipping: currentStats.totalShipping || 0,
        },
        previous: {
          startDate: previousStartDate,
          endDate: previousEndDate,
          orders: previousStats.orders,
          revenue: previousStats.revenue,
          averageOrderValue: previousStats.averageOrderValue,
        },
        growth: growthRates,
      },
      quickStats: {
        last24Hours: last24HoursStats[0] || { orders: 0, revenue: 0 },
        last7Days: last7DaysStats[0] || {
          orders: 0,
          revenue: 0,
          averageOrderValue: 0,
        },
        last30Days: last30DaysStats[0] || {
          orders: 0,
          revenue: 0,
          averageOrderValue: 0,
        },
      },
      trends: {
        monthly: monthlyRevenue,
        daily: dailyRevenue,
      },
      products: {
        topSelling: topProducts,
        byCategory: categoryPerformance,
        byBrand: brandPerformance,
      },
      customers: {
        stats: customerStats[0] || {
          uniqueCustomers: 0,
          totalOrders: 0,
          averageOrdersPerCustomer: 0,
        },
        loyalty: repeatCustomerRate[0] || {
          totalCustomers: 0,
          repeatCustomers: 0,
          repeatCustomerRate: 0,
          averageOrdersPerCustomer: 0,
          averageLifetimeValue: 0,
        },
      },
      operations: {
        fulfillment: averageFulfillmentTime[0] || {
          averageFulfillmentDays: 0,
          minFulfillmentDays: 0,
          maxFulfillmentDays: 0,
        },
        statusBreakdown: {
          byStatus: orderStatusBreakdown[0]?.byStatus || [],
          conversionMetrics: orderStatusBreakdown[0]?.conversionRate[0] || {},
        },
      },
      financial: {
        paymentMethods: paymentMethodStats,
        discounts: {
          topCodes: discountUsage,
          summary: {
            totalDiscountGiven: currentStats.totalDiscount || 0,
            ordersWithDiscount: discountUsage.length,
          },
        },
        refunds: refundStats[0] || {
          totalRefunds: 0,
          totalRefundAmount: 0,
          averageRefundAmount: 0,
        },
        tax: taxCollected[0] || {
          totalTaxCollected: 0,
          averageTaxPerOrder: 0,
        },
      },
      geography: {
        topCountries: shippingStats,
      },
      statusDistribution: statusCounts.reduce((acc: any, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
    };

    res.status(200).json({
      status: "success",
      data: analytics,
    });
  }
);

/**
 * @desc    Get user order statistics
 * @route   GET /api/orders/user-stats
 * @access  Private
 */
export const getUserOrderStats = catchAsync(
  async (req: AuthRequest, res: Response) => {
    if (!req.user?._id) {
      return res.status(401).json({
        status: "error",
        message: "Not authorized",
      });
    }

    const userId = new mongoose.Types.ObjectId(req.user._id);

    const [orderStats, recentOrders] = await Promise.all([
      // Combined statistics
      Order.aggregate([
        { $match: { user: userId } },
        {
          $facet: {
            overall: [
              {
                $group: {
                  _id: null,
                  totalOrders: { $sum: 1 },
                  paidOrdersCount: {
                    $sum: { $cond: [{ $eq: ["$isPaid", true] }, 1, 0] },
                  },
                  totalSpent: {
                    $sum: {
                      $cond: [{ $eq: ["$isPaid", true] }, "$totalPrice", 0],
                    },
                  },
                },
              },
            ],
            paidOrders: [
              { $match: { isPaid: true } },
              {
                $group: {
                  _id: null,
                  averageOrderValue: { $avg: "$totalPrice" },
                },
              },
            ],
            statusBreakdown: [
              {
                $group: {
                  _id: "$status",
                  count: { $sum: 1 },
                },
              },
            ],
          },
        },
      ]),

      // Recent orders
      Order.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("orderNumber status totalPrice createdAt isPaid isDelivered")
        .lean(),
    ]);

    const overallStats = orderStats[0]?.overall[0] || {
      totalOrders: 0,
      paidOrdersCount: 0,
      totalSpent: 0,
    };

    const paidStats = orderStats[0]?.paidOrders[0] || {
      averageOrderValue: 0,
    };

    // Build status counts object with all possible statuses
    const allStatuses: OrderStatus[] = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "completed",
      "cancelled",
      "refunded",
      "on-hold",
      "failed",
    ];

    const statusCounts: Record<string, number> = allStatuses.reduce(
      (acc, status) => {
        acc[status] = 0;
        return acc;
      },
      {} as Record<string, number>
    );

    // Fill in actual counts from aggregation
    const statusBreakdown = orderStats[0]?.statusBreakdown || [];
    statusBreakdown.forEach((item: { _id: string; count: number }) => {
      statusCounts[item._id] = item.count;
    });

    res.status(200).json({
      status: "success",
      data: {
        // Overall stats
        totalOrders: overallStats.totalOrders,
        totalSpent: Number(overallStats.totalSpent.toFixed(2)),
        paidOrdersCount: overallStats.paidOrdersCount,
        averageOrderValue: Number(
          (paidStats.averageOrderValue || 0).toFixed(2)
        ),

        // Status breakdown (all statuses)
        statusCounts,

        // Quick access to common statuses
        pendingOrders: statusCounts.pending || 0,
        processingOrders: statusCounts.processing || 0,
        shippedOrders: statusCounts.shipped || 0,
        deliveredOrders: statusCounts.delivered || 0,
        completedOrders: statusCounts.completed || 0,
        cancelledOrders: statusCounts.cancelled || 0,

        // Recent orders
        recentOrders,
      },
    });
  }
);
