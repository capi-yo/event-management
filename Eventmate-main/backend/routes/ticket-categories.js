const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, isOrganizer } = require('../middleware/auth');

/**
 * PUT /ticket-categories/:id
 * Update a ticket category
 */
router.put('/:id', authenticate, isOrganizer, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, capacity } = req.body;

        // Validate input
        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Name is required'
            });
        }

        if (price === undefined || price === null || isNaN(price) || parseFloat(price) < 0) {
            return res.status(400).json({
                success: false,
                message: 'Price must be a positive number'
            });
        }

        if (capacity === undefined || capacity === null || isNaN(capacity) || parseInt(capacity) < 0) {
            return res.status(400).json({
                success: false,
                message: 'Capacity must be a non-negative integer'
            });
        }

        // Check if ticket category exists and belongs to organizer's event
        const checkResult = await db.query(
            `SELECT tc.*, e.organizer_id 
             FROM ticket_categories tc
             JOIN events e ON tc.event_id = e.id
             WHERE tc.id = $1`,
            [id]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Ticket category not found'
            });
        }

        if (checkResult.rows[0].organizer_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to update this ticket category'
            });
        }

        // Update the ticket category
        const result = await db.query(
            `UPDATE ticket_categories 
             SET name = $1, price = $2, capacity = $3, updated_at = CURRENT_TIMESTAMP
             WHERE id = $4
             RETURNING *`,
            [name.trim(), parseFloat(price), parseInt(capacity), id]
        );

        res.json({
            success: true,
            message: 'Ticket category updated successfully',
            data: { ticketCategory: result.rows[0] }
        });
    } catch (error) {
        console.error('Update ticket category error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating ticket category'
        });
    }
});

/**
 * DELETE /ticket-categories/:id
 * Delete a ticket category
 */
router.delete('/:id', authenticate, isOrganizer, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if ticket category exists and belongs to organizer's event
        const checkResult = await db.query(
            `SELECT tc.*, e.organizer_id 
             FROM ticket_categories tc
             JOIN events e ON tc.event_id = e.id
             WHERE tc.id = $1`,
            [id]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Ticket category not found'
            });
        }

        if (checkResult.rows[0].organizer_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this ticket category'
            });
        }

        // Check if there are any registrations for this ticket category
        const registrationsResult = await db.query(
            `SELECT COUNT(*) as count
             FROM registrations
             WHERE event_id = $1 AND ticket_type = $2`,
            [checkResult.rows[0].event_id, checkResult.rows[0].name]
        );

        if (parseInt(registrationsResult.rows[0].count) > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete ticket category with existing registrations'
            });
        }

        // Delete the ticket category
        await db.query('DELETE FROM ticket_categories WHERE id = $1', [id]);

        res.json({
            success: true,
            message: 'Ticket category deleted successfully'
        });
    } catch (error) {
        console.error('Delete ticket category error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting ticket category'
        });
    }
});

module.exports = router;
