// src/types/review.types.ts

import { Document, Types } from "mongoose";

export interface ReviewDocument extends Document {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  user: Types.ObjectId;
  rating: number;
  comment: string;
  title?: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  helpfulVotes: number;
  createdAt: Date;
  updatedAt: Date;
}
