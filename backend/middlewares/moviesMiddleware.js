const { body, param, validationResult } = require('express-validator');

const validateMovieDetails = [
    param('imdb_id')
        .trim()
        .notEmpty().withMessage('IMDB ID is required')
        .matches(/tt[0-9]+/).withMessage('Invalid IMDB ID format'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];

const validateMovieStream = [
    param('ytsId')
        .trim()
        .notEmpty().withMessage('ytsId is required')
        .matches(/[0-9]+/).withMessage('Invalid ytsId format'),
    param('freeId')
        .trim()
        .notEmpty().withMessage('freeId is required')
        .matches(/tt[0-9]+/).withMessage('Invalid freeId format'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];

const validateMovieLoading = [
    param('ytsId')
        .trim()
        .notEmpty().withMessage('ytsId is required')
        .matches(/[0-9]+/).withMessage('Invalid ytsId format'),
    param('freeId')
        .trim()
        .notEmpty().withMessage('freeId is required')
        .matches(/tt[0-9]+/).withMessage('Invalid freeId format'),
    param('imdbId')
        .trim()
        .notEmpty().withMessage('imdbId is required')
        .matches(/tt[0-9]+/).withMessage('Invalid imdbId format'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];

const validateMovieStopLoading = [
    param('ytsId')
        .trim()
        .notEmpty().withMessage('ytsId is required')
        .matches(/[0-9]+/).withMessage('Invalid ytsId format'),
    param('freeId')
        .trim()
        .notEmpty().withMessage('freeId is required')
        .matches(/tt[0-9]+/).withMessage('Invalid freeId format'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];

const validateMovieFileSize = [
    param('ytsId')
        .trim()
        .notEmpty().withMessage('ytsId is required')
        .matches(/[0-9]+/).withMessage('Invalid ytsId format'),
    param('freeId')
        .trim()
        .notEmpty().withMessage('freeId is required')
        .matches(/tt[0-9]+/).withMessage('Invalid freeId format'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];

const validateAddMovieHistory = [
    body('imdbId')
        .trim()
        .notEmpty().withMessage('imdbId is required')
        .matches(/tt[0-9]+/).withMessage('Invalid imdbId format'),
    body('title')
        .trim()
        .notEmpty().withMessage('title is required'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];

const validateMovieDownloadSubtitles = [
    param('imdbId')
        .trim()
        .notEmpty().withMessage('imdbId is required')
        .matches(/tt[0-9]+/).withMessage('Invalid imdbId format'),
    param('lang')
        .trim()
        .notEmpty().withMessage('Language code is required')
        .matches(/^[a-z]{2}(-[a-z]{2})*$/i).withMessage('Language must be 2-letter codes separated by hyphens'),
    param('time')
        .trim()
        .notEmpty().withMessage('Time is required')
        .matches(/[0-9]+/).withMessage('Time invalid format'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];

module.exports = {
    validateMovieDetails,
    validateMovieStream,
    validateAddMovieHistory,
    validateMovieLoading,
    validateMovieStopLoading,
    validateMovieFileSize,
    validateAddMovieHistory,
    validateMovieDownloadSubtitles
};