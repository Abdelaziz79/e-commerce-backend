import { Document, Types } from "mongoose";
import { ReviewDocument } from "./review.types";

// Updated to match model naming
export interface ProductVariation {
  size?: string;
  color?: string;
  material?: string;
  style?: string;
  sku: string;
  price: number;
  countInStock: number;
  _id?: string;
}

export interface ProductDimension {
  length: number;
  width: number;
  height: number;
  unit: string; // e.g., 'cm', 'inch'
}

export interface ProductDocument extends Document {
  name: string;
  slug: string;
  description: string;
  richDescription?: string;
  price: number;
  category: Types.ObjectId; // Changed to ObjectId
  brand: Types.ObjectId; // Changed to ObjectId
  images: string[];
  mainImage: string;
  countInStock: number;
  hasVariations: boolean;
  variations: ProductVariation[];
  rating: number; // Will be calculated from reviews
  numReviews: number; // Will be calculated from reviews
  reviews?: ReviewDocument[]; // For virtual population
  featured: boolean;
  isNewProduct: boolean;
  onSale: boolean;
  salePrice?: number;
  saleEndDate?: Date;
  tags: string[];
  weight?: number;
  weightUnit: string;
  dimensions?: ProductDimension;
  relatedProducts: Types.ObjectId[]; // Changed to ObjectId array
  warranty?: string;
  attributes?: Map<string, string>;
  createdAt: Date;
  updatedAt: Date;
}
