require('dotenv').config({ path: __dirname + '/../.env' });
const db = require('./index');

async function migrate() {
    try {
        console.log("Running notifications role migration...");
        await db.query("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'User'");
        console.log("Migration successful: added 'role' column to 'notifications' table!");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        process.exit(0);
    }
}

migrate();
