# E-Commerce Backend API

A comprehensive, production-ready RESTful API for an e-commerce platform built with Node.js, Express, TypeScript, and MongoDB. Features advanced product management, order processing, user authentication, admin controls, and dynamic pricing with tax, shipping, and discount calculations.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Database Setup](#-database-setup)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Core Features Deep Dive](#-core-features-deep-dive)
- [Security Features](#-security-features)
- [Error Handling](#-error-handling)
- [Rate Limiting](#-rate-limiting)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🛒 **Product Management**

- Complete CRUD operations for products
- Product variations (size, color, material, style)
- Advanced search and filtering
- Bulk operations (create, update, delete)
- Product categories and brands management
- Image upload and management
- Stock tracking (main product + variations)
- Low stock and out-of-stock alerts
- Featured products and sales management
- Related products suggestions
- Product tags and attributes

### 👤 **User Management**

- User registration with email verification
- Secure authentication with JWT
- Role-based access control (User/Admin)
- User profile management with avatar upload
- Password reset via email
- User status management (active/banned/suspended)
- Shopping cart with variation support
- Wishlist/favorites
- Multiple shipping addresses
- Order history tracking

### 📦 **Order Management**

- Complete order lifecycle management
- Order status tracking (9 states)
- Real-time stock adjustment
- Payment processing integration
- Shipping tracking
- Order cancellation with stock restoration
- Order search and filtering
- Order export functionality
- Order analytics and statistics

### 💰 **Advanced Pricing System**

- Dynamic tax calculation based on location
- Multiple tax rates with priority system
- Flexible shipping rates (flat/weight-based/price-based)
- Free shipping thresholds
- Discount code system with:
  - Percentage and fixed discounts
  - Product/category restrictions
  - Usage limits (global and per-user)
  - Time-based validity
  - Exclusion rules

### 📊 **Analytics & Reporting**

- Order analytics with custom date ranges
- Sales trends (daily/monthly)
- Product performance metrics
- Category and brand analysis
- Customer behavior insights
- Revenue tracking
- Conversion rates
- Inventory analytics

### ⭐ **Review System**

- Product reviews with ratings (1-5 stars)
- Image uploads for reviews
- Verified purchase badges
- Helpful votes on reviews
- Review moderation
- Review statistics and breakdowns

### 🔐 **Admin Features**

- User management (ban/suspend/role changes)
- Complete product control
- Order management and tracking
- Review moderation
- Settings configuration
- Analytics dashboard
- Bulk operations

---

## 🛠 Tech Stack

### **Core Technologies**

- **Runtime**: Node.js (v14+)
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)

### **Key Libraries**

- **Security**:
  - `helmet` - Security headers
  - `bcryptjs` - Password hashing
  - `express-rate-limit` - Rate limiting
  - `cors` - Cross-origin resource sharing
- **Validation**:
  - `express-validator` - Request validation
- **File Upload**:
  - `multer` - Multipart form data handling
- **Email**:
  - `nodemailer` - Email notifications
- **Utilities**:
  - `slugify` - URL-friendly slugs
  - `dotenv` - Environment configuration
  - `morgan` - HTTP request logging

---

## 📁 Project Structure

```
ecommerce-backend/
├── config/
│   ├── config.ts              # Environment configuration
│   └── db.ts                  # MongoDB connection
│
├── controllers/
│   ├── adminSettingsController.ts    # Settings management
│   ├── adminUserController.ts        # User administration
│   ├── authController.ts             # Authentication
│   ├── brandController.ts            # Brand CRUD
│   ├── cartController.ts             # Shopping cart
│   ├── categoryController.ts         # Category CRUD
│   ├── orderAnalyticsController.ts   # Order analytics
│   ├── orderController.ts            # Order management
│   ├── productController.ts          # Product CRUD
│   ├── reviewController.ts           # Review system
│   └── userController.ts             # User profile
│
├── middleware/
│   ├── authMiddleware.ts                        # Authentication & authorization
│   ├── errorMiddleware.ts                       # Error handling
│   ├── rateLimit.ts                            # Rate limiting
│   ├── uploadMiddleware.ts                     # File uploads
│   ├── adminSettingsValidationMiddleware.ts    # Settings validation
│   ├── adminValidationMiddleware.ts            # Admin validation
│   ├── authValidationMiddleware.ts             # Auth validation
│   ├── brandValidationMiddleware.ts            # Brand validation
│   ├── cartValidationMiddleware.ts             # Cart validation
│   ├── categoryValidationMiddleware.ts         # Category validation
│   ├── orderValidationMiddleware.ts            # Order validation
│   ├── productValidationMiddleware.ts          # Product validation
│   ├── reviewValidationMiddleware.ts           # Review validation
│   └── userValidationMiddleware.ts             # User validation
│
├── models/
│   ├── adminSettingsModel.ts  # Admin settings schema
│   ├── brandModel.ts           # Brand schema
│   ├── categoryModel.ts        # Category schema
│   ├── orderModel.ts           # Order schema
│   ├── productModel.ts         # Product schema
│   ├── reviewModel.ts          # Review schema
│   └── userModel.ts            # User schema
│
├── routes/
│   ├── adminRoutes.ts          # Admin routes
│   ├── adminSettingsRoutes.ts  # Settings routes
│   ├── authRoutes.ts           # Authentication routes
│   ├── brandRoutes.ts          # Brand routes
│   ├── categoryRoutes.ts       # Category routes
│   ├── orderRoutes.ts          # Order routes
│   ├── productRoutes.ts        # Product routes
│   ├── reviewRoutes.ts         # Review routes
│   └── userRoutes.ts           # User routes
│
├── types/
│   ├── adminSettings.types.ts  # Settings types
│   ├── brand.types.ts          # Brand types
│   ├── category.types.ts       # Category types
│   ├── order.types.ts          # Order types
│   ├── product.types.ts        # Product types
│   ├── review.types.ts         # Review types
│   └── user.types.ts           # User types
│
├── utils/
│   ├── apiFeatures.ts          # Query builder utility
│   ├── catchAsync.ts           # Async error handler
│   ├── emailService.ts         # Email functionality
│   ├── generateToken.ts        # JWT token generation
│   ├── initializeSettings.ts   # Settings initialization
│   └── orderCalculations.ts    # Order pricing logic
│
├── uploads/                    # File upload directory
│   ├── products/
│   ├── categories/
│   ├── brands/
│   ├── reviews/
│   └── avatars/
│
├── .env                        # Environment variables
├── .gitignore
├── package.json
├── tsconfig.json
└── index.ts                    # Application entry point
```

---

## 📋 Prerequisites

- **Node.js** v14 or higher
- **MongoDB** v4.4 or higher (with replica set for transactions)
- **npm** or **yarn** package manager
- **TypeScript** knowledge (for development)
- **Gmail account** (for email notifications) or SMTP server

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Abdelaziz79/e-commerce-backend.git
cd e-commerce-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

---

## 🔐 Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
MONGO_URI=mongodb://localhost:27017/ecommerce?replicaSet=rs0

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=30d

# Email Configuration (Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password
EMAIL_FROM=E-Commerce Store

# URLs
BASE_URL=http://localhost:5000
FRONTEND_BASE_URL=http://localhost:3000
```

### 📧 **Email Configuration Notes**

For Gmail:

1. Enable 2-factor authentication
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the app password in `EMAIL_PASS`

For other SMTP services, modify `utils/emailService.ts` accordingly.

---

## 💾 Database Setup

### **MongoDB with Replica Set** (Required for Transactions)

#### Option 1: Local MongoDB with Docker

```bash
# Create docker-compose.yml
version: '3.8'
services:
  mongodb:
    image: mongo:6.0
    ports:
      - "27017:27017"
    command: ["--replSet", "rs0", "--bind_ip_all"]
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
```

```bash
# Start MongoDB
docker-compose up -d

# Initialize replica set
docker exec -it <container_id> mongosh
> rs.initiate()
```

#### Option 2: MongoDB Atlas (Cloud)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get connection string
4. Update `MONGO_URI` in `.env`

---

## 🏃 Running the Application

### **Development Mode**

```bash
# With hot reload
npm run dev

# Or standard TypeScript compilation
npm run build
npm start
```

### **Production Mode**

```bash
# Build TypeScript
npm run build

# Start production server
npm run start:prod
```

The API will be available at `http://localhost:5000`

---

## 📚 API Documentation

### **Base URL**

```
http://localhost:5000/api/v1
```

### **Authentication**

All protected routes require a Bearer token:

```
Authorization: Bearer <your_jwt_token>
```

---

## 🔑 Authentication Endpoints

### **Register User**

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123",
  "phone": "+1234567890"
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "isEmailVerified": false,
    "token": "jwt_token_here"
  },
  "verificationURL": "http://localhost:3000/verify-email/token"
}
```

### **Login**

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Password123"
}
```

### **Verify Email**

```http
GET /api/v1/auth/verify-email/:token
```

### **Forgot Password**

```http
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

### **Reset Password**

```http
POST /api/v1/auth/reset-password/:token
Content-Type: application/json

{
  "password": "NewPassword123",
  "confirmPassword": "NewPassword123"
}
```

---

## 👤 User Endpoints

### **Get Profile**

```http
GET /api/v1/users/profile
Authorization: Bearer <token>
```

### **Update Profile**

```http
PUT /api/v1/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Updated",
  "email": "john.updated@example.com",
  "phone": "+1234567890"
}
```

### **Upload Avatar**

```http
PUT /api/v1/users/avatar
Authorization: Bearer <token>
Content-Type: multipart/form-data

