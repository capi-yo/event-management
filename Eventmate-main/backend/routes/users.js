const express = require('express');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { userValidation } = require('../middleware/validation');
const { logger } = require('../utils/logger');
const upload = require('../middleware/avatarUpload');

const router = express.Router();

// ─── helpers ────────────────────────────────────────────────────────────────

/**
 * Validate new password meets strength requirements:
 * ≥8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special character
 */
function validatePasswordStrength(password) {
    if (!password || password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
    if (!/[^A-Za-z0-9]/.test(password)) return 'Password must contain at least one special character';
    return null;
}

/**
 * Remove an old avatar file from disk safely.
 * Only removes files inside the uploads/profile-images directory.
 */
function deleteOldAvatar(avatarUrl) {
    if (!avatarUrl) return;
    try {
        // avatarUrl is like  /uploads/profile-images/avatar_3_1716553200000.jpg
        if (!avatarUrl.startsWith('/uploads/profile-images/')) return;
        const filename = path.basename(avatarUrl);
        const filepath = path.join(__dirname, '../../uploads/profile-images', filename);
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }
    } catch (err) {
        console.error('Failed to delete old avatar:', err.message);
    }
}

// ─── routes ─────────────────────────────────────────────────────────────────

/**
 * GET /user/profile
 * Get current user's profile (includes avatar_url, phone, bio)
 */
router.get('/profile', authenticate, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, name, email, role, avatar_url, phone, bio, created_at FROM users WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, data: { user: result.rows[0] } });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ success: false, message: 'Error getting profile' });
    }
});

/**
 * PUT /user/profile
 * Update current user's profile (name, phone, bio)
 */
