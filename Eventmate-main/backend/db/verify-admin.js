const db = require('./index');

async function run() {
    try {
        // Verify all seeded developer accounts in the PostgreSQL database
        const emails = [
            'admin@eventmate.com',
            'organizer@eventmate.com',
            'sarah@eventmate.com'
        ];

        for (const email of emails) {
            await db.query("UPDATE users SET is_verified = TRUE WHERE email = $1;", [email]);
            console.log(`Success: Seed user [${email}] has been marked as verified in the database!`);
        }
    } catch (err) {
        console.error("Error updating seed users:", err);
    } finally {
        process.exit(0);
    }
}

run();
