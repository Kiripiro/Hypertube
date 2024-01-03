const { param, body, validationResult } = require('express-validator');

const validateAddComment = [
    body('author_id')
        .isNumeric()
        .notEmpty().withMessage('Author id is required'),

    body('text')
        .trim()
        .isString()
        .notEmpty().withMessage('Text is required'),

    body('imdb_id')
        .trim()
        .isString()
        .notEmpty().withMessage('Imdb id is required'),

    body('parent_id')
        .optional()
        .isNumeric(),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({ errors: errors.array() });
        }
        next();
    },
];

const validateGetComments = [
    param('imdb_id')
        .trim()
        .isString()
        .notEmpty().withMessage('Imdb id is required'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({ errors: errors.array() });
        }
        next();
    },
];

const validateUpdateComment = [
    body('comment')
        .isObject().withMessage('Comment must be an object')
        .notEmpty().withMessage('Comment is required'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({ errors: errors.array() });
        }
        next();
    },
];

const validateDeleteComment = [
    param('id')
        .isNumeric()
        .notEmpty().withMessage('Id is required'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({ errors: errors.array() });
        }
        next();
    },
];

const validateApiGetCommentById = [
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

const validateApiPatchCommentById = [
    param('id')
        .trim()
        .notEmpty().withMessage('ID is required')
        .isInt().withMessage('ID must be an integer'),
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('comment')
        .trim()
        .notEmpty().withMessage('Comment is required')
        .isLength({ min: 3, max: 240 }).withMessage('Comment must be between 3 and 240 characters')
        .matches(/^[a-zA-Z0-9 .,!?'-]*$/).withMessage('Comment contains invalid characters'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];

const validateApiDeleteCommentById = [
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

const validateApiPostComment = [
    body('comment')
        .trim()
        .notEmpty().withMessage('Comment is required')
        .isLength({ min: 3, max: 240 }).withMessage('Comment must be between 3 and 240 characters')
        .matches(/^[a-zA-Z0-9 .,!?'-]*$/).withMessage('Comment contains invalid characters'),
    body('movie_id')
        .trim()
        .notEmpty().withMessage('movie_id is required')
        .matches(/tt[0-9]+/).withMessage('Invalid movie_id format'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];

module.exports = {
    validateAddComment,
    validateGetComments,
    validateUpdateComment,
    validateDeleteComment,
    validateApiGetCommentById,
    validateApiPatchCommentById,
    validateApiDeleteCommentById,
    validateApiPostComment
    
};
