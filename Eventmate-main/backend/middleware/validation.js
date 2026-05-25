const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware to handle validation errors
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

// User validation rules
const userValidation = {
    register: [
        body('name')
            .trim()
            .notEmpty()
            .withMessage('Name is required')
            .isLength({ min: 2, max: 100 })
            .withMessage('Name must be between 2 and 100 characters'),
        body('email')
            .trim()
            .isEmail()
            .withMessage('Valid email is required')
            .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
            .withMessage('Email must be in a valid format (e.g., name@domain.com)')
            .normalizeEmail(),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters'),
        body('role')
            .optional()
            .isIn(['Registered User', 'Organizer'])
            .withMessage('Role must be Registered User or Organizer'),
        validate
    ],
    verify: [
        body('email')
            .trim()
            .isEmail()
            .withMessage('Valid email is required')
            .normalizeEmail(),
        body('code')
            .trim()
            .matches(/^\d{6}$/)
            .withMessage('Verification code must be a 6-digit number'),
        validate
    ],
    resendOtp: [
        body('email')
            .trim()
            .isEmail()
            .withMessage('Valid email is required')
            .normalizeEmail(),
        body('type')
            .optional()
            .isIn(['verification', 'reset'])
            .withMessage('Type must be verification or reset'),
        validate
    ],
    login: [
        body('email')
            .trim()
            .isEmail()
            .withMessage('Valid email is required')
            .normalizeEmail(),
        body('password')
            .notEmpty()
            .withMessage('Password is required'),
        validate
    ],
    updateProfile: [
        body('name')
            .optional()
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Name must be between 2 and 100 characters'),
        body('phone')
            .optional({ nullable: true, checkFalsy: true })
            .trim()
            .matches(/^\+?[0-9\s\-().]{7,20}$/)
            .withMessage('Please enter a valid phone number'),
        body('bio')
            .optional({ nullable: true, checkFalsy: true })
            .trim()
            .isLength({ max: 500 })
            .withMessage('Bio cannot exceed 500 characters'),
        validate
    ]
};

// Event validation rules
const eventValidation = {
    create: [
        body('title')
            .trim()
            .notEmpty()
            .withMessage('Title is required')
            .isLength({ min: 3, max: 255 })
            .withMessage('Title must be between 3 and 255 characters'),
        body('description')
            .optional()
            .trim()
            .isLength({ max: 5000 })
            .withMessage('Description cannot exceed 5000 characters'),
        body('category')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('Category cannot exceed 100 characters'),
        body('date')
            .notEmpty()
            .withMessage('Date is required')
            .isISO8601()
            .withMessage('Date must be in ISO format (YYYY-MM-DD)'),
        body('time')
            .notEmpty()
            .withMessage('Time is required')
            .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
            .withMessage('Time must be in HH:MM or HH:MM:SS format'),
        body('location_venue')
            .optional()
            .trim()
            .isLength({ max: 255 })
            .withMessage('Venue cannot exceed 255 characters'),
        body('location_latitude')
            .optional()
            .isFloat({ min: -90, max: 90 })
            .withMessage('Latitude must be between -90 and 90'),
        body('location_longitude')
            .optional()
            .isFloat({ min: -180, max: 180 })
            .withMessage('Longitude must be between -180 and 180'),
        body('capacity')
            .optional()
            .isInt({ min: 0 })
            .withMessage('Capacity must be a positive integer'),
        body('is_paid')
            .optional()
            .isBoolean()
            .withMessage('is_paid must be a boolean value'),
        body('image_url')
            .optional()
            .trim()
            .custom((value) => {
                if (!value) return true;
                return value.startsWith('/uploads/') || /^(https?:\/\/)/.test(value);
            })
            .withMessage('image_url must be a valid URL or a relative upload path'),
        body('city')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('City cannot exceed 100 characters'),
        body('country')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('Country cannot exceed 100 characters'),
        body('ticket_categories')
            .optional()
            .isArray()
            .withMessage('ticket_categories must be an array'),
        body('ticket_categories.*.name')
            .if(body('ticket_categories').exists())
            .notEmpty()
            .withMessage('Ticket category name is required'),
        body('ticket_categories.*.price')
            .if(body('ticket_categories').exists())
            .isFloat({ min: 0 })
            .withMessage('Ticket price must be a positive number'),
        body('ticket_categories.*.capacity')
            .if(body('ticket_categories').exists())
            .optional()
            .isInt({ min: 0 })
            .withMessage('Ticket capacity must be a positive integer'),
        body('ticket_categories.*.discount_percentage')
            .if(body('ticket_categories').exists())
            .optional()
            .isFloat({ min: 0, max: 100 })
            .withMessage('Discount percentage must be between 0 and 100'),
        body('ticket_categories.*.discount_value')
            .if(body('ticket_categories').exists())
            .optional()
            .isFloat({ min: 0, max: 100 })
            .withMessage('Discount value must be between 0 and 100'),
        validate
    ],
    update: [
        body('title')
            .optional()
            .trim()
            .isLength({ min: 3, max: 255 })
            .withMessage('Title must be between 3 and 255 characters'),
        body('description')
            .optional()
            .trim()
            .isLength({ max: 5000 })
            .withMessage('Description cannot exceed 5000 characters'),
        body('category')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('Category cannot exceed 100 characters'),
        body('date')
            .optional()
            .isISO8601()
            .withMessage('Date must be in ISO format'),
        body('time')
            .optional()
            .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
            .withMessage('Time must be in HH:MM or HH:MM:SS format'),
        body('location_venue')
            .optional()
            .trim()
            .isLength({ max: 255 })
            .withMessage('Venue cannot exceed 255 characters'),
        body('location_latitude')
            .optional()
            .isFloat({ min: -90, max: 90 })
            .withMessage('Latitude must be between -90 and 90'),
        body('location_longitude')
            .optional()
            .isFloat({ min: -180, max: 180 })
            .withMessage('Longitude must be between -180 and 180'),
        body('capacity')
            .optional()
            .isInt({ min: 0 })
            .withMessage('Capacity must be a positive integer'),
        body('is_paid')
            .optional()
            .isBoolean()
            .withMessage('is_paid must be a boolean value'),
        body('image_url')
            .optional()
            .trim()
            .custom((value) => {
                if (!value) return true;
                return value.startsWith('/uploads/') || /^(https?:\/\/)/.test(value);
            })
            .withMessage('image_url must be a valid URL or a relative upload path'),
        body('city')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('City cannot exceed 100 characters'),
        body('country')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('Country cannot exceed 100 characters'),
        validate
    ],
    idParam: [
        param('id')
            .isInt({ min: 1 })
            .withMessage('Event ID must be a positive integer'),
        validate
    ],
    list: [
        query('category')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('Category cannot exceed 100 characters'),
        query('date')
            .optional()
            .isISO8601()
            .withMessage('Date must be in ISO format'),
        query('search')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('Search query cannot exceed 100 characters'),
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100'),
        validate
    ]
};

