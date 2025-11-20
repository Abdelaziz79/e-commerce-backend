import { Response } from "express";

export const successResponse = <T = any | null>({
  res,
  message = "done",
  statusCode = 200,
  data,
}: {
  res: Response;
  message?: string;
  statusCode?: number;
  data?: T;
}): Response => res.status(statusCode).json({ message, data });
