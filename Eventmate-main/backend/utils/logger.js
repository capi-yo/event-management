const db = require('../db');

/**
 * Activity Logger
 * Logs user actions for security and monitoring
 */
const logger = {
    /**
     * Log an activity
     * @param {Object} options - Log options
     * @param {number} options.userId - User ID (optional)
     * @param {string} options.action - Action description
     * @param {string} options.entityType - Type of entity (e.g., 'event', 'user', 'registration')
     * @param {number} options.entityId - ID of the entity
     * @param {Object} options.details - Additional details (optional)
     * @param {string} options.ipAddress - IP address of the request
     */
    log: async ({ userId, action, entityType, entityId, details, ipAddress }) => {
        try {
            await db.query(
                `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [userId, action, entityType, entityId, JSON.stringify(details || {}), ipAddress]
            );
        } catch (error) {
            console.error('Error logging activity:', error);
            // Don't throw - logging should not break the application
        }
    }
};

// Middleware to automatically log requests
const activityLogger = (entityType) => {
    return async (req, res, next) => {
        // Store original send function
        const originalSend = res.send;

        res.send = function (body) {
            // Log after response is sent
            const statusCode = res.statusCode;
            const action = `${req.method} ${entityType}`;

            if (req.user && statusCode >= 200 && statusCode < 300) {
                logger.log({
                    userId: req.user.id,
                    action,
                    entityType,
                    entityId: req.params.id,
                    details: {
                        method: req.method,
                        path: req.path,
                        statusCode
                    },
                    ipAddress: req.ip || req.connection.remoteAddress
                });
            }

            return originalSend.call(this, body);
        };

        next();
    };
};

module.exports = {
    logger,
    activityLogger
};
