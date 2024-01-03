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

module.exports = {
    fetchYTSMovies,
    fetchMovieDetails,
    movieStream,
    movieLoading,
    stopMovieLoading,
    fileSize,
    addMovieHistory,
    downloadSubtitles,
    getMovieHistory
};