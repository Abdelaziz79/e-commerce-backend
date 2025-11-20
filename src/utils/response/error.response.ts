import { NextFunction, Request, Response } from "express";

export interface IError extends Error {
  statusCode: number;
  // cause?: unknown;
}

export class ApplicationException extends Error {
  constructor(message: string, public statusCode: number, cause?: unknown) {
    super(message);
    this.name = this.constructor.name;
    // (this as any).cause = cause;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequest extends ApplicationException {
  constructor(message: string, cause?: unknown) {
    super(message, 400, cause);
  }
}

export class conflictException extends ApplicationException {
  constructor(message: string, cause?: unknown) {
    super(message, 409, cause);
  }
}

export class notFoundException extends ApplicationException {
  constructor(message: string, cause?: unknown) {
    super(message, 404, cause);
  }
}

export class UnAuthorizedException extends ApplicationException {
  constructor(message: string, cause?: unknown) {
    super(message, 401, cause);
  }
}

export class ForbiddenException extends ApplicationException {
  constructor(message: string, cause?: unknown) {
    super(message, 403, cause);
  }
}

export const globalErrorHandling = (
  error: IError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return res
    .status(error.statusCode || 500)
    .json({
      error_message: error.message || "something went wrong !",
      stack: process.env.MOOD === "development" ? error.stack : undefined,
      // cause: error.cause,
      error
    });
};
