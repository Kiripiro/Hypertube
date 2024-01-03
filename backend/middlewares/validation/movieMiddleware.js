const { query, param, body, validationResult } = require('express-validator');

const fetchYTSMovies = [
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('page').optional().isInt({ min: 1 }),
    query('query_term').optional().isString(),
    query('genre').optional().isString(),
    query('sort_by').optional().isString(),
    query('order_by').optional().isString(),
    query('quality').optional().isString(),
    query('minimum_rating').optional().isInt({ min: 0, max: 9 }),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

const fetchMovieDetails = [
    param('imdb_id')
        .isString()
        .notEmpty().withMessage('imdb_id is required'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

const movieStream = [
    param('ytsId')
        .isString()
        .optional(),
    param('freeId')
        .isString()
        .optional(),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

const movieLoading = [
    param('ytsId')
        .isNumeric()
        .optional(),
    param('freeId')
        .isString()
        .optional(),
    param('imdbId')
        .isString()
        .optional(),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

const stopMovieLoading = [
    param('ytsId')
        .isNumeric()
        .optional(),
    param('freeId')
        .isString()
        .optional(),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

const fileSize = [
    param('ytsId')
        .isNumeric()
        .optional(),
    param('freeId')
        .isString()
        .optional(),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

const addMovieHistory = [
    body('imdbId')
        .isString()
        .notEmpty().withMessage('imdbId is required'),
    body('title')
        .isString()
        .notEmpty().withMessage('title is required'),
    body('timestamp')
        .isNumeric()
        .notEmpty().withMessage('timestamp is required'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

const downloadSubtitles = [
    param('imdbId')
        .isString()
        .notEmpty().withMessage('imdbId is required'),
    param('lang')
        .isString()
        .notEmpty().withMessage('lang is required'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors });
        }
        next();
    }
];

const getMovieHistory = [
    param('id')
        .isNumeric()
        .optional(),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors });
        }
        next();
    }
];

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

const validateApiMovieById = [
    param('id')
        .trim()
        .notEmpty().withMessage('ID is required')
        .matches(/tt[0-9]+/).withMessage('Invalid ID format'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];

const validateApiPostCommentByMoviesRoute = [
    param('movie_id')
        .trim()
        .notEmpty().withMessage('movie_id is required')
        .matches(/tt[0-9]+/).withMessage('Invalid movie_id format'),
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

module.exports = {
    fetchYTSMovies,
    fetchMovieDetails,
    movieStream,
    movieLoading,
    stopMovieLoading,
    fileSize,
    addMovieHistory,
    downloadSubtitles,
    getMovieHistory,
    validateMovieDetails,
    validateMovieStream,
    validateAddMovieHistory,
    validateMovieLoading,
    validateMovieStopLoading,
    validateMovieFileSize,
    validateAddMovieHistory,
    validateMovieDownloadSubtitles,
    validateApiMovieById,
    validateApiPostCommentByMoviesRoute
};