const db = require('../models/db');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const { OTPEmail, sendNotiEmail } = require('../middleware/auth');

dotenv.config();

// Rigister
exports.createUser = async (req, res) => {
    const { username, password, email, role } = req.body

    try {
        if (!username || !password || !email || !role) {
            return res
                .status(400)
                .json({ message: 'Username password email or role is required' });
        }

        const hashedPassword = await bcrypt.hash(password, parseInt(process.env.SALT_ROUNDS));

        const [roleResult] = await db.query("SELECT role_id FROM roles WHERE role_name = ?",
            [role]);

        if (roleResult.length === 0) {
            return res
                .status(400)
                .json({ message: 'Invalid role' });
        }

        const role_id = roleResult[0].role_id;

        const users = await db.query("INSERT INTO users (username,password,email,role_id) VALUES (?,?,?,?)",
            [username, hashedPassword, email, role_id]);

        const userId = users[0].insertId;

        const token = jwt.sign({ user_id: userId, role: role_id },
            process.env.JWT_SECRET,
            { expiresIn: '5m' }
        );

        res
            .status(201)
            .json({ message: 'User registration successful', token: token });

    } catch (error) {
        console.error(error);
        res
            .status(500)
            .json({ message: 'Internal server error' });
    }
};

// Login
exports.loginUser = async (req, res) => {
    const { username, password, otp } = req.body;

    try {
        if (!username || !password) {
            return res
                .status(400)
                .json({ message: 'Username or password is required' });
        }

        const [userResult] = await db.query("SELECT * FROM users WHERE username = ?",
            [username]);


        if (userResult.length === 0) {
            return res
                .status(404)
                .json({ message: 'User not found' });
        }

        const user = userResult[0];

        if (!otp) {
            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                return res
                    .status(401)
                    .json({ message: 'Invalid password' });
            }

            await OTPEmail(user.email, user.user_id);
            return res
                .status(200)
                .json({ message: 'OTP sent to your email. Please verify' });
        }

        else {

            const isVerified = speakeasy.totp.verify({
                secret: user.secret,
                encoding: 'base32',
                token: otp,
                window: 2,
                step: 300

            });

            if (isVerified) {
                return res
                    .status(200)
                    .json({ message: 'Login successful' });
            } else {
                return res
                    .status(401)
                    .json({ message: 'Invalid OTP' });
            }
        }

    } catch (error) {
        console.error(error);
        res
            .status(500)
            .json({ message: 'Internal server error' });
    }

};

// Change password
exports.changePass = async (req, res) => {
    const userId = req.user_id;
    const { oldPassword, newPassword } = req.body

    if (!oldPassword || !newPassword) {
        return res
            .status(400)
            .json({ message: 'Please enter both old and new password.' })
    }

    try {
        const [userResult] = await db.query("SELECT * FROM users WHERE user_id = ?",
            [userId]);


        if (userResult.length === 0) {
            return res
                .status(404)
                .json({ message: 'User not found' });
        }

        const user = userResult[0];

        const isMatch = await bcrypt.compare(oldPassword, user.password);

        if (!isMatch) {
            return res
                .status(401)
                .json({ message: 'Invalid password' });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, parseInt(process.env.SALT_ROUNDS));

        await db.query("UPDATE users SET password = ? WHERE user_id = ?",
            [hashedNewPassword, userId]);

        return res
            .status(200)
            .json({ message: 'Password changed successfully' });

    } catch (error) {
        console.error(error);
        return res
            .status(500)
            .json({ message: 'Error changing password', error });
    }
};

// Request a new OTP
exports.requestOTP = async (req, res) => {
    const { username, password } = req.body;

    try {
        if (!username || !password) {
            return res
                .status(400)
                .json({ message: 'Username or password is required' });
        }

        const [userResult] = await db.query("SELECT * FROM users WHERE username = ?",
            [username]);


        if (userResult.length === 0) {
            return res
                .status(404)
                .json({ message: 'User not found' });
        }

        const user = userResult[0];

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res
                .status(401)
                .json({ message: 'Invalid password' });
        }

        await OTPEmail(user.email);
        return res
            .status(200)
            .json({ message: 'OTP sent to your email' });

    } catch (error) {
        console.error(error);
        return res
            .status(500)
            .json({ message: 'Internal server error' });
    }
};

