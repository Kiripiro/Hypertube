const express = require('express');
const moviesRouter = express.Router();
const auth = require('../middlewares/auth');
const MoviesController = require('../controllers/moviesController');
const StreamController = require('../controllers/streamController');

moviesRouter.get('/fetchYTSMovies', auth, async (req, res) => {
    try {
        await MoviesController.fetchYTSMovies(req, res);
    } catch (error) {
        console.error(error);
    }
});

moviesRouter.get('/fetchMovieDetails/:imdb_id', auth, async (req, res) => {
    try {
        await MoviesController.fetchMovieDetails(req, res);
    } catch (error) {
        console.error(error);
    }
});

moviesRouter.get('/movieStream/:id', auth, async (req, res) => {
    try {
        await StreamController.getStream(req, res);
    } catch (error) {
        console.error(error);
    }
});

moviesRouter.get('/movieLoading/:id', auth, async (req, res) => {
    try {
        await StreamController.streamLauncher(req, res);
    } catch (error) {
        console.error(error);
    }
});

moviesRouter.get('/stopMovieLoading/:id', auth, async (req, res) => {
    try {
        await StreamController.stopStream(req, res);
    } catch (error) {
        console.error(error);
    }
});

moviesRouter.get('/fileSize/:id', auth, async (req, res) => {
    try {
        await StreamController.getFileSize(req, res);
    } catch (error) {
        console.error(error);
    }
});

moviesRouter.get('/torrentInfos/:id', auth, async (req, res) => {
    try {
        await StreamController.getTorrentInfos(req, res);
    } catch (error) {
        console.error(error);
    }
});

moviesRouter.post('/addMovieHistory', auth, async (req, res) => {
    try {
        await MoviesController.addMovieHistory(req, res);
    } catch (error) {
        console.error(error);
    }
});


module.exports = moviesRouter;