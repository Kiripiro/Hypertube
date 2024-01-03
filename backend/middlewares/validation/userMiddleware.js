const { body, param, validationResult } = require('express-validator');

const validateUserRegistration = [
    body('username')
        .trim()
        .isString()
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),

    body('firstName')
        .trim()
        .isString()
        .notEmpty().withMessage('First name is required')
        .isLength({ min: 3 }).withMessage('First name must be at least 3 characters'),

    body('lastName')
        .trim()
        .isString()
        .notEmpty().withMessage('Last name is required')
        .isLength({ min: 3 }).withMessage('Last name must be at least 3 characters'),

    body('email')
        .isEmail().withMessage('Invalid email address')
        .notEmpty().withMessage('Email is required'),

    body('password')
        .isStrongPassword().withMessage('Password must be at least 8 characters long and contain at least 1 lowercase, 1 uppercase, 1 number and 1 symbol')
        .notEmpty().withMessage('Password is required'),

    body('confirm_password')
        .isStrongPassword().withMessage('Password must be at least 8 characters long and contain at least 1 lowercase, 1 uppercase, 1 number and 1 symbol')
        .notEmpty().withMessage('Password confirmation is required'),

    body('language')
        .notEmpty().withMessage('Language is required')
        .isString()
        .isLength({ min: 2, max: 2 }).withMessage('Language must 2 characters long'),

    (req, res, next) => {
        console.log("validateUserRegistration", req.body);
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
        .trim()
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({ errors: errors.array() });
        }
        next();
    },
];

const validateUserLogin42 = [
    body('code')
        .trim()
        .notEmpty().withMessage('Code is required'),

    (req, res, next) => {
        console.log("validateUserLogin42", req.body);
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({ errors: errors.array() });
        }
        next();
    },
];

const validateUserLoginGoogle = [
    body('user')
        .trim()
        .notEmpty().withMessage('User data is required')
        .isObject().withMessage('User must be an object')
        .notEmpty().withMessage('User data is required'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({ errors: errors.array() });
        }
        next();
    },
];

const validateGetUserById = [
    body('id')
        .trim()
        .isNumeric()
        .notEmpty().withMessage('User ID is required bite'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({ errors: errors.array() });
        }
        next();
    },
];

const validateGetUserByUsername = [
    body('username')
        .trim()
        .isString()
        .notEmpty().withMessage('Username is required'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({ errors: errors.array() });
        }
        next();
    },
];

const validateSettingsUpdateInfos = [
    body('user')
        .notEmpty().withMessage('User data is required'),

    (req, res, next) => {
        console.log("validateSettingsUpdateInfos", req.body);
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({ errors: errors.array() });
        }
        next();
    },
];

const validateDeleteUser = [
    body('userId')
        .trim()
        .notEmpty().withMessage('User ID is required rahrah'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({ errors: errors.array() });
        }
        next();
    },
];

const validateResetPassword = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({ errors: errors.array() });
        }
        next();
    }
];

const validateResetPasswordValidate = [
    body('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),

    body('passwordResetToken')
        .isLength({ min: 8 }).withMessage('Token must be set'),

    (req, res, next) => {
        console.log("validateResetPasswordValidate", req.body);
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
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
    validateUserLogin42,
    validateUserLoginGoogle,
    validateGetUserById,
    validateGetUserByUsername,
    validateSettingsUpdateInfos,
    validateDeleteUser,
    validateResetPassword,
    validateResetPasswordValidate,
    validateApiRegister,
    validateApiGetUserById,
    validateApiPatchUserById
};