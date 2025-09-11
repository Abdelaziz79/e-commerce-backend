import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/userModel";
import { AuthRequest } from "../types/user.types";
import config from "../config/config";

// Protect routes middleware
export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let token;

    // Check if token exists in headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, config.jwtSecret) as { id: string };

      // Get user from token
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({
          status: "error",
          message: "User not found",
        });
      }

      req.user = user;
      return next();
    }

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Not authorized, no token",
      });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({
      status: "error",
      message: "Not authorized, token failed",
    });
  }
};

// Admin middleware
export const admin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({
      status: "error",
      message: "Not authorized as an admin",
    });
  }
};
