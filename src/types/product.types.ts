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
  _id?: string; // Added to match model
}

export interface ProductDimension {
  length: number;
  width: number;
  height: number;
  unit: string; // e.g., 'cm', 'inch'
}

export interface ProductReview {
  _id?: string; // Added to match model
  user: string;
  name: string;
  rating: number;
  comment: string;
  title?: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  helpfulVotes: number; // Made required to match model default
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductDocument extends Document {
  name: string;
  slug: string;
  description: string;
  richDescription?: string; // HTML or markdown content
  price: number;
  category: string;
  subcategories?: string[];
  brand: string;
  images: string[]; // Array of image URLs or relative paths
  mainImage: string; // Primary image for listings
  countInStock: number;
  hasVariations: boolean;
  variations: ProductVariation[]; // Made required to match model
  rating: number;
  numReviews: number;
  reviews: ProductReview[];
  featured: boolean;
  isNewProduct: boolean;
  onSale: boolean;
  salePrice?: number;
  saleEndDate?: Date;
  tags: string[]; // Made required to match model default
  weight?: number;
  weightUnit: string; // Made required to match model default
  dimensions?: ProductDimension;
  relatedProducts: string[]; // Made required to match model - Array of related product IDs
  warranty?: string;
  attributes: Map<string, string>; // Made required to match model - Dynamic product attributes
  createdAt: Date;
  updatedAt: Date;
}
