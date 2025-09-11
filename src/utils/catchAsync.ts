import { Request, Response, NextFunction } from "express";

/**
 * Wraps async controller functions to handle errors automatically
 * This eliminates the need for try/catch blocks in each controller function
 *
 * @param fn - The async controller function
 */
const catchAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      console.error(err);
      res.status(err.statusCode || 500).json({
        message: err.message || "Server error",
        stack: process.env.NODE_ENV === "production" ? null : err.stack,
      });
    });
  };
};

export default catchAsync;