// View products
exports.products = async (req, res) => {
    try {
        const [proResult] = await db.query("SELECT product_name,description,price,quantity FROM products");

        return res
            .status(200)
            .json({ products: proResult });

    } catch (error) {
        console.error(error);
        return res
            .status(500)
            .json({ message: 'Internal server error' });
    }
};

// Add products
exports.AddProducts = async (req, res) => {
    const { name, description, price, quantity } = req.body
    try {
        if (!name || !description || !price || !quantity) {
            return res
                .status(400)
                .json({ message: 'Name, description, price, quantity is required' });
        }

        const AddResult = await db.query("INSERT INTO products (product_name, description, price, quantity) VALUES(?,?,?,?)",
            [name, description, price, quantity]);

        const ProId = AddResult[0].insertId;

        const [newPro] = await db.query("SELECT product_name, description, price, quantity FROM products WHERE product_id = ?",
            [ProId]);

        const [users] = await db.query("SELECT * FROM users WHERE notification_enabled = TRUE");

        const emailPromises = users.map(user => sendNotiEmail(user.email, name));
        await Promise.all(emailPromises);

        return res
            .status(201)
            .json({
                message: 'Product added successfully and notification sent.',
                products: newPro[0]
            });

    } catch (error) {
        console.error(error);
        return res
            .status(500)
            .json({ message: 'Internal server error' });
    }
};

// Edit products
exports.EditProducts = async (req, res) => {
    const { ProId } = req.params;
    const { name, description, price, quantity } = req.body

    try {
        if (!name || !description || !price || !quantity) {
            return res
                .status(400)
                .json({ message: 'Name, description, price or quantity is required' });
        }

        const result = await db.query("UPDATE products SET product_name = ?, description = ?, price = ?, quantity = ? WHERE product_id = ?",
            [name, description, price, quantity, ProId]
        );

        if (result[0].affectedRows === 0) {
            return res
                .status(404)
                .json({ message: 'Product not found' });
        }

        const [updateProduct] = await db.query("SELECT product_name, description, price, quantity FROM products WHERE product_id = ?",
            [ProId]
        );

        return res
            .status(200)
            .json({
                message: 'Product updated successfully',
                product: updateProduct[0]
            });


    } catch (error) {
        console.error(error);
        return res
            .status(500)
            .json({ message: 'Internal server error' });
    }
};

// Delete products
exports.DeleteProducts = async (req, res) => {
    const { ProId } = req.params;

    try {
        const [deleteProduct] = await db.query("DELETE FROM products WHERE product_id = ?",
            [ProId]
        );

        if (deleteProduct.affectedRows === 0) {
            return res
                .status(404)
                .json({ message: 'Product not found' });
        }

        return res
            .status(200)
            .json({ message: 'Product delete successfully' });

    } catch (error) {
        console.error(error);
        return res
            .status(500)
            .json({ message: 'Internal server error' });
    }
};

// Setting notification
exports.setNoti = async (req, res) => {
    const userId = req.user_id;
    const { notification_enabled } = req.body

    try {
        if (notification_enabled !== "on" && notification_enabled !== "off") {
            return res
                .status(400)
                .json({ message: 'Invalid value for notification_enabled. Only on or off is allowed.' });
        }

        const mapping = {
            on: 1,
            off: 0
        };

        const mappedValue = mapping[notification_enabled];

        const result = await db.query("UPDATE users SET notification_enabled = ? WHERE user_id = ?",
            [mappedValue, userId]
        );

        if (result[0].affectedRows === 0) {
            return res
                .status(404)
                .json({ message: 'User not found' });
        }

        return res
            .status(200)
            .json({ message: 'Notification setting updated successfully' });

    } catch (error) {
        console.error(error);
        return res
            .status(500)
            .json({ message: 'Internal server error' });
    }
};

