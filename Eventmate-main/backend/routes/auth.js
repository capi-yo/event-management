const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { userValidation } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const { logger } = require('../utils/logger');

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

        // Insert new user with role
        const result = await db.query(
            `INSERT INTO users (name, email, password_hash, role) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id, name, email, role, created_at`,
            [name, email, passwordHash, userRole]
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

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
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
            'SELECT id, name, email, password_hash, role, created_at FROM users WHERE email = $1',
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

module.exports = router;
