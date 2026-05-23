require('dotenv').config({ path: __dirname + '/../.env' });
const db = require('../db');

async function checkDb() {
    try {
        console.log("--- Registered Users ---");
        const users = await db.query("SELECT id, name, email, role, is_verified FROM users ORDER BY id DESC LIMIT 10");
        console.table(users.rows);

        console.log("\n--- Recent Notifications ---");
        const notifications = await db.query("SELECT id, user_id, message, is_read, sent_at FROM notifications ORDER BY id DESC LIMIT 5");
        console.table(notifications.rows);
    } catch (e) {
        console.error("Error checking database:", e);
    } finally {
        process.exit(0);
    }
}

checkDb();
