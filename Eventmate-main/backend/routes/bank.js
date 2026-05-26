const express = require('express');
const { authenticate } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');
const {
    getAccountWithTransactions,
    deposit,
    MAX_DEPOSIT_AMOUNT,
    STARTING_BALANCE,
} = require('../utils/bankService');

const router = express.Router();

/**
 * GET /bank/account
 * Get current user's wallet balance and recent transactions.
 */
router.get('/account', authenticate, async (req, res) => {
    try {
        const { account, transactions } = await getAccountWithTransactions(req.user.id);
        res.json({
            success: true,
            data: {
                account: {
                    id: account.id,
                    account_number: account.account_number,
                    balance: parseFloat(account.balance),
                    currency: account.currency,
                    status: account.status,
                },
                transactions: transactions.map((tx) => ({
                    ...tx,
                    amount: parseFloat(tx.amount),
                })),
            },
        });
    } catch (error) {
        console.error('Get bank account error:', error);
        res.status(500).json({ success: false, message: 'Error fetching bank account' });
    }
});

/**
 * POST /bank/deposit
 * Add demo funds (university / local bank simulation).
 */
router.post(
    '/deposit',
    authenticate,
    [
        body('amount')
            .isFloat({ min: 1, max: MAX_DEPOSIT_AMOUNT })
            .withMessage(`Amount must be between 1 and ${MAX_DEPOSIT_AMOUNT} ETB`),
        validate,
    ],
    async (req, res) => {
        try {
            const { amount } = req.body;
            const result = await deposit(req.user.id, amount);
            if (result.error) {
                return res.status(400).json({ success: false, message: result.error });
            }
            res.json({
                success: true,
                message: 'Deposit successful',
                data: {
                    account: {
                        account_number: result.account.account_number,
                        balance: parseFloat(result.account.balance),
                        currency: result.account.currency,
                    },
                    reference: result.reference,
                },
            });
        } catch (error) {
            console.error('Bank deposit error:', error);
            res.status(500).json({ success: false, message: 'Error processing deposit' });
        }
    }
);

/**
 * GET /bank/info
 * Public info about the local bank (for UI).
 */
router.get('/info', (_req, res) => {
    res.json({
        success: true,
        data: {
            name: 'EventMate Bank',
            currency: 'ETB',
            starting_balance: STARTING_BALANCE,
            max_deposit: MAX_DEPOSIT_AMOUNT,
        },
    });
});

module.exports = router;
