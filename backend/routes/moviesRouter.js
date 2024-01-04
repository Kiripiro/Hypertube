const express = require('express');
const moviesRouter = express.Router();
const auth = require('../middlewares/auth/auth');
const MoviesController = require('../controllers/moviesController');
const StreamController = require('../controllers/streamController');
const { validateMovieDetails, validateMovieStream, validateMovieLoading, validateMovieStopLoading, validateAddMovieHistory, validateMovieDownloadSubtitles, validateMovieFileSize } = require('../middlewares/validation/movieMiddleware');
const movieMiddleware = require('../middlewares/validation/movieMiddleware');

moviesRouter.get('/fetchYTSMovies', auth, movieMiddleware.fetchYTSMovies, async (req, res) => {
    try {
        await MoviesController.fetchYTSMovies(req, res);
    } catch (error) {
    }
});

moviesRouter.get('/fetchMovieDetails/:imdb_id', validateMovieDetails, auth, async (req, res) => {
    try {
        await MoviesController.fetchMovieDetails(req, res);
    } catch (error) {
        console.error(error);
    }
});

moviesRouter.get('/movieStream/:ytsId/:freeId/:time', validateMovieStream, auth, async (req, res) => {
    try {
        await StreamController.getStream(req, res);
    } catch (error) {
        console.error(error);
    }
});

moviesRouter.get('/movieLoading/:ytsId/:freeId/:imdbId', validateMovieLoading, auth, async (req, res) => {
    try {
        await StreamController.streamLauncher(req, res);
    } catch (error) {
        console.error(error);
    }
});

moviesRouter.get('/stopMovieLoading/:ytsId/:freeId', validateMovieStopLoading, auth, async (req, res) => {
    try {
        await StreamController.stopStream(req, res);
    } catch (error) {
        console.error(error);
    }
});

moviesRouter.get('/fileSize/:ytsId/:freeId', validateMovieFileSize, auth, async (req, res) => {
    try {
        await StreamController.getFileSize(req, res);
    } catch (error) {
        console.error(error);
    }
});

moviesRouter.post('/addMovieHistory', validateAddMovieHistory, auth, async (req, res) => {
    try {
        await MoviesController.addMovieHistory(req, res);
    } catch (error) {
        console.error(error);
    }
});

moviesRouter.get('/downloadSubtitles/:imdbId/:lang/:time', validateMovieDownloadSubtitles, auth, async (req, res) => {
    try {
        await StreamController.downloadSubtitles(req, res);
    } catch (error) {
        console.error(error);
    }
});

moviesRouter.get('/getMovieHistory', auth, movieMiddleware.getMovieHistory, async (req, res) => {
    try {
        await MoviesController.getMovieHistory(req, res);
    } catch (error) {
        console.error(error);
    }
});

moviesRouter.get('/getMovieHistoryById/:id', auth, movieMiddleware.getMovieHistory, async (req, res) => {
    try {
        await MoviesController.getMovieHistory(req, res);
    } catch (error) {
        console.error(error);
    }
});

module.exports = moviesRouter;