avatar: [file]
```

### **Change Password**

```http
PUT /api/v1/users/update-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword123"
}
```

### **Address Management**

**Add Address:**

```http
POST /api/v1/users/address
Authorization: Bearer <token>
Content-Type: application/json

{
  "address": "123 Main St",
  "city": "New York",
  "postalCode": "10001",
  "country": "USA",
  "phoneNumber": "+1234567890",
  "isDefault": true
}
```

**Update Address:**

```http
PUT /api/v1/users/address/:addressId
Authorization: Bearer <token>
```

**Delete Address:**

```http
DELETE /api/v1/users/address/:addressId
Authorization: Bearer <token>
```

---

## 🛒 Cart Endpoints

### **Get Cart**

```http
GET /api/v1/users/cart
Authorization: Bearer <token>
```

**Response includes:**

- Auto-adjusted quantities based on stock
- Stock status for each item
- Price changes detection
- Out-of-stock item removal

### **Add to Cart**

```http
POST /api/v1/users/cart
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "product_id_here",
  "quantity": 2,
  "variation": {
    "size": "M",
    "color": "Blue",
    "sku": "PROD-M-BLUE"
  }
}
```

### **Calculate Cart Totals** (With Tax, Shipping, Discount)

```http
POST /api/v1/users/cart/calculate
Authorization: Bearer <token>
Content-Type: application/json

