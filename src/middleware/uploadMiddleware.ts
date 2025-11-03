// src/middleware/uploadMiddleware.ts

import multer, { FileFilterCallback } from "multer";
import path from "path";
import { Request } from "express";
import fs from "fs";

// Create uploads directory if it doesn't exist
const createUploadDir = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Generic storage configuration
const createStorage = (folder: string) => {
  const uploadPath = path.join(__dirname, `../../uploads/${folder}`);
  createUploadDir(uploadPath);

  return multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb) => {
      cb(null, uploadPath);
    },
    filename: (req: Request, file: Express.Multer.File, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname);
      const filename = `${folder}-${uniqueSuffix}${ext}`;
      cb(null, filename);
    },
  });
};

// File filter to accept only images
const imageFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, and WebP images are allowed."
      )
    );
  }
};

// Generic upload configuration
interface UploadConfig {
  folder: string;
  fieldName: string;
  maxSize?: number; // in bytes
  maxCount?: number; // for multiple files
}

export const createImageUpload = (config: UploadConfig) => {
  const { folder, fieldName, maxSize = 5 * 1024 * 1024, maxCount = 1 } = config;

  const upload = multer({
    storage: createStorage(folder),
    fileFilter: imageFileFilter,
    limits: {
      fileSize: maxSize,
    },
  });

  return maxCount === 1
    ? upload.single(fieldName)
    : upload.array(fieldName, maxCount);
};

// Pre-configured upload middlewares for different entities
export const brandImageUpload = createImageUpload({
  folder: "brands",
  fieldName: "logo",
  maxSize: 5 * 1024 * 1024, // 5MB
});

export const productImageUpload = multer({
  storage: createStorage("products"),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
}).fields([
  { name: "images", maxCount: 10 },
  { name: "mainImage", maxCount: 1 },
]);

export const categoryImageUpload = createImageUpload({
  folder: "categories",
  fieldName: "image",
  maxSize: 5 * 1024 * 1024,
});

export const reviewImageUpload = createImageUpload({
  folder: "reviews",
  fieldName: "images",
  maxSize: 5 * 1024 * 1024, // 5MB per image
  maxCount: 5, // Maximum 5 images per review
});

export const avatarImageUpload = createImageUpload({
  folder: "avatars",
  fieldName: "avatar",
  maxSize: 5 * 1024 * 1024, // 5MB
});

// Utility function to get file path for storage
export const getImagePath = (filename: string, folder: string): string => {
  return `/uploads/${folder}/${filename}`;
};

// Utility function to delete old image
export const deleteImage = (imagePath: string): void => {
  if (imagePath && !imagePath.includes("default-avatar")) {
    const fullPath = path.join(__dirname, `../../${imagePath}`);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }
};
