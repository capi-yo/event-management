const db = require('../db');

/**
 * Insert an in-app notification for a single user.
 */
async function createNotification(userId, message) {
    if (!userId || !message?.trim()) {
        return null;
    }

    const result = await db.query(
        `INSERT INTO notifications (user_id, message)
         VALUES ($1, $2)
         RETURNING id, user_id, message, is_read, sent_at`,
        [userId, message.trim()]
    );

    return result.rows[0];
}

/**
 * Insert the same message for multiple users (deduplicated).
 */
async function createNotifications(userIds, message) {
    const uniqueIds = [...new Set(userIds.filter((id) => id != null))];
    const created = [];

    for (const userId of uniqueIds) {
        const row = await createNotification(userId, message);
        if (row) created.push(row);
    }

    return created;
}

module.exports = {
    createNotification,
    createNotifications,
};