{
  "shippingAddress": {
    "address": "123 Main St",
    "city": "New York",
    "postalCode": "10001",
    "country": "USA"
  },
  "discountCode": "SAVE20"
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "itemsPrice": 100.0,
    "subtotal": 80.0,
    "tax": 8.0,
    "shipping": 9.99,
    "discount": 20.0,
    "total": 97.99,
    "taxDetails": {
      "rate": 10,
      "rateName": "Standard Tax",
      "taxableAmount": 80.0
    },
    "shippingDetails": {
      "rateName": "Standard Shipping",
      "type": "flat",
      "isFree": false
    },
    "discountDetails": {
      "code": "SAVE20",
      "type": "percentage",
      "value": 20
    }
  }
}
```

### **Update Cart Item**

```http
PUT /api/v1/users/cart/:productId
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 3,
  "variationSku": "PROD-M-BLUE"
}
```

### **Remove from Cart**

```http
DELETE /api/v1/users/cart/:productId?variationSku=PROD-M-BLUE
Authorization: Bearer <token>
```

### **Clear Cart**

```http
DELETE /api/v1/users/cart
Authorization: Bearer <token>
```

---

## ❤️ Favorites/Wishlist Endpoints

### **Get Favorites**

```http
GET /api/v1/users/favorites?page=1&limit=10
Authorization: Bearer <token>
```

### **Toggle Favorite**

```http
POST /api/v1/users/favorites
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "product_id_here"
}
```

### **Remove from Favorites**

```http
DELETE /api/v1/users/favorites/:productId
Authorization: Bearer <token>
```

---

## 📦 Product Endpoints

### **Get All Products** (Public)

```http
GET /api/v1/products?page=1&limit=10&sort=-createdAt&category=electronics&brand=apple
```

**Query Parameters:**

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `sort` - Sort field (prefix with `-` for descending)
- `category` - Filter by category slug/id
- `brand` - Filter by brand slug/id
- `search` or `q` - Search in name, description, tags
- `price[gte]` - Minimum price
- `price[lte]` - Maximum price
- `rating[gte]` - Minimum rating
- `featured` - Filter featured products
- `onSale` - Filter sale products

### **Search Products**

```http
GET /api/v1/products/search?q=laptop&limit=20
```

### **Get Featured Products**

```http
GET /api/v1/products/featured?limit=5
```

### **Get Sale Products**

```http
GET /api/v1/products/sale?limit=10
```

### **Get Single Product**

```http
GET /api/v1/products/:id
```

_Can use product ID or slug_

### **Create Product** (Admin)

```http
POST /api/v1/products
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

