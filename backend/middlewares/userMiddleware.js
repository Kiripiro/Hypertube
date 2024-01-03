const { body, param, validationResult } = require('express-validator');

const validateUserRegistration = [
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),

    body('firstName')
        .trim()
        .notEmpty().withMessage('First name is required')
        .isLength({ min: 3 }).withMessage('First name must be at least 3 characters'),

    body('lastName')
        .trim()
        .notEmpty().withMessage('Last name is required')
        .isLength({ min: 3 }).withMessage('Last name must be at least 3 characters'),

    body('email')
        .isEmail().withMessage('Invalid email address'),

    body('password')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

    (req, res, next) => {
        // console.log("validateUserRegistration", req.body);
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];

const validateUserLogin = [
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),

    body('password')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];

const validateApiRegister = [
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),

    body('password')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
        .matches(/^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-zA-Z]).{6,}$/)
        .withMessage('Password must include at least one letter, one number, and one special character'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];

const validateApiAuth = [
    body('client')
        .trim()
        .notEmpty().withMessage('Client is required')
        .isInt().withMessage('Client must be an integer'),

    body('secret')
        .isLength({ min: 6 }).withMessage('Secret must be at least 6 characters')
        .isAlphanumeric()
        .withMessage('Secret must be alphanumeric'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];

const validateApiGetUserById = [
    param('id')
        .trim()
        .notEmpty().withMessage('ID is required')
        .isInt().withMessage('ID must be an integer'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];

const validateApiPatchUserById = [
    param('id')
        .trim()
        .notEmpty().withMessage('ID is required')
        .isInt().withMessage('ID must be an integer'),
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('email')
        .isEmail().withMessage('Invalid email address'),
    body('password')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
        .matches(/^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-zA-Z]).{6,}$/)
        .withMessage('Password must include at least one letter, one number, and one special character'),
    body('url')
        .matches(/^[A-Za-z0-9\/_.-]*$/)
        .withMessage('URL can only contain letters, numbers, and the following characters: / _ . -'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];

module.exports = {
    validateUserRegistration,
    validateUserLogin,
    validateApiAuth,
    validateApiRegister,
    validateApiGetUserById,
    validateApiPatchUserById
};