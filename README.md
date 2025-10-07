# E-Commerce REST API

A robust and scalable RESTful API for an e-commerce platform built with Node.js, Express, TypeScript, and MongoDB. This API provides a complete backend solution for managing users, products, categories, brands, reviews, and orders.

## ✨ Features

- **Authentication**: Secure JWT-based authentication (Login, Register) with email verification and password reset functionality.
- **User Management**: Complete user profile management including addresses, favorites/wishlist, and cart.
- **Product Management**: Full CRUD operations for products, including complex features like variations, sale prices, and related products.
- **Categorization**: Dedicated CRUD for product categories and brands, allowing for a structured product catalog.
- **Reviews & Ratings**: Users can review products, and ratings are automatically calculated and aggregated.
- **Order Processing**: A comprehensive order management system with transactional stock updates, order tracking, and status history.
- **Advanced Backend Features**:
  - **API Caching & Filtering**: Advanced filtering, sorting, pagination, and field limiting for all major resources.
  - **Security**: Implemented with `helmet`, CORS, and robust validation.
  - **Rate Limiting**: Protects the API from brute-force and denial-of-service attacks on critical endpoints.
  - **Admin Dashboard**: Separate endpoints for admin-specific actions like fetching all users, managing orders, and viewing analytics.
  - **Transactional Integrity**: Uses MongoDB sessions to ensure atomic operations for critical actions like creating an order and updating stock.

## 🚀 Tech Stack

- **Backend**: Node.js, Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JSON Web Tokens (JWT)
- **Validation**: `express-validator`
- **Security**: `helmet`, `cors`, `express-rate-limit`
- **Email**: `nodemailer`

## 📂 Project Structure

```
src
├── config/                  # Environment variables, database connection
├── controllers/             # Request handlers and business logic
├── middleware/              # Express middleware (auth, error handling, validation, rate limiting)
├── models/                  # Mongoose models and schemas
├── routes/                  # API route definitions
├── services/                # (Optional) Business logic extraction
├── types/                   # TypeScript type definitions
├── utils/                   # Utility functions (API Features, email service, etc.)
└── index.ts                 # Main application entry point
```

## ⚙️ Setup and Installation

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MongoDB (can be run locally or using a cloud service like MongoDB Atlas)
- (Optional) Docker and Docker Compose for easy database setup.

### Installation Steps

1.  **Clone the repository:**

    ```bash
    git clone <your-repo-url>
    cd <repo-name>
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add the following variables. Replace the placeholder values with your actual configuration.

    ```ini
    # .env

    # Server Configuration
    NODE_ENV=development
    PORT=5000
    BASE_URL=http://localhost:5000

    # MongoDB Configuration
    # Example for local MongoDB with replica set for transactions
    MONGO_URI=mongodb://mongodb:27017/ecommerce?replicaSet=rs0

    # JWT Configuration
    JWT_SECRET=your_super_secret_jwt_key
    JWT_EXPIRES_IN=30d

    # Email Configuration (using Nodemailer with a Gmail App Password)
    EMAIL_USER=your_email@gmail.com
    EMAIL_PASS=your_gmail_app_password
    EMAIL_FROM="Your App Name"

    # Frontend URL (for email links)
    FRONTEND_BASE_URL=http://localhost:3000
    ```

4.  **Start the server:**

    ```bash
    # For development with live reloading
    npm run dev

    # For production
    npm run build
    npm start
    ```

The API will be running at `http://localhost:5000`.

## API Endpoints

All endpoints are prefixed with `/api/v1`.

### Authentication (`/auth`)

| Method | Endpoint                 | Description                        | Access |
| :----- | :----------------------- | :--------------------------------- | :----- |
| `POST` | `/login`                 | Log in a user and get a JWT token. | Public |
| `POST` | `/register`              | Register a new user.               | Public |
| `GET`  | `/verify-email/:token`   | Verify a user's email address.     | Public |
| `POST` | `/forgot-password`       | Request a password reset email.    | Public |
| `POST` | `/reset-password/:token` | Reset password with a valid token. | Public |

### Users (`/users`)