{
  "name": "Product Name",
  "description": "Product description",
  "price": 99.99,
  "category": "category_id",
  "brand": "brand_id",
  "countInStock": 100,
  "hasVariations": true,
  "variations": [
    {
      "size": "M",
      "color": "Blue",
      "sku": "PROD-M-BLUE",
      "price": 99.99,
      "countInStock": 50
    }
  ],
  "tags": ["electronics", "gadget"],
  "weight": 1.5,
  "weightUnit": "kg"
}
images: [files]
mainImage: [file]
```

### **Update Product** (Admin)

```http
PUT /api/v1/products/:id
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data
```

### **Delete Product** (Admin)

```http
DELETE /api/v1/products/:id
Authorization: Bearer <admin_token>
```

### **Bulk Update Products** (Admin)

```http
PATCH /api/v1/products/bulk
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "productIds": ["id1", "id2", "id3"],
  "updates": {
    "featured": true,
    "onSale": true
  }
}
```

### **Bulk Delete Products** (Admin)

```http
DELETE /api/v1/products/bulk
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "productIds": ["id1", "id2", "id3"]
}
```

### **Adjust Stock** (Admin)

```http
PATCH /api/v1/products/:id/stock
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "adjustment": -5,
  "reason": "Damaged inventory"
}
```

### **Adjust Variation Stock** (Admin)

```http
PATCH /api/v1/products/:id/variations/:variationId/stock
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "adjustment": 10,
  "reason": "New stock received"
}
```

### **Get Low Stock Products** (Admin)

```http
GET /api/v1/products/low-stock?threshold=10&includeVariations=true
Authorization: Bearer <admin_token>
```

### **Get Out of Stock Products** (Admin)

```http
GET /api/v1/products/out-of-stock?includeVariations=true
Authorization: Bearer <admin_token>
```

### **Get Product Statistics** (Admin)

```http
GET /api/v1/products/stats
Authorization: Bearer <admin_token>
```

---

## 📂 Category Endpoints

### **Get All Categories** (Public - Active Only)

```http
GET /api/v1/categories
```

### **Get All Categories** (Admin - All)

```http
GET /api/v1/categories/admin/all
Authorization: Bearer <admin_token>
```

### **Search Categories** (Public)

```http
GET /api/v1/categories/search?q=electronics
```

### **Search Categories** (Admin)

```http
GET /api/v1/categories/admin/search?q=electronics
Authorization: Bearer <admin_token>
```

### **Get Single Category**

```http
GET /api/v1/categories/:id
```

### **Create Category** (Admin)

```http
POST /api/v1/categories
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

{
  "name": "Electronics",
  "description": "Electronic items",
  "parentCategory": null,
  "isActive": true
}
image: [file]
```

### **Update Category** (Admin)

```http
PUT /api/v1/categories/:id
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data
```

### **Delete Category** (Admin)

```http
DELETE /api/v1/categories/:id
Authorization: Bearer <admin_token>
```

### **Toggle Active Status** (Admin)

```http
PUT /api/v1/categories/:id/toggle-active
Authorization: Bearer <admin_token>
```

---

## 🏷️ Brand Endpoints

### **Get All Brands** (Public - Active Only)

```http
GET /api/v1/brands
```

### **Get All Brands** (Admin - All)

```http
GET /api/v1/brands/admin/all
Authorization: Bearer <admin_token>
```

### **Search Brands** (Public)

```http
GET /api/v1/brands/search?q=apple
```

### **Search Brands** (Admin)

```http
GET /api/v1/brands/admin/search?q=apple
Authorization: Bearer <admin_token>
```

### **Get Single Brand**

```http
GET /api/v1/brands/:id
```

### **Create Brand** (Admin)

```http
POST /api/v1/brands
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

