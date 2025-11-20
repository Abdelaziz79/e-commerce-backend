import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import multer from "multer";

// Not Found Error Handler
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Custom Error Handler
// export const errorHandler = (
//   err: Error,
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   // Check if response status code is 200 (default) and set it to 500 if so
//   const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
//   res.status(statusCode);

//   // Enhanced error response
//   const errorResponse: any = {
//     status: "error",
//     message: err.message,
//   };

//   // Add stack trace only in development
//   if (process.env.NODE_ENV === "development") {
//     errorResponse.stack = err.stack;
//   }

//   // Handle specific error types
//   if (err.name === "ValidationError") {
//     errorResponse.message = "Validation Error";
//     errorResponse.errors = err.message;
//   }

//   if (err.name === "CastError") {
//     errorResponse.message = "Invalid ID format";
//   }

//   if ((err as any).code === 11000) {
//     errorResponse.message = "Duplicate field value entered";
//   }

//   res.json(errorResponse);
// };

// Validation Error Handler
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: "fail",
      errors: errors.array(),
    });
  }
  next();
};

// Error handler for multer errors - export this to use in your app
export const handleUploadError = (
  err: any,
  req: Request,
  res: Response,
  next: any
) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        return res.status(400).json({
          status: "fail",
          message: "File size too large. Maximum size is 5MB.",
        });
      case "LIMIT_FILE_COUNT":
        return res.status(400).json({
          status: "fail",
          message: "Too many files uploaded.",
        });
      case "LIMIT_UNEXPECTED_FILE":
        return res.status(400).json({
          status: "fail",
          message: "Unexpected field in file upload.",
        });
      default:
        return res.status(400).json({
          status: "fail",
          message: err.message,
        });
    }
  }

  // Custom file filter errors
  if (err.message && err.message.includes("Invalid file type")) {
    return res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }

  // Pass other errors to the next error handler
  next(err);
};
