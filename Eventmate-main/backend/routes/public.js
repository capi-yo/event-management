const express = require('express');
const db = require('../db');

const router = express.Router();

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

module.exports = router;
