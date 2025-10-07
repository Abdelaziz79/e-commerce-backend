import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import config from "./config/config";
import connectDB from "./config/db";
import { errorHandler, notFound } from "./middleware/errorMiddleware";
import authRoutes from "./routes/authRoutes";
import brandRoutes from "./routes/brandRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import orderRoutes from "./routes/orderRoutes";
import productRoutes from "./routes/productRoutes";
import reviewRoutes from "./routes/reviewRoutes";
import userRoutes from "./routes/userRoutes";

// Connect to MongoDB
connectDB();

// Initialize Express
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());

// Logging
if (config.env === "development") {
  app.use(morgan("dev"));
}

// Welcome route
app.get("/", (req, res) => {
  res.json({
    message: "API is running...",
    environment: config.env,
    version: "1.0.0",
  });
});

// API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/brands", brandRoutes);
app.use("/api/v1/reviews", reviewRoutes);

// Error Middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server running in ${config.env} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err: Error) => {
  console.error(`Unhandled Rejection: ${err.name}, ${err.message}`);
  // Close server & exit process
  process.exit(1);
});
