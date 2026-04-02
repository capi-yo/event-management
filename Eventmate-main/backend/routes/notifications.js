const express = require('express');
const db = require('../db');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { isOrganizer, isAdmin } = require('../middleware/rbac');
const { notificationValidation } = require('../middleware/validation');
const { logger } = require('../utils/logger');

const router = express.Router();

/**
 * POST /notifications/send
 * Send notifications to users (Internal/Organizers) - BR-08
 */
router.post('/send', authenticate, notificationValidation.send, async (req, res) => {
    try {
        const { user_id, event_id, message } = req.body;

        // Determine recipients
        const recipients = [];

        if (user_id) {
            // Send to specific user
            const userResult = await db.query(
                'SELECT id, name, email FROM users WHERE id = $1',
                [user_id]
            );

            if (userResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            recipients.push(userResult.rows[0]);
        } else if (event_id) {
            // Send to all registered users for an event
            const eventResult = await db.query(
                'SELECT id, title FROM events WHERE id = $1',
                [event_id]
            );

            if (eventResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Event not found'
                });
            }

            // Get registered users
            const regResult = await db.query(
                `SELECT DISTINCT u.id, u.name, u.email 
                 FROM users u
                 JOIN registrations r ON u.id = r.user_id
                 WHERE r.event_id = $1`,
                [event_id]
            );

            recipients.push(...regResult.rows);
        } else {
            return res.status(400).json({
                success: false,
                message: 'Either user_id or event_id must be provided'
            });
        }

        // Insert notifications for all recipients
        const notificationIds = [];

        for (const recipient of recipients) {
            const result = await db.query(
                `INSERT INTO notifications (user_id, message) 
                 VALUES ($1, $2) 
                 RETURNING id`,
                [recipient.id, message]
            );

            notificationIds.push(result.rows[0].id);
        }

        // Log notification sending
        await logger.log({
            userId: req.user.id,
            action: 'Send notifications',
            entityType: 'notification',
            entityId: null,
            details: {
                recipient_count: recipients.length,
                event_id: event_id || null,
                user_id: user_id || null
            },
            ipAddress: req.ip || req.connection.remoteAddress
        });

        res.status(201).json({
            success: true,
            message: `Notifications sent to ${recipients.length} recipient(s)`,
            data: {
                notifications_sent: notificationIds.length
            }
        });
    } catch (error) {
        console.error('Send notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending notifications'
        });
    }
});

/**
 * POST /notifications/send-bulk
 * Send bulk notifications to multiple users (Admin only)
 */
router.post('/send-bulk', authenticate, isAdmin, async (req, res) => {
    try {
        const { user_ids, message } = req.body;

        if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'user_ids array is required'
            });
        }

        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'message is required'
            });
        }

        // Verify all users exist
        const usersResult = await db.query(
            `SELECT id, name, email FROM users WHERE id = ANY($1)`,
            [user_ids]
        );

        if (usersResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No valid users found'
            });
        }

        // Insert notifications
        for (const user of usersResult.rows) {
            await db.query(
                `INSERT INTO notifications (user_id, message) VALUES ($1, $2)`,
                [user.id, message]
            );
        }

        // Log bulk notification
        await logger.log({
            userId: req.user.id,
            action: 'Send bulk notifications',
            entityType: 'notification',
            entityId: null,
            details: {
                recipient_count: usersResult.rows.length
            },
            ipAddress: req.ip || req.connection.remoteAddress
        });

        res.status(201).json({
            success: true,
            message: `Notifications sent to ${usersResult.rows.length} user(s)`,
            data: {
                notifications_sent: usersResult.rows.length
            }
        });
    } catch (error) {
        console.error('Send bulk notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending bulk notifications'
        });
    }
});

/**
 * GET /notifications/templates
 * Get notification templates (for event reminders, updates, etc.)
 */
router.get('/templates', authenticate, async (req, res) => {
    try {
        const templates = [
            {
                id: 1,
                name: 'Event Reminder',
                message: 'Reminder: {event_title} is happening on {event_date} at {event_time}.'
            },
            {
                id: 2,
                name: 'Event Update',
                message: 'Update: {event_title} has been updated. Please check the details.'
            },
            {
                id: 3,
                name: 'Event Cancellation',
                message: 'We regret to inform you that {event_title} has been cancelled.'
            },
            {
                id: 4,
                name: 'Registration Confirmation',
                message: 'You have successfully registered for {event_title}.'
            },
            {
                id: 5,
                name: 'Payment Confirmation',
                message: 'Your payment for {event_title} has been confirmed. Your ticket is ready.'
            }
        ];

        res.json({
            success: true,
            data: {
                templates
            }
        });
    } catch (error) {
        console.error('Get templates error:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting notification templates'
        });
    }
});

module.exports = router;
