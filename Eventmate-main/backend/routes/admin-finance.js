const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/rbac');

const router = express.Router();

// All routes here require authentication and Administrator role
router.use(authenticate, isAdmin);

/**
 * GET /admin/finance/settings
 * Fetch the current admin platform commission rate setting.
 */
router.get('/settings', async (req, res) => {
    try {
        const result = await db.query(
            "SELECT value FROM system_settings WHERE key = 'admin_commission_rate'"
        );
        let rate = 10.00; // Default fallback
        if (result.rows.length > 0) {
            rate = parseFloat(result.rows[0].value);
        }
        res.json({
            success: true,
            data: {
                commission_rate: rate
            }
        });
    } catch (error) {
        console.error('Fetch finance settings error:', error);
        res.status(500).json({ success: false, message: 'Error fetching commission rate settings' });
    }
});

/**
 * POST /admin/finance/settings
 * Update the system-wide commission rate.
 */
router.post('/settings', async (req, res) => {
    try {
        const { commission_rate } = req.body;
        const rate = parseFloat(commission_rate);
        
        if (isNaN(rate) || rate < 0 || rate > 100) {
            return res.status(400).json({
                success: false,
                message: 'Commission rate must be a valid number between 0% and 100%'
            });
        }

        await db.query(
            `INSERT INTO system_settings (key, value, updated_at)
             VALUES ('admin_commission_rate', $1, CURRENT_TIMESTAMP)
             ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP`,
            [rate.toFixed(2)]
        );

        res.json({
            success: true,
            message: `Platform commission rate successfully updated to ${rate.toFixed(2)}%`,
            data: {
                commission_rate: rate
            }
        });
    } catch (error) {
        console.error('Update finance settings error:', error);
        res.status(500).json({ success: false, message: 'Error updating commission rate settings' });
    }
});

/**
 * GET /admin/finance/analytics
 * Retrieve total statistics, recent commission ledgers, monthly trends, and organizer payout metrics.
 */
router.get('/analytics', async (req, res) => {
    try {
        // 1. Overall stats
        const statsQuery = await db.query(`
            SELECT 
                COALESCE(SUM(ticket_price), 0)::FLOAT as total_gross,
                COALESCE(SUM(commission_amount), 0)::FLOAT as total_commission,
                COALESCE(SUM(organizer_amount), 0)::FLOAT as total_organizer,
                COUNT(id)::INT as total_tickets_sold
            FROM platform_commissions
        `);
        const stats = statsQuery.rows[0];

        // 2. Recent commissions split list
        const recentCommissionsQuery = await db.query(`
            SELECT 
                pc.*, 
                e.title as event_title, 
                u.name as organizer_name, 
                u.email as organizer_email,
                buyer.name as buyer_name, 
                buyer.email as buyer_email,
                r.transaction_ref
            FROM platform_commissions pc
            JOIN events e ON pc.event_id = e.id
            JOIN users u ON pc.organizer_id = u.id
            JOIN registrations r ON pc.registration_id = r.id
            JOIN users buyer ON r.user_id = buyer.id
            ORDER BY pc.created_at DESC
            LIMIT 50
        `);
        const recentCommissions = recentCommissionsQuery.rows.map(row => ({
            ...row,
            ticket_price: parseFloat(row.ticket_price),
            commission_rate: parseFloat(row.commission_rate),
            commission_amount: parseFloat(row.commission_amount),
            organizer_amount: parseFloat(row.organizer_amount),
        }));

        // 3. Organizer Earnings & Wallets
        const organizerEarningsQuery = await db.query(`
            SELECT 
                u.id as organizer_id, 
                u.name as organizer_name, 
                u.email as organizer_email,
                COUNT(pc.id)::INT as tickets_sold,
                COALESCE(SUM(pc.ticket_price), 0)::FLOAT as gross_revenue,
                COALESCE(SUM(pc.commission_amount), 0)::FLOAT as platform_commission,
                COALESCE(SUM(pc.organizer_amount), 0)::FLOAT as organizer_earnings,
                COALESCE(ba.balance, 0)::FLOAT as wallet_balance,
                COALESCE(ba.account_number, '') as account_number
            FROM users u
            LEFT JOIN platform_commissions pc ON u.id = pc.organizer_id
            LEFT JOIN bank_accounts ba ON u.id = ba.user_id
            WHERE u.role = 'Organizer'
            GROUP BY u.id, u.name, u.email, ba.balance, ba.account_number
            ORDER BY organizer_earnings DESC
        `);
        const organizerEarnings = organizerEarningsQuery.rows;

        // 4. Daily/Monthly revenue trend (for interactive charting)
        const trendQuery = await db.query(`
            SELECT 
                TO_CHAR(pc.created_at, 'YYYY-MM-DD') as date,
                COALESCE(SUM(pc.ticket_price), 0)::FLOAT as gross_revenue,
                COALESCE(SUM(pc.commission_amount), 0)::FLOAT as platform_commission,
                COALESCE(SUM(pc.organizer_amount), 0)::FLOAT as organizer_earnings,
                COUNT(pc.id)::INT as ticket_sales
            FROM platform_commissions pc
            GROUP BY TO_CHAR(pc.created_at, 'YYYY-MM-DD')
            ORDER BY date ASC
            LIMIT 30
        `);
        const trend = trendQuery.rows;

        // Get current system setting rate
        const currentRateResult = await db.query(
            "SELECT value FROM system_settings WHERE key = 'admin_commission_rate'"
        );
        const commissionRate = currentRateResult.rows.length > 0 ? parseFloat(currentRateResult.rows[0].value) : 10.00;

        res.json({
            success: true,
            data: {
                stats,
                commission_rate: commissionRate,
                recent_commissions: recentCommissions,
                organizer_earnings: organizerEarnings,
                revenue_trend: trend
            }
        });
    } catch (error) {
        console.error('Get finance analytics error:', error);
        res.status(500).json({ success: false, message: 'Error fetching financial analytics' });
    }
});

module.exports = router;