{
  "name": "Apple",
  "description": "Technology company",
  "website": "https://apple.com ",
  "isActive": true
}
logo: [file]
```

### **Update Brand** (Admin)

```http
PUT /api/v1/brands/:id
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data
```

### **Delete Brand** (Admin)

```http
DELETE /api/v1/brands/:id
Authorization: Bearer <admin_token>
```

### **Toggle Active Status** (Admin)

```http
PUT /api/v1/brands/:id/toggle-active
Authorization: Bearer <admin_token>
```

---

## ⭐ Review Endpoints

### **Get All Reviews** (Public)

```http
GET /api/v1/reviews?product=product_id&page=1&limit=10
```

### **Get Review by ID**

```http
GET /api/v1/reviews/:id
```

### **Get My Reviews**

```http
GET /api/v1/reviews/my-reviews?page=1&verified=true&rating=5
Authorization: Bearer <token>
```

### **Get Product Review Stats**

```http
GET /api/v1/reviews/stats/:productId
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "total": 150,
    "avgRating": 4.3,
    "breakdown": [
      { "rating": 5, "count": 80, "percentage": 53.3 },
      { "rating": 4, "count": 40, "percentage": 26.7 },
      { "rating": 3, "count": 20, "percentage": 13.3 },
      { "rating": 2, "count": 7, "percentage": 4.7 },
      { "rating": 1, "count": 3, "percentage": 2.0 }
    ]
  }
}
```

### **Create Review**

```http
POST /api/v1/reviews
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "product": "product_id",
  "rating": 5,
  "title": "Great product!",
  "comment": "Really satisfied with this purchase"
}
images: [files] (max 5)
```

### **Update Review**

```http
PUT /api/v1/reviews/:id
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "rating": 4,
  "comment": "Updated comment",
  "existingImages": ["img1.jpg", "img2.jpg"]
}
images: [new files]
```

### **Delete Review**

```http
DELETE /api/v1/reviews/:id
Authorization: Bearer <token>
```

### **Vote Review Helpful**

```http
POST /api/v1/reviews/:id/helpful
Authorization: Bearer <token>
```

---

## 📦 Order Endpoints

### **Create Order**

```http
POST /api/v1/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderItems": [
    {
      "product": "product_id",
      "name": "Product Name",
      "quantity": 2,
      "price": 99.99,
      "image": "/uploads/products/image.jpg",
      "variation": {
        "size": "M",
        "sku": "PROD-M-BLUE"
      }
    }
  ],
  "shippingAddress": {
    "address": "123 Main St",
    "city": "New York",
    "postalCode": "10001",
    "country": "USA",
    "phoneNumber": "+1234567890"
  },
  "paymentMethod": "card",
  "itemsPrice": 199.98,
  "subtotal": 179.98,
  "taxPrice": 18.00,
  "shippingPrice": 9.99,
  "totalPrice": 207.97,
  "discountAmount": 20.00,
  "discountCode": "SAVE20",
  "notes": "Please deliver after 5 PM"
}
```

**Features:**

- Validates stock availability
- Validates prices
- Adjusts stock automatically
- Clears user cart
- Records discount usage
- Generates unique order number

### **Get My Orders**

```http
GET /api/v1/orders/myorders?page=1&limit=10&status=delivered
Authorization: Bearer <token>
```

### **Get Order by ID/Number**

```http
GET /api/v1/orders/:id
Authorization: Bearer <token>
```

_Can use order ID or order number (e.g., ORD-240115-A1B2C3)_

### **Get All Orders** (Admin)

```http
GET /api/v1/orders?page=1&limit=15&status=processing&isPaid=true
Authorization: Bearer <admin_token>
```

### **Search Orders**

```http
GET /api/v1/orders/search?q=ORD-240115
Authorization: Bearer <token>
```

### **Update Order to Paid**

```http
PUT /api/v1/orders/:id/pay
Authorization: Bearer <token>
Content-Type: application/json

