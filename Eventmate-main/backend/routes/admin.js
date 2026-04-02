const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/rbac');
const { adminValidation } = require('../middleware/validation');
const { logger } = require('../utils/logger');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate, isAdmin);

/**
 * GET /admin/pending-events
 * List events awaiting moderation
 */
router.get('/pending-events', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const countResult = await db.query(
            "SELECT COUNT(*) FROM events WHERE status = 'Pending'"
        );
        const total = parseInt(countResult.rows[0].count);

        const result = await db.query(
            `SELECT e.*, u.name as organizer_name, u.email as organizer_email
             FROM events e
             JOIN users u ON e.organizer_id = u.id
             WHERE e.status = 'Pending'
             ORDER BY e.created_at ASC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        res.json({
            success: true,
            data: {
                events: result.rows,
                pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
            }
        });
    } catch (error) {
        console.error('Get pending events error:', error);
        res.status(500).json({ success: false, message: 'Error getting pending events' });
    }
});

/**
 * GET /admin/events
 * Get all events for admin
 */
router.get('/events', async (req, res) => {
    try {
        const { page = 1, limit = 10, status, category } = req.query;

        const conditions = [];
        const values = [];
        let paramCount = 1;

        if (status) {
            conditions.push('e.status = $' + paramCount);
            values.push(status);
            paramCount++;
        }

        if (category) {
            conditions.push('e.category = $' + paramCount);
            values.push(category);
            paramCount++;
        }

        const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        const countResult = await db.query('SELECT COUNT(*) FROM events e ' + whereClause, values);
        const total = parseInt(countResult.rows[0].count);

        const offset = (page - 1) * limit;
        values.push(limit, offset);

        const result = await db.query(
            'SELECT e.*, u.name as organizer_name, u.email as organizer_email, (SELECT COUNT(*) FROM registrations WHERE event_id = e.id) as registered_count FROM events e JOIN users u ON e.organizer_id = u.id ' + whereClause + ' ORDER BY e.created_at DESC LIMIT $' + paramCount + ' OFFSET $' + (paramCount + 1),
            values
        );

        res.json({
            success: true,
            data: {
                events: result.rows,
                pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
            }
        });
    } catch (error) {
        console.error('Get admin events error:', error);
        res.status(500).json({ success: false, message: 'Error getting events' });
    }
});

/**
 * PATCH /admin/events/:id/status
 * Approve or reject events
 */
router.patch('/events/:id/status', adminValidation.updateEventStatus, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const eventCheck = await db.query('SELECT * FROM events WHERE id = $1', [id]);
        if (eventCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        const event = eventCheck.rows[0];
        const result = await db.query(
            'UPDATE events SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [status, id]
        );

        await db.query(
            'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
            [event.organizer_id, 'Your event "' + event.title + '" has been ' + status.toLowerCase() + '.']
        );

        res.json({ success: true, message: 'Event ' + status.toLowerCase() + ' successfully', data: { event: result.rows[0] } });
    } catch (error) {
        console.error('Update event status error:', error);
        res.status(500).json({ success: false, message: 'Error updating event status' });
    }
});

/**
 * DELETE /admin/events/:id
 * Delete an event
 */
router.delete('/events/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const eventCheck = await db.query('SELECT id, title FROM events WHERE id = $1', [id]);
        if (eventCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        await db.query('DELETE FROM events WHERE id = $1', [id]);

        res.json({ success: true, message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Delete event error:', error);
        res.status(500).json({ success: false, message: 'Error deleting event' });
    }
});

/**
 * GET /admin/users
 * Get all users
 */
router.get('/users', adminValidation.userList, async (req, res) => {
    try {
        const { page = 1, limit = 10, role, status, search } = req.query;

        const conditions = [];
        const values = [];
        let paramCount = 1;

        if (role) {
            conditions.push('role = $' + paramCount);
            values.push(role);
            paramCount++;
        }

        if (status) {
            conditions.push('status = $' + paramCount);
            values.push(status);
            paramCount++;
        }

        if (search) {
            conditions.push(`(name ILIKE $${paramCount} OR email ILIKE $${paramCount})`);
            values.push(`%${search}%`);
            paramCount++;
        }

        const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        const countResult = await db.query('SELECT COUNT(*) FROM users ' + whereClause, values);
        const total = parseInt(countResult.rows[0].count);

        const offset = (page - 1) * limit;
        values.push(limit, offset);

        const result = await db.query(
            'SELECT id, name, email, role, status, created_at, (SELECT COUNT(*) FROM events WHERE organizer_id = users.id) as events_count FROM users ' + whereClause + ' ORDER BY created_at DESC LIMIT $' + paramCount + ' OFFSET $' + (paramCount + 1),
            values
        );

        const users = result.rows.map(user => ({ ...user, status: user.status || 'Active' }));

        res.json({
            success: true,
            data: {
                users: users,
                pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ success: false, message: 'Error getting users' });
    }
});

/**
 * GET /admin/users/:id
 * Get user details
 */
router.get('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const userResult = await db.query(
            'SELECT id, name, email, role, status, created_at, updated_at FROM users WHERE id = $1',
            [id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = userResult.rows[0];

        const eventsOrganized = await db.query(
            'SELECT id, title, date, status FROM events WHERE organizer_id = $1 ORDER BY date DESC LIMIT 10',
            [id]
        );

        const eventsBooked = await db.query(
            'SELECT e.id, e.title, e.date, r.status as registration_status FROM registrations r JOIN events e ON r.event_id = e.id WHERE r.user_id = $1 ORDER BY e.date DESC LIMIT 10',
            [id]
        );

        res.json({
            success: true,
            data: {
                user: user,
                events_organized: eventsOrganized.rows,
                events_booked: eventsBooked.rows,
                stats: { events_organized: eventsOrganized.rows.length, events_booked: eventsBooked.rows.length }
            }
        });
    } catch (error) {
        console.error('Get user details error:', error);
        res.status(500).json({ success: false, message: 'Error getting user details' });
    }
});

/**
 * PATCH /admin/users/:id
 * Update user (suspend/activate)
 */
router.patch('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, role, status } = req.body;

        const userCheck = await db.query('SELECT id, name, email, role, status FROM users WHERE id = $1', [id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const updates = [];
        const values = [];
        let paramCount = 1;

        if (name) {
            updates.push('name = $' + paramCount);
            values.push(name);
            paramCount++;
        }

        if (role) {
            updates.push('role = $' + paramCount);
            values.push(role);
            paramCount++;
        }

        if (status) {
            updates.push('status = $' + paramCount);
            values.push(status);
            paramCount++;
        }

        if (updates.length > 0) {
            values.push(id);
            await db.query(
                'UPDATE users SET ' + updates.join(', ') + ', updated_at = CURRENT_TIMESTAMP WHERE id = $' + paramCount,
                values
            );
        }

        const updatedUser = await db.query('SELECT id, name, email, role, status FROM users WHERE id = $1', [id]);

        res.json({ success: true, message: 'User updated successfully', data: { user: updatedUser.rows[0] } });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ success: false, message: 'Error updating user' });
    }
});

/**
 * DELETE /admin/users/:id
 * Delete user
 */
router.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const userCheck = await db.query('SELECT id, name FROM users WHERE id = $1', [id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        await db.query('DELETE FROM users WHERE id = $1', [id]);

        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ success: false, message: 'Error deleting user' });
    }
});

/**
 * GET /admin/stats
 * Get dashboard statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const usersResult = await db.query('SELECT COUNT(*) as total_users FROM users');
        const roleResult = await db.query('SELECT role, COUNT(*) as count FROM users GROUP BY role');
        const statusResult = await db.query('SELECT status, COUNT(*) as count FROM users GROUP BY status');
        const eventsResult = await db.query('SELECT COUNT(*) as total_events FROM events');
        const eventStatusResult = await db.query("SELECT status, COUNT(*) as count FROM events GROUP BY status");
        const registrationsResult = await db.query('SELECT COUNT(*) as total_registrations FROM registrations');

        const recentRegistrations = await db.query(
            'SELECT r.*, e.title as event_title, u.name as user_name FROM registrations r JOIN events e ON r.event_id = e.id JOIN users u ON r.user_id = u.id LIMIT 5'
        );

        res.json({
            success: true,
            data: {
                stats: {
                    total_users: parseInt(usersResult.rows[0].total_users),
                    total_events: parseInt(eventsResult.rows[0].total_events),
                    total_registrations: parseInt(registrationsResult.rows[0].total_registrations),
                    users_by_role: roleResult.rows,
                    users_by_status: statusResult.rows,
                    events_by_status: eventStatusResult.rows
                },
                recent_registrations: recentRegistrations.rows
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ success: false, message: 'Error getting stats' });
    }
});

/**
 * GET /admin/audit
 * Get audit logs from activity_logs table
 */
router.get('/audit', async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const countResult = await db.query('SELECT COUNT(*) FROM activity_logs');
        const total = parseInt(countResult.rows[0].count);

        const result = await db.query(
            `SELECT al.*, u.email as user_email 
             FROM activity_logs al 
             LEFT JOIN users u ON al.user_id = u.id 
             ORDER BY al.created_at DESC 
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        const statsResult = await db.query(
            `SELECT 
                COUNT(*) as total,
                COUNT(*) as success_count,
                0 as warning_count,
                0 as error_count
             FROM activity_logs`
        );

        res.json({
            success: true,
            data: {
                logs: result.rows,
                stats: statsResult.rows[0],
                total,
                pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
            }
        });
    } catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json({ success: false, message: 'Error getting audit logs' });
    }
});

