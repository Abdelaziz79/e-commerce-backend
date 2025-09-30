import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config({});

const config = {
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5000,
  mongoUri:
    process.env.MONGO_URI || "mongodb://mongodb:27017/ecommerce?replicaSet=rs0",
  jwtSecret: process.env.JWT_SECRET || "your_default_jwt_secret_key",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "30d",
  emailUser: process.env.EMAIL_USER || "your_default_email_user",
  emailPass: process.env.EMAIL_PASS || "your_default_email_password",
  emailFrom: process.env.EMAIL_FROM || "E-Commerce App",
  baseUrl: process.env.BASE_URL || "http://localhost:5000",
  frontendBaseUrl: process.env.FRONTEND_BASE_URL || "http://localhost:3000",
};

export default config;
