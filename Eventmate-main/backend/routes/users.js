const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { userValidation } = require('../middleware/validation');
const { logger } = require('../utils/logger');

const router = express.Router();

/**
 * GET /user/profile
 * Get current user's profile
 */
router.get('/profile', authenticate, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: {
                user: result.rows[0]
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting profile'
        });
    }
});

/**
 * PUT /user/profile
 * Update current user's profile
 */
router.put('/profile', authenticate, userValidation.updateProfile, async (req, res) => {
    try {
        const { name } = req.body;

        const updates = [];
        const values = [];
        let paramCount = 1;

        if (name) {
            updates.push(`name = $${paramCount}`);
            values.push(name);
            paramCount++;
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        values.push(req.user.id);

        const result = await db.query(
            `UPDATE users SET ${updates.join(', ')} 
             WHERE id = $${paramCount} 
             RETURNING id, name, email, role, created_at`,
            values
        );

        // Log the profile update
        await logger.log({
            userId: req.user.id,
            action: 'Profile update',
            entityType: 'user',
            entityId: req.user.id,
            details: { updatedFields: Object.keys(req.body) },
            ipAddress: req.ip || req.connection.remoteAddress
        });

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: result.rows[0]
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile'
        });
    }
});

/**
 * PUT /user/password
 * Change current user's password
 */
router.put('/password', authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        // Get current password hash
        const result = await db.query(
            'SELECT password_hash FROM users WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, result.rows[0].password_hash);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        // Update password
        await db.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2',
            [newPasswordHash, req.user.id]
        );

        // Log the password change
        await logger.log({
            userId: req.user.id,
            action: 'Password change',
            entityType: 'user',
            entityId: req.user.id,
            details: {},
            ipAddress: req.ip || req.connection.remoteAddress
        });

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error changing password'
        });
    }
});

/**
 * GET /user/my-events
 * Get all events the current user has registered for
 */
router.get('/my-events', authenticate, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT e.*, r.status as registration_status, r.timestamp as registration_timestamp,
                    t.id as ticket_id, t.ticket_type, t.price as ticket_price, t.is_confirmed
             FROM events e
             JOIN registrations r ON e.id = r.event_id
             LEFT JOIN tickets t ON r.id = t.registration_id
             WHERE r.user_id = $1
             ORDER BY e.date DESC, e.time DESC`,
            [req.user.id]
        );

        res.json({
            success: true,
            data: {
                events: result.rows
            }
        });
    } catch (error) {
        console.error('Get my events error:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting user events'
        });
    }
});

/**
 * GET /user/notifications
 * Get all notifications for the current user
 */
router.get('/notifications', authenticate, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT * FROM notifications 
             WHERE user_id = $1 
             ORDER BY sent_at DESC 
             LIMIT 50`,
            [req.user.id]
        );

        res.json({
            success: true,
            data: {
                notifications: result.rows
            }
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting notifications'
        });
    }
});

/**
 * PATCH /user/notifications/:id/read
 * Mark a notification as read
 */
router.patch('/notifications/:id/read', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        // Verify the notification belongs to the user
        const checkResult = await db.query(
            'SELECT id FROM notifications WHERE id = $1 AND user_id = $2',
            [id, req.user.id]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        await db.query(
            'UPDATE notifications SET is_read = TRUE WHERE id = $1',
            [id]
        );

        res.json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking notification as read'
        });
    }
});

/**
 * PATCH /user/notifications/read-all
 * Mark all notifications for the current user as read
 */
router.patch('/notifications/read-all', authenticate, async (req, res) => {
    try {
        await db.query(
            'UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE',
            [req.user.id]
        );

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Mark all notifications read error:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking all notifications as read'
        });
    }
});

/**
 * GET /user/favorites
 * Get all favorited events for the current user
 */
router.get('/favorites', authenticate, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT e.*, f.created_at as favorited_at
             FROM favorites f
             JOIN events e ON f.event_id = e.id
             WHERE f.user_id = $1
             ORDER BY f.created_at DESC`,
            [req.user.id]
        );

        res.json({
            success: true,
            data: {
                events: result.rows
            }
        });
    } catch (error) {
        console.error('Get favorites error:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting favorites'
        });
    }
});

/**
 * POST /user/favorites/:eventId
 * Add an event to favorites
 */
router.post('/favorites/:eventId', authenticate, async (req, res) => {
    try {
        const { eventId } = req.params;

        // Check if event exists
        const eventCheck = await db.query(
            'SELECT id FROM events WHERE id = $1',
            [eventId]
        );

        if (eventCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Check if already favorited
        const existingFav = await db.query(
            'SELECT id FROM favorites WHERE user_id = $1 AND event_id = $2',
            [req.user.id, eventId]
        );

        if (existingFav.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Event already in favorites'
            });
        }

        // Add to favorites
        await db.query(
            'INSERT INTO favorites (user_id, event_id) VALUES ($1, $2)',
            [req.user.id, eventId]
        );

        res.status(201).json({
            success: true,
            message: 'Event added to favorites'
        });
    } catch (error) {
        console.error('Add favorite error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding favorite'
        });
    }
});

/**
 * DELETE /user/favorites/:eventId
 * Remove an event from favorites
 */
router.delete('/favorites/:eventId', authenticate, async (req, res) => {
    try {
        const { eventId } = req.params;

        // Check if favorite exists
        const existingFav = await db.query(
            'SELECT id FROM favorites WHERE user_id = $1 AND event_id = $2',
            [req.user.id, eventId]
        );

        if (existingFav.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Favorite not found'
            });
        }

        // Remove from favorites
        await db.query(
            'DELETE FROM favorites WHERE user_id = $1 AND event_id = $2',
            [req.user.id, eventId]
        );

        res.json({
            success: true,
            message: 'Event removed from favorites'
        });
    } catch (error) {
        console.error('Remove favorite error:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing favorite'
        });
    }
});

module.exports = router;