/**
 * GET /admin/reports
 * Get reports from reports table
 */
router.get('/reports', async (req, res) => {
    try {
        const { page = 1, limit = 20, status, type } = req.query;
        const offset = (page - 1) * limit;

        const conditions = [];
        const values = [];
        let paramCount = 1;

        if (status && status !== 'all') {
            conditions.push('r.status = $' + paramCount);
            values.push(status);
            paramCount++;
        }

        if (type && type !== 'all') {
            conditions.push('r.target_type = $' + paramCount);
            values.push(type);
            paramCount++;
        }

        const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        const countResult = await db.query('SELECT COUNT(*) FROM reports r ' + whereClause, values);
        const total = parseInt(countResult.rows[0].count);

        values.push(limit, offset);
        const result = await db.query(
            `SELECT r.*, u.email as reporter_email 
             FROM reports r 
             LEFT JOIN users u ON r.reporter_id = u.id 
             ${whereClause} 
             ORDER BY r.created_at DESC 
             LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
            values
        );

        res.json({
            success: true,
            data: {
                reports: result.rows,
                pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
            }
        });
    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({ success: false, message: 'Error getting reports' });
    }
});

/**
 * PATCH /admin/reports/:id
 * Update report status
 */
router.patch('/reports/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const reportCheck = await db.query('SELECT id FROM reports WHERE id = $1', [id]);
        if (reportCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }

        await db.query(
            'UPDATE reports SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [status, id]
        );

        res.json({ success: true, message: 'Report status updated successfully' });
    } catch (error) {
        console.error('Update report status error:', error);
        res.status(500).json({ success: false, message: 'Error updating report status' });
    }
});

/**
 * GET /admin/registrations
 * Get all registrations across all events (Admin)
 */
router.get('/registrations', async (req, res) => {
    try {
        const { event_id, status, user_id, page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const limitNum = parseInt(limit);

        // Build queries based on filters - using simple string concatenation for dynamic query
        let whereClause = '';
        const conditions = [];

        if (event_id) {
            conditions.push(`r.event_id = ${parseInt(event_id)}`);
        }
        if (status) {
            conditions.push(`r.status = '${status}'`);
        }
        if (user_id) {
            conditions.push(`r.user_id = ${parseInt(user_id)}`);
        }
        if (conditions.length > 0) {
            whereClause = 'WHERE ' + conditions.join(' AND ');
        }

        // Get total count
        const countResult = await db.query(
            `SELECT COUNT(*) FROM registrations r ${whereClause}`
        );
        const total = parseInt(countResult.rows[0].count);

        // Get paginated data
        const result = await db.query(
            `SELECT r.*, r.payment_method, r.transaction_ref, r.timestamp as created_at, 
                    e.title as event_title, e.date as event_date, e.time as event_time,
                    u.name as user_name, u.email as user_email
             FROM registrations r
             JOIN events e ON r.event_id = e.id
             JOIN users u ON r.user_id = u.id
             ${whereClause}
             ORDER BY r.timestamp DESC
             LIMIT ${limitNum} OFFSET ${offset}`
        );

        res.json({
            success: true,
            data: {
                registrations: result.rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        console.error('Get registrations error:', error);
        res.status(500).json({ success: false, message: 'Error getting registrations' });
    }
});

/**
 * PATCH /admin/registrations/:id
 * Update registration status (approve/reject payment)
 */
router.patch('/registrations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate status
        const validStatuses = ['Confirmed', 'Pending', 'Cancelled', 'Checked-In', 'RSVPed', 'Purchased'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
            });
        }

        // Check if registration exists
        const regCheck = await db.query('SELECT * FROM registrations WHERE id = $1', [id]);
        if (regCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Registration not found' });
        }

        // Update status
        await db.query(
            'UPDATE registrations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [status, id]
        );

        res.json({ success: true, message: 'Registration status updated successfully' });
    } catch (error) {
        console.error('Update registration status error:', error);
        res.status(500).json({ success: false, message: 'Error updating registration status' });
    }
});

module.exports = router;
