# E-Commerce API

A comprehensive RESTful API for e-commerce applications built with Node.js, Express, TypeScript, and MongoDB. This backend service provides all the necessary endpoints for building a full-featured e-commerce platform, including user authentication, product management, order processing, and more.

## Overview

This API is designed to support a full-featured e-commerce application with a focus on:

- **Scalability**: Built with a modular architecture that can scale with your business
- **Security**: Implements best practices for authentication, authorization, and data protection
- **Performance**: Optimized database queries and response handling
- **Maintainability**: Well-organized codebase with TypeScript for type safety
- **Extensibility**: Easy to add new features and integrate with third-party services

## Features

### Authentication & User Management

- Complete user authentication system with JWT
- User registration with email verification
- Secure password reset functionality
- Role-based access control (Admin/User)
- User profile management

### Product Management

- Comprehensive product CRUD operations
- Advanced filtering, sorting, and pagination
- Product categories and brands
- Product variations (size, color, etc.)
- Featured and on-sale product listings
- Product reviews and ratings system

### Order Management

- Complete order processing workflow
- Multiple payment method support
- Order status tracking and history
- Shipping information management
- Order cancellation and refund handling
- Discount and coupon support

### Security

- Input validation and sanitization
- Password hashing with bcrypt
- Protection against common web vulnerabilities
- CORS and Helmet security headers

### Email Notifications

- Transactional email support
- Email verification
- Password reset emails
- Order confirmation and updates

## Tech Stack

### Core

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM

### Authentication & Security

- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **API Security**: Helmet (HTTP headers security)
- **CORS**: Cross-Origin Resource Sharing support

### Validation & Error Handling

- **Input Validation**: Express Validator
- **Error Handling**: Custom middleware for consistent error responses
- **Async Handler**: Utility for handling async errors

### Email & Notifications

- **Email Service**: Nodemailer with Gmail transport
- **HTML Emails**: Custom HTML templates for transactional emails

### Development & Logging

- **Development Server**: Nodemon for hot reloading
- **Logging**: Morgan HTTP request logger
- **Environment Variables**: dotenv for configuration management
- **TypeScript**: Strong typing with interfaces and types

## Project Structure

```
├── src/
│   ├── config/         # Configuration files
│   │   ├── db.ts       # Database connection
│   │   └── logger.ts   # Logging configuration
│   ├── controllers/    # Request controllers
│   │   ├── authController.ts    # Authentication logic
│   │   ├── orderController.ts   # Order management
│   │   ├── productController.ts # Product operations
│   │   └── userController.ts    # User management
│   ├── middleware/     # Custom middleware
│   │   ├── authMiddleware.ts    # Authentication & authorization
│   │   ├── errorMiddleware.ts   # Error handling
│   │   ├── orderValidationMiddleware.ts # Order validation
│   │   ├── productValidationMiddleware.ts # Product validation
│   │   └── userValidationMiddleware.ts # User input validation
│   ├── models/         # Mongoose models
│   │   ├── orderModel.ts    # Order schema
│   │   ├── productModel.ts  # Product schema
│   │   └── userModel.ts     # User schema
│   ├── routes/         # API routes
│   │   ├── authRoutes.ts    # Authentication routes
│   │   ├── orderRoutes.ts   # Order routes
│   │   ├── productRoutes.ts # Product routes
│   │   └── userRoutes.ts    # User routes
│   ├── services/       # Business logic services
│   │   ├── emailService.ts  # Email sending functionality
│   │   └── tokenService.ts  # JWT token management
│   ├── types/          # TypeScript type definitions
│   │   ├── order.types.ts   # Order-related types
│   │   ├── product.types.ts # Product-related types
│   │   └── user.types.ts    # User-related types
│   ├── utils/          # Utility functions
│   │   ├── asyncHandler.ts  # Async error handling
│   │   ├── generateToken.ts # JWT token generation
│   │   └── validators.ts    # Common validation functions
│   └── index.ts        # App entry point
├── .env                # Environment variables
├── .gitignore         # Git ignore file
├── package.json       # Project dependencies
├── tsconfig.json      # TypeScript configuration
└── README.md          # Project documentation
```