| Method   | Endpoint                | Description                           | Access  |
| :------- | :---------------------- | :------------------------------------ | :------ |
| `GET`    | `/profile`              | Get the logged-in user's profile.     | Private |
| `PUT`    | `/profile`              | Update the logged-in user's profile.  | Private |
| `PUT`    | `/update-password`      | Update the logged-in user's password. | Private |
| `POST`   | `/address`              | Add a new shipping address.           | Private |
| `PUT`    | `/address/:addressId`   | Update a shipping address.            | Private |
| `DELETE` | `/address/:addressId`   | Delete a shipping address.            | Private |
| `GET`    | `/cart`                 | Get the user's shopping cart.         | Private |
| `POST`   | `/cart`                 | Add an item to the cart.              | Private |
| `DELETE` | `/cart`                 | Clear the entire cart.                | Private |
| `PUT`    | `/cart/:productId`      | Update quantity of a cart item.       | Private |
| `DELETE` | `/cart/:productId`      | Remove an item from the cart.         | Private |
| `GET`    | `/favorites`            | Get the user's favorites/wishlist.    | Private |
| `POST`   | `/favorites`            | Add a product to favorites.           | Private |
| `DELETE` | `/favorites/:productId` | Remove a product from favorites.      | Private |
| `GET`    | `/`                     | Get all users (paginated).            | Admin   |

### Categories (`/categories`)

| Method   | Endpoint | Description            | Access |
| :------- | :------- | :--------------------- | :----- |
| `GET`    | `/`      | Get all categories.    | Public |
| `GET`    | `/:id`   | Get a single category. | Public |
| `POST`   | `/`      | Create a new category. | Admin  |
| `PUT`    | `/:id`   | Update a category.     | Admin  |
| `DELETE` | `/:id`   | Delete a category.     | Admin  |

### Brands (`/brands`)

| Method   | Endpoint | Description         | Access |
| :------- | :------- | :------------------ | :----- |
| `GET`    | `/`      | Get all brands.     | Public |
| `GET`    | `/:id`   | Get a single brand. | Public |
| `POST`   | `/`      | Create a new brand. | Admin  |
| `PUT`    | `/:id`   | Update a brand.     | Admin  |
| `DELETE` | `/:id`   | Delete a brand.     | Admin  |

### Products (`/products`)

| Method   | Endpoint    | Description            | Access |
| :------- | :---------- | :--------------------- | :----- |
| `GET`    | `/`         | Get all products.      | Public |
| `GET`    | `/:id`      | Get a single product.  | Public |
| `GET`    | `/featured` | Get featured products. | Public |
| `GET`    | `/sale`     | Get products on sale.  | Public |
| `POST`   | `/`         | Create a new product.  | Admin  |
| `PUT`    | `/:id`      | Update a product.      | Admin  |
| `DELETE` | `/:id`      | Delete a product.      | Admin  |

### Reviews (`/reviews`)

| Method   | Endpoint | Description                              | Access  |
| :------- | :------- | :--------------------------------------- | :------ |
| `GET`    | `/`      | Get all reviews (can filter by product). | Public  |
| `GET`    | `/:id`   | Get a single review.                     | Public  |
| `POST`   | `/`      | Create a new review.                     | Private |
| `PUT`    | `/:id`   | Update your own review.                  | Private |
| `DELETE` | `/:id`   | Delete a review (owner or admin).        | Private |

### Orders (`/orders`)

| Method | Endpoint       | Description                            | Access  |
| :----- | :------------- | :------------------------------------- | :------ |
| `POST` | `/`            | Create a new order.                    | Private |
| `GET`  | `/myorders`    | Get all orders for the logged-in user. | Private |
| `GET`  | `/:id`         | Get an order by ID or order number.    | Private |
| `PUT`  | `/:id/pay`     | Update an order to paid.               | Private |
| `PUT`  | `/:id/cancel`  | Cancel an order.                       | Private |
| `GET`  | `/`            | Get all orders in the system.          | Admin   |
| `GET`  | `/analytics`   | Get order analytics.                   | Admin   |
| `PUT`  | `/:id/status`  | Update an order's status.              | Admin   |
| `PUT`  | `/:id/deliver` | Mark an order as delivered.            | Admin   |

---
