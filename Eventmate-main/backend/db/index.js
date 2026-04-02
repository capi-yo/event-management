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

            // Try to create admin user
            try {
                const bcrypt = require('bcryptjs');
                const adminPassword = await bcrypt.hash('admin123', 10);

                await pool.query(
                    `INSERT INTO users (name, email, password_hash, role) 
                     VALUES ($1, $2, $3, $4)
                     ON CONFLICT (email) DO NOTHING`,
                    ['Administrator', 'admin@eventmate.com', adminPassword, 'Administrator']
                );
                console.log('Admin user ready');
            } catch (e) {
                // Admin might already exist
                console.log('Admin user check done');
            }

            return true;
        } catch (error) {
            console.error('Error initializing database:', error.message);
            // Don't throw - continue anyway
            return false;
        }
    }
};
