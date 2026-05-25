const express = require('express');
const { body } = require('express-validator');
const db = require('../db');
const transporter = require('../utils/mailer');
const { validate } = require('../middleware/validation');

const router = express.Router();

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'tihitnaejigu@gmail.com';

/**
 * GET /public/stats
 * Get public system statistics for landing page
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = {};

        // Total users (approximate or precise)
        const usersResult = await db.query('SELECT COUNT(*) FROM users');
        stats.total_users = parseInt(usersResult.rows[0].count);

        // Total approved events
        const eventsResult = await db.query("SELECT COUNT(*) FROM events WHERE status = 'Approved'");
        stats.total_events = parseInt(eventsResult.rows[0].count);

        // Total registrations
        const regsResult = await db.query('SELECT COUNT(*) FROM registrations');
        stats.total_registrations = parseInt(regsResult.rows[0].count);

        res.json({
            success: true,
            data: {
                stats
            }
        });
    } catch (error) {
        console.error('Get public stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting system statistics'
        });
    }
});

/**
 * POST /public/contact
 * Send a help-center message to support email
 */
router.post(
    '/contact',
    [
        body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
        body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
        body('subject').trim().notEmpty().withMessage('Subject is required').isLength({ max: 200 }),
        body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 5000 }),
        validate
    ],
    async (req, res) => {
        const { name, email, subject, message } = req.body;

        try {
            await transporter.sendMail({
                from: `"EventMate Help Center" <${process.env.SMTP_USER || 'noreply@eventmate.com'}>`,
                to: SUPPORT_EMAIL,
                replyTo: email,
                subject: `[Help Center] ${subject}`,
                text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`,
                html: `
                    <h2>New Help Center Message</h2>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                    <p><strong>Subject:</strong> ${subject}</p>
                    <hr />
                    <p>${message.replace(/\n/g, '<br>')}</p>
                `
            });

            res.json({
                success: true,
                message: 'Your message has been sent. We will get back to you soon.'
            });
        } catch (error) {
            console.error('Contact form email error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to send your message. Please try again or email us directly.'
            });
        }
    }
);

module.exports = router;
