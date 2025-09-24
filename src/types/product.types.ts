import { Document } from "mongoose";

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

export interface ProductReview {
  _id?: string;
  user: string;
  name: string;
  rating: number;
  comment: string;
  title?: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  helpfulVotes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductDocument extends Document {
  name: string;
  slug: string;
  description: string;
  richDescription?: string;
  price: number;
  category: string;
  subcategories?: string[];
  brand: string;
  images: string[];
  mainImage: string;
  countInStock: number;
  hasVariations: boolean;
  variations: ProductVariation[];
  rating: number;
  numReviews: number;
  reviews: ProductReview[];
  featured: boolean;
  isNewProduct: boolean;
  onSale: boolean;
  salePrice?: number;
  saleEndDate?: Date;
  tags: string[];
  weight?: number;
  weightUnit: string;
  dimensions?: ProductDimension;
  relatedProducts: string[]; // Fixed: Changed from ObjectId references to string array to match usage
  warranty?: string;
  attributes?: Map<string, string>; // Fixed: Made optional to match model
  createdAt: Date;
  updatedAt: Date;
}
