# User Product and Cart Management API

## Description

This is a Node.js project using Express.js for building RESTful APIs. The project includes functionalities such as user authentication, JWT-based authorization, OTP generation and verification, shopping cart management, product management, and email notifications. It uses MySQL for database management, bcrypt for secure password hashing, and dotenv for managing environment variables. The project also implements rate limiting to prevent abuse and uses Speakeasy for generating and verifying one-time passwords (OTPs).

## Features

`User Registration`: Register a new user with hashed password.

`Login`: JWT-based authentication for user login.

`Change Password`: Allow users to change their password.

`Request a New OTP`: Generate a new OTP for user login.

`View Products`: Display a list of available products.

`Add Products`: Admin users can add new products (email notification sent to users with notifications enabled).

`Edit Products`: Admin users can edit existing products.

`Delete Products`: Admin users can delete products.

`Set Notification`: Preferences: Users can enable or disable email notifications for product updates.

`Carts`:

`Add Products to Cart`: Users can add products to their cart.

`Edit Products in Cart`: Users can update product quantities in the cart.

`Delete Products from Cart`: Users can remove products from their cart.

`View Products in Cart`: Display the list of products in the user's cart.

`Authentication`: Secure login using JWT.

`Authorization`: Role-based access control (Admin, Employee, Customer) to restrict access to certain endpoints.

## Technologies

`Node.js`: JavaScript runtime for the backend.

`Express.js`: Web framework for building APIs.

`MySQL`: Database for storing user and product information.

`JWT`: Token-based authentication.

`Bcrypt`: Password hashing.

`Nodemailer`: For sending OTP emails and product notifications.

`Speakeasy`: For OTP generation and verification.

`Rate Limiting`: To prevent abuse using express-rate-limit.

`dotenv`: For managing environment variables.

`Swagger`: API documentation.

## API Documentation (Swagger)
The API documentation is automatically generated using Swagger. To access it:

1. After running the app, open your browser and visit http://localhost:3000/docs

2. You will see the API documentation where you can view all the available endpoints, request/response formats, and test them directly.

### Endpoints documented in Swagger:

#### User Management:

● `POST /register`: Register a new user

● `POST /login`: Login and get JWT Token

● `POST /changePass`: Change password (requires admin, employee, or customer authorization)

● `POST /requestOTP`: Request a new OTP (limited by rate limiter)

#### Product Management:

● `GET /products`: View all products (requires admin, employee, or customer authorization)

● `POST /products`: Add a new product (requires admin or employee authorization)

● `PUT /products/:ProId`: Edit an existing product by ID (requires admin or employee authorization)

● `DELETE /products/:ProId`: Delete a product by ID (requires admin or employee authorization)

#### Notification Settings:

● `POST /setNotification`: Set or update notification preferences

#### Cart Management:

● `POST /carts`: Create a new shopping cart

● `POST /carts/:cartId/items`: Add an item to a specific cart

● `PUT /carts/:cartId/items/:itemId`: Edit an item in a cart by item ID

● `DELETE /carts/:cartId/items/:itemId`: Remove an item from a cart by item ID

● `GET /carts/:cartId/item`: View items in a specific cart

You can also use Swagger UI to interact with these endpoints and test the requests directly from the documentation page.

