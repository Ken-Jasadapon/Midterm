# User Product and Cart Management API

## Description

This is a Node.js project using Express.js for building RESTful APIs. The project includes functionalities such as user authentication, JWT-based authorization, OTP generation and verification, shopping cart management, product management, and email notifications. It uses MySQL for database management, bcrypt for secure password hashing, and dotenv for managing environment variables. The project also implements rate limiting to prevent abuse and uses Speakeasy for generating and verifying one-time passwords (OTPs).

## Features

`User Registration:` Register a new user with hashed password.

`Login:` JWT-based authentication for user login.

`Change Password:` Allow users to change their password.

`Request a New OTP:` Generate a new OTP for user login.

`View Products:` Display a list of available products.

`Add Products:` Admin users can add new products (email notification sent to users with notifications enabled).

`Edit Products:` Admin users can edit existing products.

`Delete Products:` Admin users can delete products.

`Set Notification` Preferences: Users can enable or disable email notifications for product updates.

`Carts:`.

    `Add Products to Cart:` Users can add products to their cart.

    `Edit Products in Cart:` Users can update product quantities in the cart.

    `Delete Products from Cart:` Users can remove products from their cart.

    `View Products in Cart:` Display the list of products in the user's cart.

`Authentication:` Secure login using JWT.

`Authorization:` Role-based access control (Admin, Employee, Customer) to restrict access to certain endpoints.

## Technologies

`Node.js:` JavaScript runtime for the backend.

`Express.js:` Web framework for building APIs.

`MySQL:` Database for storing user and product information.

`JWT:` Token-based authentication.

`Bcrypt:` Password hashing.

`Nodemailer:` For sending OTP emails and product notifications.

`Speakeasy:` For OTP generation and verification.

`Rate Limiting:` To prevent abuse using express-rate-limit.

`dotenv:` For managing environment variables.

`Swagger:` API documentation.

## Getting Started

### Prerequisites
    ● Node.js v14 or higher
    ● MySQL database