{
  "id": "payment_transaction_id",
  "status": "completed",
  "update_time": "2024-01-15T10:30:00Z",
  "email_address": "customer@example.com",
  "payment_method": "card",
  "transaction_fee": 2.99
}
```

### **Update Order Status** (Admin)

```http
PUT /api/v1/orders/:id/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "shipped",
  "note": "Order shipped via FedEx",
  "adminNotes": "Internal notes here",
  "shippingInfo": {
    "carrier": "FedEx",
    "trackingNumber": "123456789",
    "estimatedDeliveryDate": "2024-01-20T00:00:00Z"
  }
}
```

**Valid Status Transitions:**

- `pending` → `processing`, `cancelled`, `on-hold`, `failed`
- `processing` → `shipped`, `cancelled`, `on-hold`
- `shipped` → `delivered`, `on-hold`
- `delivered` → `completed`, `refunded`
- `on-hold` → `processing`, `cancelled`

### **Mark as Delivered** (Admin)

```http
PUT /api/v1/orders/:id/deliver
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "note": "Package delivered successfully"
}
```

### **Add Tracking Info** (Admin)

```http
PUT /api/v1/orders/:id/tracking
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "carrier": "FedEx",
  "trackingNumber": "123456789",
  "estimatedDeliveryDate": "2024-01-20T00:00:00Z"
}
```

### **Cancel Order**

```http
PUT /api/v1/orders/:id/cancel
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Changed my mind"
}
```

_Automatically restores stock for all items_

### **Get User Order Statistics**

```http
GET /api/v1/orders/user-stats
Authorization: Bearer <token>
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "totalOrders": 15,
    "totalSpent": 1250.50,
    "paidOrdersCount": 12,
    "averageOrderValue": 104.21,
    "statusCounts": {
      "pending": 1,
      "processing": 2,
      "shipped": 3,
      "delivered": 8,
      "completed": 1
    },
    "recentOrders": [...]
  }
}
```

### **Get Order Analytics** (Admin)

```http
GET /api/v1/orders/analytics?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <admin_token>
```

**Comprehensive Analytics Including:**

- Overview (total orders, revenue, AOV)
- Period analysis with growth rates
- Quick stats (24h, 7d, 30d)
- Daily/monthly revenue trends
- Top selling products
- Category/brand performance
- Customer statistics
- Repeat customer rate
- Fulfillment metrics
- Payment method breakdown
- Shipping statistics
- Discount usage
- Refund statistics
- Tax collected
- Status distribution

### **Export Orders** (Admin)

```http
GET /api/v1/orders/export?startDate=2024-01-01&endDate=2024-01-31&status=completed
Authorization: Bearer <admin_token>
```

**Returns formatted data for CSV/Excel export**

---

## 🔧 Admin Settings Endpoints

### **Get Public Settings** (For Cart)

```http
GET /api/v1/admin-settings/public
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "taxEnabled": true,
    "taxRates": [...],
    "shippingEnabled": true,
    "shippingRates": [...],
    "freeShippingEnabled": true,
    "freeShippingThreshold": 100,
    "storeCurrency": "USD",
    "minimumOrderAmount": 0
  }
}
```

### **Get All Settings** (Admin)

```http
GET /api/v1/admin-settings
Authorization: Bearer <admin_token>
```

### **Update General Settings** (Admin)

```http
PUT /api/v1/admin-settings/general
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "storeName": "My Store",
  "storeEmail": "admin@mystore.com",
  "storeCurrency": "USD",
  "storeTimezone": "UTC",
  "maintenanceMode": false
}
```

### **Tax Rate Management** (Admin)

**Add Tax Rate:**

```http
POST /api/v1/admin-settings/tax
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "California Tax",
  "rate": 9.5,
  "country": "USA",
  "state": "California",
  "isDefault": false,
  "isActive": true
}
```

**Update Tax Rate:**

```http
PUT /api/v1/admin-settings/tax/:id
Authorization: Bearer <admin_token>
```

**Delete Tax Rate:**

```http
DELETE /api/v1/admin-settings/tax/:id
Authorization: Bearer <admin_token>
```

**Toggle Tax Enabled:**

```http
PUT /api/v1/admin-settings/tax/toggle
Authorization: Bearer <admin_token>
```

### **Shipping Rate Management** (Admin)

**Add Shipping Rate:**

```http
POST /api/v1/admin-settings/shipping
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Express Shipping",
  "type": "flat",
  "flatRate": 19.99,
  "freeShippingThreshold": 200,
  "isActive": true
}
```

**Update Shipping Rate:**

```http
PUT /api/v1/admin-settings/shipping/:id
Authorization: Bearer <admin_token>
```

**Delete Shipping Rate:**

```http
DELETE /api/v1/admin-settings/shipping/:id
Authorization: Bearer <admin_token>
```

**Toggle Shipping Enabled:**

```http
PUT /api/v1/admin-settings/shipping/toggle
Authorization: Bearer <admin_token>
```

### **Discount Code Management** (Admin)

**Add Discount Code:**

```http
POST /api/v1/admin-settings/discount
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "code": "SAVE20",
  "type": "percentage",
  "value": 20,
  "minOrderAmount": 50,
  "maxDiscountAmount": 100,
  "usageLimit": 100,
  "perUserLimit": 1,
  "validFrom": "2024-01-01T00:00:00Z",
  "validUntil": "2024-12-31T23:59:59Z",
  "applicableCategories": ["cat1", "cat2"],
  "excludedProducts": ["prod1"]
}
```

**Update Discount Code:**

```http
PUT /api/v1/admin-settings/discount/:id
Authorization: Bearer <admin_token>
```

**Delete Discount Code:**

```http
DELETE /api/v1/admin-settings/discount/:id
Authorization: Bearer <admin_token>
```

### **Validate Discount Code**

```http
POST /api/v1/admin-settings/discount/validate
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "SAVE20",
  "orderAmount": 150.00,
  "products": ["prod1", "prod2"],
  "categories": ["cat1", "cat2"]
}
```

---

## 👮 Admin User Management Endpoints

### **Get All Users** (Admin)

```http
GET /api/v1/admin/users?page=1&limit=10&status=active&role=user&keyword=john
Authorization: Bearer <admin_token>
```

### **Get User by ID** (Admin)

```http
GET /api/v1/admin/users/:id
Authorization: Bearer <admin_token>
```

### **Ban User** (Admin)

```http
PUT /api/v1/admin/users/:id/ban
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "reason": "Violation of terms of service"
}
```

### **Suspend User** (Admin)

```http
PUT /api/v1/admin/users/:id/suspend
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "reason": "Suspicious activity"
}
```

### **Unban User** (Admin)

```http
PUT /api/v1/admin/users/:id/unban
Authorization: Bearer <admin_token>
```

### **Update User Role** (Admin)

```http
PUT /api/v1/admin/users/:id/role
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "role": "admin"
}
```

### **Delete User** (Admin)

```http
DELETE /api/v1/admin/users/:id
Authorization: Bearer <admin_token>
```

### **Get User Reviews** (Admin)

```http
GET /api/v1/admin/users/:id/reviews?page=1&limit=10
Authorization: Bearer <admin_token>
```

### **Get User Orders** (Admin)

```http
GET /api/v1/admin/users/:id/orders?page=1&limit=10
Authorization: Bearer <admin_token>
```

### **Get All Reviews** (Admin)

```http
GET /api/v1/admin/reviews?page=1&limit=10&rating=5&user=userId
Authorization: Bearer <admin_token>
```

### **Delete Review** (Admin)

```http
DELETE /api/v1/admin/reviews/:id
Authorization: Bearer <admin_token>
```

---

## 🎯 Core Features Deep Dive

### **Dynamic Pricing Engine**

The system includes a sophisticated pricing calculator that handles:

1. **Tax Calculation**:

   - Location-based tax rates (country, state, city, postal code)
   - Priority-based rate selection
   - Configurable tax inclusion/exclusion
   - Default rate fallback

2. **Shipping Calculation**:

   - Flat rate, weight-based, or price-based shipping
   - Free shipping thresholds
   - Per-rate free shipping rules
   - Active rate selection

3. **Discount Validation**:
   - Complex validation rules including:
     - Time-based validity
     - Minimum order amounts
     - Global and per-user usage limits
     - Product/category applicability
     - Product/category exclusions
     - Max discount caps
   - Usage tracking per user

### **Stock Management System**

- **Multi-level Stock**: Tracks stock at both product and variation levels
- **Atomic Updates**: Uses MongoDB transactions for order creation/cancellation
- **Auto-adjustment**: Cart automatically adjusts quantities based on available stock
- **Low Stock Alerts**: Admin endpoints to identify products needing restocking
- **Out-of-Stock Detection**: Comprehensive reporting for inventory planning

### **Order Lifecycle**

The order system implements a complete state machine:

```typescript
// Order Status Flow
pending → processing → shipped → delivered → completed
   ↓          ↓           ↓          ↓
