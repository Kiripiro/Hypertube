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

module.exports = {
    validateAddComment,
    validateGetComments,
    validateUpdateComment,
    validateDeleteComment,
};
