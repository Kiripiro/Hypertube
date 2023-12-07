const { body, validationResult } = require('express-validator');

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
            return res.status(401).json({ errors: errors.array() });
        }
        next();
    },
];

module.exports = {
    validateUserRegistration,
    validateUserLogin
};