cancelled  on-hold    refunded   cancelled
   ↓                     ↑
failed ←─────────────────┘
```

- **Status History**: Every status change is logged with timestamps and notes
- **Validation**: Prevents invalid status transitions (e.g., completed → pending)
- **Stock Impact**: Status changes appropriately adjust inventory
- **Notifications**: Status changes can trigger email notifications

### **User Status System**

Beyond basic authentication, users have a status field enabling:

- **Active**: Normal operation
- **Banned**: Permanent restriction with reason tracking
- **Suspended**: Temporary restriction with automatic expiration

**Status checks occur on every protected route**, immediately blocking banned/suspended users.

### **Image Management**

- **Multiple Upload Types**: Products, categories, brands, reviews, and avatars
- **File Validation**: MIME type and size restrictions
- **Automatic Cleanup**: Old images deleted when replaced
- **Path Handling**: Supports both local paths and external URLs
- **Organization**: Separate folders per entity type

---

## 🔐 Security Features

### **Authentication & Authorization**

- **JWT Tokens**: Secure, stateless authentication
- **Password Hashing**: bcryptjs with salt rounds
- **Email Verification**: Required before full account access
- **Password Reset**: Token-based with 10-minute expiration
- **Role-Based Access Control**: Middleware protects admin routes
- **User Status Checks**: Automatic blocking of banned/suspended users

### **Input Validation**

- **express-validator**: Comprehensive validation on all inputs
- **Sanitization**: Automatic trimming and normalization
- **MongoID Validation**: Prevents NoSQL injection
- **File Type Validation**: Restricts upload types
- **Rate Limiting**: Prevents abuse (see Rate Limiting section)

### **Data Protection**

- **Environment Variables**: Sensitive data never committed
- **Helmet**: Security headers
- **CORS**: Configurable cross-origin policies
- **Error Messages**: Non-revealing error responses in production
- **Token Expiration**: JWT expires in 30 days (configurable)

### **Payment Security**

- **Backend Calculation**: All prices recalculated server-side
- **Price Validation**: Frontend totals verified against backend
- **Stock Validation**: Prevents overselling
- **Transaction Support**: MongoDB sessions ensure atomic operations

---

## ⚠️ Error Handling

The application implements a multi-layer error handling strategy:

### **1. Validation Errors**

```json
{
  "status": "fail",
  "errors": [
    {
      "msg": "Invalid email format",
      "param": "email",
      "location": "body"
    }
  ]
}
```

### **2. Operational Errors**

```json
{
  "status": "error",
  "message": "User not found"
}
```

### **3. Stock Errors** (Detailed)

```json
{
  "status": "error",
  "message": "Cannot complete order. 2 item(s) do not have sufficient stock.",
  "stockErrors": [
    {
      "product": "Blue T-Shirt (Size: M)",
      "requested": 5,
      "available": 2
    }
  ]
}
```

### **4. Development vs Production**

- **Development**: Full error stack traces
- **Production**: Minimal error information

### **5. Error Types Handled**

- Validation errors
- Authentication errors
- Authorization errors
- Resource not found
- Duplicate entries (MongoDB 11000)
- Cast errors (invalid ObjectId)
- File upload errors
- Rate limit exceeded
- Payment processing errors

---

## 🚦 Rate Limiting

The API implements sophisticated rate limiting using `express-rate-limit`:

### **Rate Limit Configurations**

```typescript
// Authentication
AUTH_LOGIN: 5 attempts per 15 minutes
AUTH_REGISTER: 3 attempts per hour
AUTH_FORGOT_PASSWORD: 3 attempts per hour

