// src/types/category.types.ts

import { Document } from "mongoose";

export interface CategoryDocument extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentCategory?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