// Carts
exports.carts = async (req, res) => {
    const userId = req.user_id;
    try {
        const result = await db.query("INSERT INTO carts (user_id) VALUES (?)", [userId]);

        return res
            .status(201)
            .json({ message: 'Cart created successfully' });

    } catch (error) {
        console.error(error);
        return res
            .status(500)
            .json({ message: 'Internal server error' });
    }
};

// Add product to cart
exports.AddItemCart = async (req, res) => {
    const { cartId } = req.params;
    const { product_id, quantity } = req.body;

    try {
        if (!product_id || !quantity || typeof product_id !== 'number' || typeof quantity !== 'number') {
            return res
                .status(400)
                .json({ message: 'Product ID or quantity is required and must be numbers' });
        }

        const [cartExists] = await db.query("SELECT 1 FROM carts WHERE cart_id = ?", [cartId]);
        if (!cartExists || cartExists.length === 0) {
            return res
                .status(404)
                .json({ message: 'Cart not found' });
        }

        const [productExists] = await db.query("SELECT 1 FROM products WHERE product_id = ?", [product_id]);
        if (!productExists || productExists.length === 0) {
            return res
                .status(404)
                .json({ message: 'Product not found' });
        }

        await db.query("INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?,?,?)",
            [cartId, product_id, quantity]);

        return res
            .status(201)
            .json({ message: 'Item add to cart successfully' });

    } catch (error) {
        console.error(error);
        return res
            .status(500)
            .json({ message: 'Internal server error' });
    }
};

// Edit products in cart
exports.EditItemCart = async (req, res) => {
    const { cartId, itemId } = req.params;
    const { quantity } = req.body;

    try {
        const [cartExists] = await db.query("SELECT 1 FROM carts WHERE cart_id = ?", [cartId]);
        if (!cartExists || cartExists.length === 0) {
            return res
                .status(404)
                .json({ message: 'Cart not found' });
        }

        const [itemExists] = await db.query("SELECT 1 FROM cart_items WHERE cart_id = ? AND item_id = ?", [cartId, itemId]);
        if (!itemExists || itemExists.length === 0) {
            return res
                .status(404)
                .json({ message: 'Item not found in cart' });
        }

        await db.query("UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND item_id = ?",
            [quantity, cartId, itemId]);

        res
            .status(200)
            .json({ message: 'Item quantity updated successfully' });

    } catch (error) {
        console.error(error);
        return res
            .status(500)
            .json({ message: 'Internal server error' });
    }
};

// Delete products in cart
exports.DeleteItemCart = async (req, res) => {
    const { cartId, itemId } = req.params;
    try {
        const [cartExists] = await db.query("SELECT 1 FROM carts WHERE cart_id = ?", [cartId]);
        if (!cartExists || cartExists.length === 0) {
            return res
                .status(404)
                .json({ message: 'Cart not found' });
        }

        const [itemExists] = await db.query("SELECT 1 FROM cart_items WHERE cart_id = ? AND item_id = ?", [cartId, itemId]);
        if (!itemExists || itemExists.length === 0) {
            return res
                .status(404)
                .json({ message: 'Item not found in cart' });
        }

        await db.query("DELETE FROM cart_items WHERE cart_id = ? AND item_id = ?",
            [cartId, itemId]);

        res
            .status(200)
            .json({ message: 'Item removed from cart successfully' });

    } catch (error) {
        console.error(error);
        return res
            .status(500)
            .json({ message: 'Internal server error' });
    }
};

// show product in cart
exports.ItemCart = async (req, res) => {
    const { cartId } = req.params;

    try {
        const [cartExists] = await db.query("SELECT 1 FROM carts WHERE cart_id = ?", [cartId]);
        if (!cartExists || cartExists.length === 0) {
            return res
                .status(404)
                .json({ message: 'Cart not found' });
        }

        const [item] = await db.query(`
            SELECT p.product_name, ci.quantity, p.price 
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.product_id
            WHERE ci.cart_id = ?`,
            [cartId]);

        res
            .json(item);

    } catch (error) {
        console.error(error);
        return res
            .status(500)
            .json({ message: 'Internal server error' });
    }
};