// User Operations
PROFILE_UPDATE: 10 per 15 minutes
PASSWORD_CHANGE: 3 per hour
CART_OPERATIONS: 100 per 15 minutes
FAVORITES_OPERATIONS: 50 per 15 minutes

// Orders
ORDER_CREATION: 5 per 15 minutes (admin skip)
ORDER_PAYMENT: 10 per 15 minutes
ORDER_CANCEL: 5 per 15 minutes

// Admin
ADMIN_ORDER_OPERATIONS: 100 per 15 minutes

// Products
PRODUCT_REVIEW: 10 per hour
PRODUCT_CREATE: 20 per hour (admin skip)

// General
GENERAL_API: 1000 per 15 minutes
STRICT_API: 100 per 15 minutes
```

### **Rate Limit Response**

```json
{
  "status": "error",
  "message": "Too many login attempts, please try again after 15 minutes",
  "retryAfter": 900
}
```

### **Admin Bypass**

Admin users are automatically exempt from most rate limits via `skipFunction`.

---

## 🧪 Testing

### **Manual Testing with Postman**

1. **Import Collection**: Create a Postman collection from the API docs
2. **Environment Variables**: Set up Postman environment for:
   - `baseUrl`: `http://localhost:5000/api/v1`
   - `authToken`: Bearer token from login
3. **Test Flow**:
   - Register → Verify Email → Login
   - Create Category/Brand → Create Product
   - Add to Cart → Calculate Totals → Create Order
   - Update Order Status → Cancel Order
   - Write Review → Vote Helpful

### **Automated Testing Setup**

```bash
# Install testing dependencies
npm install --save-dev jest supertest @types/jest ts-jest

# Create jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
};

# Example test structure
/tests/
  ├── auth.test.ts
  ├── product.test.ts
  ├── order.test.ts
  └── admin.test.ts
```

**Sample Test Pattern:**

```typescript
import request from "supertest";
import app from "../index";
import User from "../models/userModel";

describe("Authentication", () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  it("should register a new user", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "Password123",
    });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("success");
    expect(res.body.data).toHaveProperty("token");
  });
});
```

### **Test Commands**

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

---

## 🚀 Deployment

### **1. Environment Preparation**

```bash
# Production environment variables
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/ecommerce?retryWrites=true&w=majority
JWT_SECRET=very_long_random_string
EMAIL_USER=production-email@gmail.com
EMAIL_PASS=app-specific-password
FRONTEND_BASE_URL=https://your-frontend.com
```

### **2. Build Process**

```bash
# Clean build
npm run clean
npm run build

# Verify dist/ directory is created
ls -la dist/
```

### **3. PM2 Process Manager**

```bash
# Install PM2 globally
npm install -g pm2

# Start application with PM2
pm2 start dist/index.js --name ecommerce-api

# Save PM2 configuration
pm2 save
pm2 startup

# Monitor
pm2 status
pm2 logs ecommerce-api
pm2 monit
```

### **4. Docker Deployment**

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built application
COPY dist ./dist
COPY uploads ./uploads

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 5000

CMD ["node", "dist/index.js"]
```

```bash
# Build and run
docker build -t ecommerce-api .
docker run -d -p 5000:5000 --env-file .env ecommerce-api
```

### **5. Nginx Reverse Proxy**

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS headers
        add_header Access-Control-Allow-Origin "https://your-frontend.com";
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization";
    }

    # Static files caching
    location /uploads/ {
        alias /path/to/your/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### **6. Cloud Deployment (Heroku Example)**

```bash
# Login to Heroku
heroku login

# Create app
heroku create your-ecommerce-api

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGO_URI="your_connection_string"
heroku config:set JWT_SECRET="your_secret"
# ... set all other variables

# Deploy
git push heroku main

# View logs
heroku logs --tail --app your-ecommerce-api
```

### **7. SSL/TLS with Let's Encrypt**

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renew
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 🎉 Acknowledgments

- Node.js community for excellent packages
- MongoDB for flexible database solution
- TypeScript team for type safety
- All contributors who help improve this project

---

**Made with ❤️ by [Abdelaziz79](https://github.com/Abdelaziz79)**

---