## API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Authenticate user & get token
- `GET /api/v1/auth/verify-email/:token` - Verify user email
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password/:token` - Reset user password

### Users

- `GET /api/v1/users/profile` - Get user profile (Protected)
- `PUT /api/v1/users/profile` - Update user profile (Protected)
- `GET /api/v1/users` - Get all users (Admin only)
- `GET /api/v1/users/:id` - Get user by ID (Admin only)
- `PUT /api/v1/users/:id` - Update user (Admin only)
- `DELETE /api/v1/users/:id` - Delete user (Admin only)

### Products

- `GET /api/v1/products` - Get all products with filtering, sorting, and pagination
- `GET /api/v1/products/featured` - Get featured products
- `GET /api/v1/products/sale` - Get products on sale
- `GET /api/v1/products/:id` - Get a single product by ID or slug
- `POST /api/v1/products` - Create a product (Admin only)
- `PUT /api/v1/products/:id` - Update a product (Admin only)
- `DELETE /api/v1/products/:id` - Delete a product (Admin only)
- `POST /api/v1/products/:id/reviews` - Create product review (Protected)
- `GET /api/v1/products/:id/reviews` - Get product reviews

### Orders

- `POST /api/v1/orders` - Create new order (Protected)
- `GET /api/v1/orders/myorders` - Get logged in user orders (Protected)
- `GET /api/v1/orders` - Get all orders (Admin only)
- `GET /api/v1/orders/:id` - Get order by ID or order number (Protected)
- `PUT /api/v1/orders/:id/pay` - Update order to paid (Protected)
- `PUT /api/v1/orders/:id/deliver` - Update order to delivered (Admin only)
- `PUT /api/v1/orders/:id/status` - Update order status (Admin only)
- `PUT /api/v1/orders/:id/tracking` - Add tracking information (Admin only)
- `PUT /api/v1/orders/:id/cancel` - Cancel order (Protected)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local instance or MongoDB Atlas)
- npm or yarn

### Installation

1. Clone the repository

   ```bash
   git clone <repository-url>
   cd e-commerce/backend
   ```

2. Install dependencies

   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables

   - Create a `.env` file in the root directory based on `.env.example`
   - Configure your MongoDB connection, JWT secrets, and email settings

4. Build the TypeScript code

   ```bash
   npm run build
   # or
   yarn build
   ```

5. Run the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Server Configuration
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000
CLIENT_URL=http://localhost:3000

# Database Configuration
MONGO_URI=your_mongodb_connection_string

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30

# Email Configuration (for password reset and email verification)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password

# Optional: Payment Gateway Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

### API Testing

You can test the API endpoints using tools like Postman or Insomnia. A comprehensive Postman collection and environment are included in this repository for quick setup:

1. Open Postman
2. Import the collection file from `docs/postman/e-commerce-api.postman_collection.json`
3. Import the environment file from `docs/postman/e-commerce-api.postman_environment.json`
4. Select the "E-Commerce API Environment" from the environment dropdown in Postman

#### Using the Postman Collection

The collection is organized into four main folders:

1. **Authentication** - Register, login, verify email, and reset password
2. **Users** - User profile, addresses, cart, favorites, and order history
3. **Products** - Browse, search, and manage products and reviews
4. **Orders** - Create and manage orders

The environment includes the following variables that are used throughout the requests:

- `baseUrl`: Set to your API URL (default: `http://localhost:5000/api/v1`)
- `token`: Automatically populated when you use the Login endpoint
- `userId`, `productId`, `orderId`, `addressId`: Can be set as you create resources

To get started:

1. Use the "Register User" request to create an account
2. Use the "Login User" request to authenticate (this will automatically set your token)
3. Explore the other endpoints as needed

### Running in Production

To run the server in production mode:

```bash
# Build the TypeScript code
npm run build

# Start the production server
npm start
```

## Error Handling

The API uses a consistent error handling approach:

- All errors return a standardized JSON response format
- HTTP status codes are used appropriately (400, 401, 403, 404, 500, etc.)
- Validation errors include detailed information about what failed
- Custom error classes extend the base Error class for specific error types

Example error response:

```json
{
  "success": false,
  "error": {
    "statusCode": 400,
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Please enter a valid email address"
      }
    ]
  }
}
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication:

- Tokens are issued at login and user registration
- Protected routes require a valid token in the Authorization header
- Tokens expire after the configured time period
- Role-based access control for admin-only routes

## Documentation

API documentation is available at the following endpoints:

- Swagger UI: `/api-docs`
- API Specification: `/api-docs.json`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

## Author

Your Name
