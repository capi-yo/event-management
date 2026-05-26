const { Pool } = require('pg');
require('dotenv').config();

// Create a new pool with environment variables
const poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'eventmate',
    user: process.env.DB_USER || 'postgres',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};

// Use empty string if password is not set
const dbPassword = process.env.DB_PASSWORD;
if (dbPassword !== undefined && dbPassword !== null && dbPassword !== '') {
    poolConfig.password = dbPassword;
}

const pool = new Pool(poolConfig);

// Test the connection
pool.on('connect', () => {
    console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// Export the pool for use in other modules
module.exports = {
    query: (text, params) => pool.query(text, params),
    pool,

    // Helper method to get a client from the pool
    getClient: () => pool.connect(),

    // Method to initialize the database with schema
    initialize: async () => {
        const fs = require('fs');
        const path = require('path');

        try {
            // Try to read schema file and execute
            const schemaPath = path.join(__dirname, 'schema.sql');
            const schema = fs.readFileSync(schemaPath, 'utf8');

            console.log('Initializing database schema...');

            // Better SQL splitter that handles comments properly
            function splitSQL(sql) {
                const statements = [];
                let current = '';
                let inString = false;
                let parenDepth = 0;
                let i = 0;

                while (i < sql.length) {
                    const char = sql[i];

                    // Handle string literals
                    if (char === "'" && (i === 0 || sql[i - 1] !== '\\')) {
                        inString = !inString;
                    }

                    // Track parentheses
                    if (char === '(' && !inString) parenDepth++;
                    if (char === ')' && !inString) parenDepth--;

                    // Split at semicolons outside of strings and parentheses
                    if (char === ';' && !inString && parenDepth === 0) {
                        if (current.trim()) {
                            statements.push(current.trim());
                        }
                        current = '';
                    } else {
                        current += char;
                    }
                    i++;
                }

                // Add last statement if any
                if (current.trim()) {
                    statements.push(current.trim());
                }

                return statements;
            }

            // Check if a statement is only comments
            function isOnlyComment(stmt) {
                const trimmed = stmt.trim();
                const withoutLineComments = trimmed.split('\n')
                    .filter(line => !line.trim().startsWith('--'))
                    .join(' ')
                    .trim();
                return withoutLineComments === '' || withoutLineComments.startsWith('/*');
            }

            const statements = splitSQL(schema);
            console.log(`Found ${statements.length} statements to execute`);

            for (const stmt of statements) {
                if (stmt && !isOnlyComment(stmt)) {
                    try {
                        await pool.query(stmt);
                    } catch (e) {
                        // Ignore errors - table may already exist
                    }
                }
            }

            console.log('Database schema initialized');

            // Email verification / password reset columns
            const userMigrations = [
                'ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE',
                'ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code VARCHAR(10)',
                'ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code_expires TIMESTAMP',
                'ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(10)',
                'ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP',
            ];
            for (const stmt of userMigrations) {
                try {
                    await pool.query(stmt);
                } catch (e) {
                    // Column may already exist with different definition
                }
            }

            // Try to create admin user
            try {
                const bcrypt = require('bcryptjs');
                const adminPassword = await bcrypt.hash('admin123', 10);

                await pool.query(
                    `INSERT INTO users (name, email, password_hash, role, is_verified) 
                     VALUES ($1, $2, $3, $4, TRUE)
                     ON CONFLICT (email) DO NOTHING`,
                    ['Administrator', 'admin@eventmate.com', adminPassword, 'Administrator']
                );
                console.log('Admin user ready');
            } catch (e) {
                // Admin might already exist
                console.log('Admin user check done');
            }

            // EventMate Local Bank tables
            const bankMigrations = [
                `CREATE TABLE IF NOT EXISTS bank_accounts (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    account_number VARCHAR(20) UNIQUE NOT NULL,
                    balance DECIMAL(12, 2) NOT NULL DEFAULT 1000.00,
                    currency VARCHAR(3) NOT NULL DEFAULT 'ETB',
                    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'frozen')),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )`,
                `CREATE TABLE IF NOT EXISTS bank_transactions (
                    id SERIAL PRIMARY KEY,
                    reference VARCHAR(32) UNIQUE NOT NULL,
                    from_account_id INTEGER REFERENCES bank_accounts(id) ON DELETE SET NULL,
                    to_account_id INTEGER REFERENCES bank_accounts(id) ON DELETE SET NULL,
                    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
                    type VARCHAR(30) NOT NULL CHECK (type IN ('ticket_purchase', 'deposit', 'withdrawal', 'refund', 'transfer')),
                    status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'reversed')),
                    registration_id INTEGER REFERENCES registrations(id) ON DELETE SET NULL,
                    event_id INTEGER REFERENCES events(id) ON DELETE SET NULL,
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )`,
                'CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts(user_id)',
                'CREATE INDEX IF NOT EXISTS idx_bank_transactions_reference ON bank_transactions(reference)',
            ];
            for (const stmt of bankMigrations) {
                try {
                    await pool.query(stmt);
                } catch (e) {
                    // Table may already exist
                }
            }
            try {
                const { backfillAccountsForAllUsers } = require('../utils/bankService');
                await backfillAccountsForAllUsers();
                console.log('Bank accounts ready for all users');
            } catch (e) {
                console.log('Bank account backfill:', e.message?.substring(0, 60) || 'skipped');
            }

            return true;
        } catch (error) {
            console.error('Error initializing database:', error.message);
            // Don't throw - continue anyway
            return false;
        }
    }
};