router.put('/profile', authenticate, userValidation.updateProfile, async (req, res) => {
    try {
        const { name, phone, bio } = req.body;

        const updates = [];
        const values = [];
        let paramCount = 1;

        if (name !== undefined) {
            updates.push(`name = $${paramCount}`);
            values.push(name.trim());
            paramCount++;
        }
        if (phone !== undefined) {
            updates.push(`phone = $${paramCount}`);
            values.push(phone.trim() || null);
            paramCount++;
        }
        if (bio !== undefined) {
            updates.push(`bio = $${paramCount}`);
            values.push(bio.trim() || null);
            paramCount++;
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        // Always update updated_at
        updates.push(`updated_at = NOW()`);
        values.push(req.user.id);

        const result = await db.query(
            `UPDATE users SET ${updates.join(', ')}
             WHERE id = $${paramCount}
             RETURNING id, name, email, role, avatar_url, phone, bio, created_at`,
            values
        );

        await logger.log({
            userId: req.user.id,
            action: 'Profile update',
            entityType: 'user',
            entityId: req.user.id,
            details: { updatedFields: Object.keys(req.body) },
            ipAddress: req.ip || req.connection?.remoteAddress
        });

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: { user: result.rows[0] }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Error updating profile' });
    }
});

/**
 * POST /user/avatar
 * Upload or replace the current user's profile photo.
 * Deletes the old avatar file from disk when a new one is uploaded.
 */
router.post('/avatar', authenticate, (req, res, next) => {
    upload.single('avatar')(req, res, (err) => {
        if (err) {
            // Multer validation errors (size, type, etc.)
            return res.status(400).json({ success: false, message: err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        // Build the public URL for this avatar
        const avatarUrl = `/uploads/profile-images/${req.file.filename}`;

        // Fetch current avatar to delete the old file
        const current = await db.query('SELECT avatar_url FROM users WHERE id = $1', [req.user.id]);
        const oldAvatar = current.rows[0]?.avatar_url;

        // Update DB with new avatar URL
        const result = await db.query(
            `UPDATE users SET avatar_url = $1, updated_at = NOW()
             WHERE id = $2
             RETURNING id, name, email, role, avatar_url, phone, bio, created_at`,
            [avatarUrl, req.user.id]
        );

        // Remove old file AFTER successful DB update
        deleteOldAvatar(oldAvatar);

        await logger.log({
            userId: req.user.id,
            action: 'Avatar upload',
            entityType: 'user',
            entityId: req.user.id,
            details: { avatarUrl },
            ipAddress: req.ip || req.connection?.remoteAddress
        });

        res.json({
            success: true,
            message: 'Avatar uploaded successfully',
            data: { user: result.rows[0] }
        });
    } catch (error) {
        // If DB update failed, remove the newly-uploaded file to avoid orphans
        if (req.file) {
            try { fs.unlinkSync(req.file.path); } catch (_) {}
        }
        console.error('Avatar upload error:', error);
        res.status(500).json({ success: false, message: 'Error uploading avatar' });
    }
});

/**
 * PUT /user/password
 * Change current user's password.
 * Requires current password + new password meeting strength rules.
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

        // Strength check
        const strengthError = validatePasswordStrength(newPassword);
        if (strengthError) {
            return res.status(400).json({ success: false, message: strengthError });
        }

        // Get current password hash
        const result = await db.query(
            'SELECT password_hash FROM users WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(12);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        await db.query(
            'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
            [newPasswordHash, req.user.id]
        );

        await logger.log({
            userId: req.user.id,
            action: 'Password change',
            entityType: 'user',
            entityId: req.user.id,
            details: {},
            ipAddress: req.ip || req.connection?.remoteAddress
        });

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ success: false, message: 'Error changing password' });
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

        res.json({ success: true, data: { events: result.rows } });
    } catch (error) {
        console.error('Get my events error:', error);
        res.status(500).json({ success: false, message: 'Error getting user events' });
    }
});

/**
 * GET /user/notifications
 * Get all notifications for the current user
 */
router.get('/notifications', authenticate, async (req, res) => {
    try {
        const { role } = req.query;
        let query = 'SELECT * FROM notifications WHERE user_id = $1';
        const params = [req.user.id];

        if (role) {
            query += ' AND role = $2';
            params.push(role);
        }

        query += ' ORDER BY sent_at DESC LIMIT 50';

        const result = await db.query(query, params);
        res.json({ success: true, data: { notifications: result.rows } });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ success: false, message: 'Error getting notifications' });
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
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all notifications read error:', error);
        res.status(500).json({ success: false, message: 'Error marking all notifications as read' });
    }
});

/**
 * PATCH /user/notifications/:id/read
 * Mark a notification as read
 */
router.patch('/notifications/:id/read', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        const checkResult = await db.query(
            'SELECT id FROM notifications WHERE id = $1 AND user_id = $2',
            [id, req.user.id]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        await db.query('UPDATE notifications SET is_read = TRUE WHERE id = $1', [id]);
        res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({ success: false, message: 'Error marking notification as read' });
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
        res.json({ success: true, data: { events: result.rows } });
    } catch (error) {
        console.error('Get favorites error:', error);
        res.status(500).json({ success: false, message: 'Error getting favorites' });
    }
});

/**
 * POST /user/favorites/:eventId
 * Add an event to favorites
 */
router.post('/favorites/:eventId', authenticate, async (req, res) => {
    try {
        const { eventId } = req.params;

        const eventCheck = await db.query('SELECT id FROM events WHERE id = $1', [eventId]);
        if (eventCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        const existingFav = await db.query(
            'SELECT id FROM favorites WHERE user_id = $1 AND event_id = $2',
            [req.user.id, eventId]
        );

        if (existingFav.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Event already in favorites' });
        }

        await db.query(
            'INSERT INTO favorites (user_id, event_id) VALUES ($1, $2)',
            [req.user.id, eventId]
        );

        res.status(201).json({ success: true, message: 'Event added to favorites' });
    } catch (error) {
        console.error('Add favorite error:', error);
        res.status(500).json({ success: false, message: 'Error adding favorite' });
    }
});

/**
 * DELETE /user/favorites/:eventId
 * Remove an event from favorites
 */
router.delete('/favorites/:eventId', authenticate, async (req, res) => {
    try {
        const { eventId } = req.params;

        const existingFav = await db.query(
            'SELECT id FROM favorites WHERE user_id = $1 AND event_id = $2',
            [req.user.id, eventId]
        );

        if (existingFav.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Favorite not found' });
        }

        await db.query(
            'DELETE FROM favorites WHERE user_id = $1 AND event_id = $2',
            [req.user.id, eventId]
        );

        res.json({ success: true, message: 'Event removed from favorites' });
    } catch (error) {
        console.error('Remove favorite error:', error);
        res.status(500).json({ success: false, message: 'Error removing favorite' });
    }
});

module.exports = router;
