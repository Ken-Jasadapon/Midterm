const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const speakeasy = require('speakeasy');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const db = require('../models/db');


dotenv.config();

// function Authentication
exports.authenticate = async (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res
            .status(401)
            .json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const [userResult] = await db.query("SELECT * FROM users WHERE user_id = ?",
            [decoded.user_id]);

        if (userResult.length === 0) {
            return res
                .status(401)
                .json({ message: 'Unauthorized' });
        }

        req.user = userResult[0];
        req.user_id = decoded.user_id;

        next();

    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return res
                .status(401)
                .json({ message: 'Unauthorized' });
        } else if (error instanceof jwt.TokenExpiredError) {
            return res
                .status(401)
                .json({ message: 'Token expired' });
        }
        console.error(error);
        return res
            .status(500)
            .json({ message: 'Internal server error' });
    }

};

// function Authorization
const roleMapping = {
    'admin': 1,
    'employee': 2,
    'customer': 3
};
exports.authorization = (...allowedRoles) => {
    return async (req, res, next) => {

        if (!req.user) {
            return res
                .status(401)
                .json({ message: 'User data not found' });
        }

        const allowedRoleIds = allowedRoles.map(role => roleMapping[role]);

        if (!allowedRoleIds.includes(req.user.role_id)) {
            return res
                .status(403)
                .json({ message: 'You do not have permission to access.' });
        }

        next();

    };
};

// function OTP Email
exports.OTPEmail = async (email, userId) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASS_MAIL
            }
        });

        const [userResult] = await db.query("SELECT * FROM users WHERE user_id = ?", [userId]);
        let secret;

        if (userResult.length > 0) {
            secret = userResult[0].secret;

            if (!secret) {
                secret = speakeasy.generateSecret();
                await db.query("UPDATE users SET secret = ? WHERE user_id = ?",
                    [secret.base32, userId]);
            }
        } else {
            secret = speakeasy.generateSecret();
            await db.query("UPDATE users SET secret = ? WHERE user_id = ?",
                [secret.base32, userId]);
        }

        const token = speakeasy.totp({
            secret: secret.base32,
            encoding: 'base32',
            step: 300
        });

        const mailOptions = {
            from: `"Midterm App" <${process.env.EMAIL}>`,
            to: email,
            subject: 'Your OTP Code',
            text: `Your OTP code is ${token}`
        };

        await transporter.sendMail(mailOptions);

    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Error sending email');
    }
};

// function OTP request limit
exports.otpReqLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 3,
    message: {
        message: 'Too many OTP requests, please try again later'
    }
});

// function send notification email
exports.sendNotiEmail = async (email, product_name) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASS_MAIL
            }
        });

        const mailOptions = {
            from: `"Midterm App" <${process.env.EMAIL}>`,
            to: email,
            subject: 'New Product Alert!',
            text: `New product available: ${product_name}`
        };

        await transporter.sendMail(mailOptions);

    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Error sending email');
    }
};