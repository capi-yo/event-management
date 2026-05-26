/**
 * Database initialization script
 */
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'eventmate',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

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

// Check if a statement is only comments (not a real SQL statement)
function isOnlyComment(stmt) {
    const trimmed = stmt.trim();
    // Remove line comments and check if anything remains
    const withoutLineComments = trimmed.split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join(' ')
        .trim();

    // Check if it's just block comments
    return withoutLineComments === '' ||
        withoutLineComments.startsWith('/*');
}

// Get the main command type from a statement
function getStatementType(stmt) {
    const upper = stmt.toUpperCase();
    if (upper.includes('CREATE TABLE')) return 'CREATE TABLE';
    if (upper.includes('CREATE INDEX')) return 'CREATE INDEX';
    if (upper.includes('INSERT')) return 'INSERT';
    return 'OTHER';
}

const initializeDatabase = async () => {
    try {
        console.log('Reading schema file...');
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('Creating tables...');

        const statements = splitSQL(schema);
        console.log(`Found ${statements.length} total statements`);

        // Filter out statements that are only comments
        const validStatements = statements.filter(s => !isOnlyComment(s));
        console.log(`Found ${validStatements.length} valid statements`);

        // Print what we have
        for (let i = 0; i < validStatements.length; i++) {
            console.log(`Stmt ${i}: ${getStatementType(validStatements[i])}`);
        }

        let createdCount = 0;

        for (let i = 0; i < validStatements.length; i++) {
            const stmt = validStatements[i];
            const stmtType = getStatementType(stmt);
            const preview = stmt.substring(0, 50).replace(/\s+/g, ' ');

            console.log(`Executing ${i + 1}/${validStatements.length} [${stmtType}]: ${preview}...`);

            try {
                await pool.query(stmt);
                createdCount++;
                console.log(`  ✓ Success`);
            } catch (err) {
                console.log(`  ✗ Error: ${err.message.substring(0, 80)}`);
            }
        }

        console.log(`\nExecuted ${createdCount} statements`);

        // Verify tables exist
        const checkResult = await pool.query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
        );
        console.log('Tables found:', checkResult.rows.map(r => r.table_name).join(', '));

        if (checkResult.rows.length === 0) {
            throw new Error('No tables created!');
        }

        // Create admin user
        console.log('Creating admin user...');
        const adminPassword = await bcrypt.hash('admin123', 10);

        await pool.query(
            `INSERT INTO users (name, email, password_hash, role, is_verified) 
             VALUES ($1, $2, $3, $4, TRUE)
             ON CONFLICT (email) DO NOTHING`,
            ['Administrator', 'admin@eventmate.com', adminPassword, 'Administrator']
        );

        console.log('Admin user ready: admin@eventmate.com / admin123');

        // Migration: Add missing columns to registrations table
        console.log('Running migrations for registrations table...');
        try {
            await pool.query(
                `ALTER TABLE registrations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
            );
            console.log('  ✓ Added updated_at column');
        } catch (err) {
            console.log('  ✗ updated_at column: ' + err.message.substring(0, 50));
        }
        try {
            await pool.query(
                `ALTER TABLE registrations ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10, 2) DEFAULT 0.00`
            );
            console.log('  ✓ Added paid_amount column');
        } catch (err) {
            console.log('  ✗ paid_amount column: ' + err.message.substring(0, 50));
        }
        try {
            await pool.query(
                `ALTER TABLE registrations ADD COLUMN IF NOT EXISTS ticket_type VARCHAR(100)`
            );
            console.log('  ✓ Added ticket_type column');
        } catch (err) {
            console.log('  ✗ ticket_type column: ' + err.message.substring(0, 50));
        }
        try {
            await pool.query(
                `ALTER TABLE registrations ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50)`
            );
            console.log('  ✓ Added payment_method column');
        } catch (err) {
            console.log('  ✗ payment_method column: ' + err.message.substring(0, 50));
        }
        try {
            await pool.query(
                `ALTER TABLE registrations ADD COLUMN IF NOT EXISTS transaction_ref VARCHAR(100)`
            );
            console.log('  ✓ Added transaction_ref column');
        } catch (err) {
            console.log('  ✗ transaction_ref column: ' + err.message.substring(0, 50));
        }

        // Migration: Update registrations_status_check constraint
        console.log('Updating registrations_status_check constraint...');
        try {
            await pool.query(`
                ALTER TABLE registrations 
                DROP CONSTRAINT IF EXISTS registrations_status_check;
                
                ALTER TABLE registrations 
                ADD CONSTRAINT registrations_status_check 
                CHECK (status IN ('RSVPed', 'Purchased', 'Confirmed', 'Pending', 'Cancelled', 'Checked-In'));
            `);
            console.log('  ✓ Updated registrations_status_check constraint');
        } catch (err) {
            console.log('  ✗ registrations_status_check migration: ' + err.message.substring(0, 50));
        }

        // Migration: Email verification columns on users table
        console.log('Running migrations for users table (verification)...');
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
                console.log('  ✓ User verification migration applied');
            } catch (err) {
                console.log('  ✗ User verification migration: ' + err.message.substring(0, 50));
            }
        }

        // Migration: Add discount columns to ticket_categories table
        console.log('Running migrations for ticket_categories table...');
        try {
            await pool.query(
                `ALTER TABLE ticket_categories ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20) DEFAULT 'none' CHECK (discount_type IN ('none', 'percentage', 'fixed'))`
            );
            console.log('  ✓ Added discount_type column to ticket_categories');
        } catch (err) {
            console.log('  ✗ discount_type column migration: ' + err.message.substring(0, 50));
        }
        try {
            await pool.query(
                `ALTER TABLE ticket_categories ADD COLUMN IF NOT EXISTS discount_value DECIMAL(10, 2) DEFAULT 0.00`
            );
            console.log('  ✓ Added discount_value column to ticket_categories');
        } catch (err) {
            console.log('  ✗ discount_value column migration: ' + err.message.substring(0, 50));
        }

        // EventMate Local Bank tables
        console.log('Running migrations for EventMate Bank...');
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
        ];
        for (const stmt of bankMigrations) {
            try {
                await pool.query(stmt);
            } catch (err) {
                console.log('  ✗ Bank migration: ' + err.message.substring(0, 50));
            }
        }
        try {
            const { backfillAccountsForAllUsers } = require('../utils/bankService');
            await backfillAccountsForAllUsers();
            console.log('  ✓ Bank accounts backfilled for all users');
        } catch (err) {
            console.log('  ✗ Bank backfill: ' + err.message.substring(0, 50));
        }

        console.log('\nDatabase initialization complete!');

    } catch (error) {
        console.error('Error:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
};

initializeDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
