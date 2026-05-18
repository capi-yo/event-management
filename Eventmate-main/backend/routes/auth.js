const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { userValidation } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: process.env.SMTP_PORT || 587,
    auth: {
        user: process.env.SMTP_USER || 'ethereal.user@ethereal.email',
        pass: process.env.SMTP_PASS || 'ethereal.pass'
    }
});

const router = express.Router();

/**
 * POST /auth/register
 * Register a new user (BR-01: Email uniqueness validation)
 */
router.post('/register', userValidation.register, async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if email already exists (BR-01)
        const existingUser = await db.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Validate role - only allow specific roles for registration
        const allowedRoles = ['Registered User', 'Organizer'];
        const userRole = allowedRoles.includes(role) ? role : 'Registered User';

        // Generate a 6-digit verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        // Expiration in 10 minutes
        const verificationExpires = new Date(Date.now() + 10 * 60000);

        // Insert new user with role
        const result = await db.query(
            `INSERT INTO users (name, email, password_hash, role, is_verified, verification_code, verification_code_expires) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             RETURNING id, name, email, role, created_at`,
            [name, email, passwordHash, userRole, false, verificationCode, verificationExpires]
        );

        const user = result.rows[0];

        // Log the registration
        await logger.log({
            userId: user.id,
            action: 'User registration',
            entityType: 'user',
            entityId: user.id,
            details: { email: user.email },
            ipAddress: req.ip || req.connection.remoteAddress
        });

        // We don't generate a token here since they need to verify first

        // Send email
        const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify?email=${encodeURIComponent(email)}&code=${verificationCode}`;
        
        try {
            await transporter.sendMail({
                from: '"EventMate" <noreply@eventmate.com>',
                to: email,
                subject: 'Verify your EventMate account',
                text: `Your verification OTP is: ${verificationCode}. Please enter this code on the verification page.`,
                html: `<h3>Welcome to EventMate!</h3><p>Your verification OTP is:</p><h1 style="font-size: 32px; letter-spacing: 5px; color: #dc143c;">${verificationCode}</h1><p>Please enter this code on the verification page to complete your registration.</p>`
            });
            console.log(`Verification email sent to ${email} with OTP ${verificationCode}`);
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            // We continue even if email fails, but in production we might handle this differently
        }

        res.status(201).json({
            success: true,
            message: 'User registered successfully. Please verify your email.',
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            }
        });
    } catch (error) {
  console.log("REGISTER ERROR:", error);
  return res.status(500).json({ message: error.message });
}
});

/**
 * POST /auth/login
 * Authenticate user and return JWT (BR-02)
 */
router.post('/login', userValidation.login, async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const result = await db.query(
            'SELECT id, name, email, password_hash, role, is_verified, created_at FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const user = result.rows[0];

        // Verify password (BR-02)
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check verification status
        if (user.is_verified === false) {
            return res.status(403).json({
                success: false,
                message: 'Please verify your email before logging in.',
                needsVerification: true
            });
        }

        // Log the login
        await logger.log({
            userId: user.id,
            action: 'User login',
            entityType: 'user',
            entityId: user.id,
            details: { email: user.email },
            ipAddress: req.ip || req.connection.remoteAddress
        });

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                },
                token
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during login'
        });
    }
});

/**
 * POST /auth/verify
 * Verify user email using the code
 */
router.post('/verify', async (req, res) => {
    try {
        const { email, code } = req.body;
        const result = await db.query(
            'SELECT id, verification_code_expires FROM users WHERE email = $1 AND verification_code = $2',
            [email, code]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification code'
            });
        }

        const user = result.rows[0];
        const now = new Date();

        if (user.verification_code_expires && new Date(user.verification_code_expires) < now) {
            return res.status(400).json({
                success: false,
                message: 'Verification code has expired. Please request a new one.'
            });
        }

        await db.query(
            'UPDATE users SET is_verified = true, verification_code = NULL, verification_code_expires = NULL WHERE email = $1',
            [email]
        );

        res.json({
            success: true,
            message: 'Email verified successfully'
        });
    } catch (error) {
        console.error('Verify error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying email'
        });
    }
});

/**
 * POST /auth/resend-otp
 * Resend verification or password reset OTP
 */
router.post('/resend-otp', async (req, res) => {
    try {
        const { email, type } = req.body; // type can be 'verification' or 'reset'

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const result = await db.query('SELECT id, is_verified FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User with this email does not exist.'
            });
        }

        const user = result.rows[0];
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        if (type === 'reset') {
            // Expiration in 15 minutes
            const expires = new Date(Date.now() + 15 * 60000);
            await db.query(
                'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
                [otpCode, expires, user.id]
            );

            await transporter.sendMail({
                from: '"EventMate" <noreply@eventmate.com>',
                to: email,
                subject: 'Reset your EventMate password',
                text: `Your password reset OTP is: ${otpCode}. This OTP will expire in 15 minutes.`,
                html: `<h3>Password Reset Request</h3><p>You requested a password reset. Your OTP is:</p><h1 style="font-size: 32px; letter-spacing: 5px; color: #dc143c;">${otpCode}</h1><p>Please enter this code on the password reset page. This OTP is valid for 15 minutes.</p>`
            });
            console.log(`Resent password reset OTP to ${email}`);
        } else {
            // Default to verification
            if (user.is_verified) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is already verified.'
                });
            }

            // Expiration in 10 minutes
            const expires = new Date(Date.now() + 10 * 60000);
            await db.query(
                'UPDATE users SET verification_code = $1, verification_code_expires = $2 WHERE id = $3',
                [otpCode, expires, user.id]
            );

            await transporter.sendMail({
                from: '"EventMate" <noreply@eventmate.com>',
                to: email,
                subject: 'Verify your EventMate account',
                text: `Your verification OTP is: ${otpCode}. Please enter this code on the verification page.`,
                html: `<h3>Welcome to EventMate!</h3><p>Your verification OTP is:</p><h1 style="font-size: 32px; letter-spacing: 5px; color: #dc143c;">${otpCode}</h1><p>Please enter this code on the verification page to complete your registration. This OTP is valid for 10 minutes.</p>`
            });
            console.log(`Resent verification OTP to ${email}`);
        }

        res.json({
            success: true,
            message: `A new OTP has been sent to your email.`
        });
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Error resending OTP code'
        });
    }
});

/**
 * GET /auth/me
 * Get current authenticated user
 */
router.get('/me', authenticate, async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                user: req.user
            }
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting user info'
        });
    }
});

/**
 * POST /auth/forgot-password
 * Request a password reset link
 */
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email format' });
        }

        const result = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            // Standard secure practice is not to reveal if email exists
            return res.json({
                success: true,
                message: 'If the email is registered, a password reset link has been sent.'
            });
        }

        const user = result.rows[0];
        const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
        // Expiration in 15 minutes for OTP
        const expires = new Date(Date.now() + 15 * 60000); 

        await db.query(
            'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
            [resetToken, expires, user.id]
        );

        try {
            await transporter.sendMail({
                from: '"EventMate" <noreply@eventmate.com>',
                to: email,
                subject: 'Reset your EventMate password',
                text: `Your password reset OTP is: ${resetToken}. This OTP will expire in 15 minutes.`,
                html: `<h3>Password Reset Request</h3><p>You requested a password reset. Your OTP is:</p><h1 style="font-size: 32px; letter-spacing: 5px; color: #dc143c;">${resetToken}</h1><p>Please enter this code on the password reset page. This OTP is valid for 15 minutes.</p>`
            });
            console.log(`Password reset email sent to ${email} with OTP ${resetToken}`);
        } catch (emailError) {
            console.error('Failed to send password reset email:', emailError);
            return res.status(500).json({
                success: false,
                message: 'Failed to send password reset email.'
            });
        }

        res.json({
            success: true,
            message: 'Password reset OTP has been sent to your email.'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ success: false, message: 'Error initiating password reset' });
    }
});

/**
 * POST /auth/reset-password
 * Reset user password using token
 */
router.post('/reset-password', async (req, res) => {
    try {
        const { email, token, password } = req.body;

        if (!email || !token || !password) {
            return res.status(400).json({ success: false, message: 'Email, token, and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
        }

        // Find user by email and token and verify it's not expired
        const result = await db.query(
            'SELECT id, reset_token_expires FROM users WHERE email = $1 AND reset_token = $2',
            [email, token]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email or OTP code.'
            });
        }

        const user = result.rows[0];
        const now = new Date();

        if (new Date(user.reset_token_expires) < now) {
            return res.status(400).json({
                success: false,
                message: 'Your password reset OTP has expired.'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Update password and clear token columns
        await db.query(
            'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
            [passwordHash, user.id]
        );

        res.json({
            success: true,
            message: 'Your password has been reset successfully. You can now log in.'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ success: false, message: 'Error resetting password' });
    }
});

module.exports = router;
