const db = require('../db');
const { calculateDiscountedPrice } = require('./pricing');

const STARTING_BALANCE = parseFloat(process.env.BANK_STARTING_BALANCE || '1000');
const MAX_DEPOSIT_AMOUNT = parseFloat(process.env.BANK_MAX_DEPOSIT || '10000');

function formatAccountNumber(userId) {
    return `EM${String(userId).padStart(8, '0')}`;
}

function generateTransactionReference() {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `EMTX-${ts}-${rand}`;
}

/**
 * Create a bank account for a user if missing.
 */
async function ensureBankAccount(userId, client = null) {
    const query = client ? client.query.bind(client) : db.query;

    const existing = await query(
        'SELECT * FROM bank_accounts WHERE user_id = $1',
        [userId]
    );
    if (existing.rows.length > 0) {
        return existing.rows[0];
    }

    const accountNumber = formatAccountNumber(userId);
    const result = await query(
        `INSERT INTO bank_accounts (user_id, account_number, balance, currency, status)
         VALUES ($1, $2, $3, 'ETB', 'active')
         ON CONFLICT (user_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [userId, accountNumber, STARTING_BALANCE]
    );
    return result.rows[0];
}

async function getAccountByUserId(userId) {
    const account = await ensureBankAccount(userId);
    return account;
}

async function getAccountWithTransactions(userId, limit = 20) {
    const account = await ensureBankAccount(userId);
    const txResult = await db.query(
        `SELECT bt.*,
                fa.account_number as from_account_number,
                ta.account_number as to_account_number
         FROM bank_transactions bt
         LEFT JOIN bank_accounts fa ON bt.from_account_id = fa.id
         LEFT JOIN bank_accounts ta ON bt.to_account_id = ta.id
         WHERE bt.from_account_id = $1 OR bt.to_account_id = $1
         ORDER BY bt.created_at DESC
         LIMIT $2`,
        [account.id, limit]
    );
    return { account, transactions: txResult.rows };
}

/**
 * Add demo funds to the user's wallet.
 */
async function deposit(userId, amount) {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
        return { error: 'Deposit amount must be greater than zero' };
    }
    if (parsed > MAX_DEPOSIT_AMOUNT) {
        return { error: `Maximum deposit per transaction is ETB ${MAX_DEPOSIT_AMOUNT}` };
    }

    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        const account = await ensureBankAccount(userId, client);
        if (account.status === 'frozen') {
            await client.query('ROLLBACK');
            return { error: 'Your bank account is frozen' };
        }

        const reference = generateTransactionReference();
        await client.query(
            `UPDATE bank_accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [parsed, account.id]
        );
        await client.query(
            `INSERT INTO bank_transactions (reference, from_account_id, to_account_id, amount, type, status, description)
             VALUES ($1, NULL, $2, $3, 'deposit', 'completed', $4)`,
            [reference, account.id, parsed, `Demo deposit of ETB ${parsed.toFixed(2)}`]
        );
        const updated = await client.query('SELECT * FROM bank_accounts WHERE id = $1', [account.id]);
        await client.query('COMMIT');
        return { account: updated.rows[0], reference };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Purchase event ticket using EventMate Local Bank (atomic transfer).
 */
async function purchaseTicketWithBank(buyerUserId, eventId, ticketCategoryId) {
    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        const eventResult = await client.query('SELECT * FROM events WHERE id = $1', [eventId]);
        if (eventResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return { error: 'Event not found', status: 404 };
        }
        const event = eventResult.rows[0];

        if (event.status !== 'Approved') {
            await client.query('ROLLBACK');
            return { error: 'Event is not available for registration', status: 400 };
        }
        if (!event.is_paid) {
            await client.query('ROLLBACK');
            return { error: 'This is a free event. Please use the RSVP endpoint.', status: 400 };
        }

        const ticketResult = await client.query(
            'SELECT * FROM ticket_categories WHERE id = $1 AND event_id = $2',
            [ticketCategoryId, eventId]
        );
        if (ticketResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return { error: 'Ticket category not found for this event', status: 404 };
        }
        const ticketCategory = ticketResult.rows[0];

        if (event.organizer_id === buyerUserId) {
            await client.query('ROLLBACK');
            return { error: 'You cannot purchase tickets for your own event', status: 400 };
        }

        const existingReg = await client.query(
            'SELECT id FROM registrations WHERE user_id = $1 AND event_id = $2',
            [buyerUserId, eventId]
        );
        if (existingReg.rows.length > 0) {
            await client.query('ROLLBACK');
            return { error: 'You have already registered for this event', status: 400 };
        }

        if (ticketCategory.capacity > 0) {
            const soldCount = await client.query(
                `SELECT COUNT(*) as count FROM registrations
                 WHERE event_id = $1 AND ticket_type = $2
                 AND status IN ('Purchased', 'Confirmed', 'RSVPed', 'Pending')`,
                [eventId, ticketCategory.name]
            );
            if (parseInt(soldCount.rows[0].count) >= ticketCategory.capacity) {
                await client.query('ROLLBACK');
                return { error: 'This ticket category is sold out', status: 400 };
            }
        }

        const regCount = await client.query(
            'SELECT COUNT(*) FROM registrations WHERE event_id = $1',
            [eventId]
        );
        if (event.capacity > 0 && parseInt(regCount.rows[0].count) >= event.capacity) {
            await client.query('ROLLBACK');
            return { error: 'Event is at full capacity', status: 400 };
        }

        const purchasePrice = calculateDiscountedPrice(
            ticketCategory.price,
            ticketCategory.discount_type,
            ticketCategory.discount_value
        );

        if (purchasePrice <= 0) {
            await client.query('ROLLBACK');
            return { error: 'Invalid ticket price', status: 400 };
        }

        const buyerAccount = await ensureBankAccount(buyerUserId, client);
        const organizerAccount = await ensureBankAccount(event.organizer_id, client);

        if (buyerAccount.status === 'frozen') {
            await client.query('ROLLBACK');
            return { error: 'Your bank account is frozen', status: 403 };
        }

        const buyerLocked = await client.query(
            'SELECT * FROM bank_accounts WHERE id = $1 FOR UPDATE',
            [buyerAccount.id]
        );
        const organizerLocked = await client.query(
            'SELECT * FROM bank_accounts WHERE id = $1 FOR UPDATE',
            [organizerAccount.id]
        );

        const buyerBalance = parseFloat(buyerLocked.rows[0].balance);
        if (buyerBalance < purchasePrice) {
            await client.query('ROLLBACK');
            return {
                error: `Insufficient balance. You need ETB ${purchasePrice.toFixed(2)} but have ETB ${buyerBalance.toFixed(2)}`,
                status: 400,
            };
        }

        const reference = generateTransactionReference();

        await client.query(
            'UPDATE bank_accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [purchasePrice, buyerAccount.id]
        );
        await client.query(
            'UPDATE bank_accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [purchasePrice, organizerAccount.id]
        );

        const regResult = await client.query(
            `INSERT INTO registrations (user_id, event_id, status, ticket_type, paid_amount, payment_method, transaction_ref)
             VALUES ($1, $2, 'Confirmed', $3, $4, 'EventMateBank', $5)
             RETURNING *`,
            [buyerUserId, eventId, ticketCategory.name, purchasePrice, reference]
        );
        const registration = regResult.rows[0];

        await client.query(
            `INSERT INTO bank_transactions (reference, from_account_id, to_account_id, amount, type, status, registration_id, event_id, description)
             VALUES ($1, $2, $3, $4, 'ticket_purchase', 'completed', $5, $6, $7)`,
            [
                reference,
                buyerAccount.id,
                organizerAccount.id,
                purchasePrice,
                registration.id,
                eventId,
                `Ticket: ${ticketCategory.name} — ${event.title}`,
            ]
        );

        const ticketResult2 = await client.query(
            `INSERT INTO tickets (registration_id, ticket_type, price, is_confirmed)
             VALUES ($1, $2, $3, TRUE)
             RETURNING *`,
            [registration.id, ticketCategory.name, purchasePrice]
        );

        const buyerUpdated = await client.query('SELECT * FROM bank_accounts WHERE id = $1', [buyerAccount.id]);

        await client.query('COMMIT');

        return {
            registration,
            ticket: ticketResult2.rows[0],
            transactionReference: reference,
            amount: purchasePrice,
            buyerBalance: parseFloat(buyerUpdated.rows[0].balance),
            event,
            ticketCategory,
        };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Backfill bank accounts for all users (migration helper).
 */
async function backfillAccountsForAllUsers() {
    const users = await db.query('SELECT id FROM users');
    for (const row of users.rows) {
        await ensureBankAccount(row.id);
    }
}

module.exports = {
    STARTING_BALANCE,
    MAX_DEPOSIT_AMOUNT,
    formatAccountNumber,
    ensureBankAccount,
    getAccountByUserId,
    getAccountWithTransactions,
    deposit,
    purchaseTicketWithBank,
    backfillAccountsForAllUsers,
};
