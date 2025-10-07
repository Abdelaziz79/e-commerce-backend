// src/types/brand.types.ts

import { Document } from "mongoose";

export interface BrandDocument extends Document {
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  createdAt: Date;
  updatedAt: Date;
}