// Registration validation rules
const registrationValidation = {
    rsvp: [
        param('id')
            .isInt({ min: 1 })
            .withMessage('Event ID must be a positive integer'),
        validate
    ],
    purchase: [
        param('id')
            .isInt({ min: 1 })
            .withMessage('Event ID must be a positive integer'),
        body('ticket_category_id')
            .isInt({ min: 1 })
            .withMessage('Ticket category ID is required and must be a positive integer'),
        body('payment_method')
            .trim()
            .notEmpty()
            .withMessage('Payment method is required')
            .isLength({ max: 50 })
            .withMessage('Payment method cannot exceed 50 characters'),
        body('transaction_ref')
            .trim()
            .notEmpty()
            .withMessage('Transaction reference is required')
            .isLength({ max: 255 })
            .withMessage('Transaction reference cannot exceed 255 characters'),
        validate
    ]
};

// Admin validation rules
const adminValidation = {
    updateEventStatus: [
        param('id')
            .isInt({ min: 1 })
            .withMessage('Event ID must be a positive integer'),
        body('status')
            .notEmpty()
            .withMessage('Status is required')
            .isIn(['Approved', 'Rejected'])
            .withMessage('Status must be either Approved or Rejected'),
        validate
    ],
    userList: [
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100'),
        query('search')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('Search query cannot exceed 100 characters'),
        query('role')
            .optional()
            .isIn(['Visitor', 'Registered User', 'Organizer', 'Administrator'])
            .withMessage('Invalid role'),
        validate
    ],
    logList: [
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100'),
        query('user_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('User ID must be a positive integer'),
        validate
    ]
};

// Notification validation rules
const notificationValidation = {
    send: [
        body('user_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('User ID must be a positive integer'),
        body('event_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Event ID must be a positive integer'),
        body('message')
            .trim()
            .notEmpty()
            .withMessage('Message is required')
            .isLength({ max: 1000 })
            .withMessage('Message cannot exceed 1000 characters'),
        validate
    ]
};

module.exports = {
    userValidation,
    eventValidation,
    registrationValidation,
    adminValidation,
    notificationValidation,
    validate
};
