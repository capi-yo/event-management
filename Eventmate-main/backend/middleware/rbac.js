/**
 * Role-Based Access Control (RBAC) Middleware
 * Restricts access to specific roles
 */

// Define role hierarchy
const ROLES = {
    'Visitor': 0,
    'Registered User': 1,
    'Organizer': 2,
    'Administrator': 3
};

/**
 * Middleware to check if user has required role
 * @param {string[]} allowedRoles - Array of allowed roles
 */
const checkRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const userRole = req.user.role;
        const userLevel = ROLES[userRole] || 0;

        // Check if user's role is in allowed roles
        const hasPermission = allowedRoles.some(role => {
            const requiredLevel = ROLES[role];
            return userLevel >= requiredLevel;
        });

        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }

        next();
    };
};

/**
 * Middleware to check if user is the owner of a resource
 * @param {string} paramName - The parameter name containing the resource ID
 * @param {string} ownerField - The field name in the resource that contains the owner's ID
 */
const checkOwnership = (paramName, ownerField) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Admin can access everything
        if (req.user.role === 'Administrator') {
            return next();
        }

        const resourceId = req.params[paramName];

        if (!resourceId) {
            return next();
        }

        try {
            const db = require('../db');

            // Determine which table to query based on the parameter
            let table, idField;

            if (paramName === 'id' && req.path.includes('/events')) {
                table = 'events';
                idField = 'id';
            } else if (paramName === 'id' && req.path.includes('/users')) {
                table = 'users';
                idField = 'id';
            } else {
                return next();
            }

            const result = await db.query(
                `SELECT ${ownerField} FROM ${table} WHERE ${idField} = $1`,
                [resourceId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Resource not found'
                });
            }

            const ownerId = result.rows[0][ownerField];

            if (ownerId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only modify your own resources'
                });
            }

            next();
        } catch (error) {
            console.error('Ownership check error:', error);
            return res.status(500).json({
                success: false,
                message: 'Error checking resource ownership'
            });
        }
    };
};

/**
 * Middleware specifically for event organizers
 */
const isOrganizer = checkRole('Organizer', 'Administrator');

/**
 * Middleware specifically for administrators
 */
const isAdmin = checkRole('Administrator');

/**
 * Middleware for registered users (at least)
 */
const isRegisteredUser = checkRole('Registered User', 'Organizer', 'Administrator');

module.exports = {
    checkRole,
    checkOwnership,
    isOrganizer,
    isAdmin,
    isRegisteredUser,
    ROLES
};
