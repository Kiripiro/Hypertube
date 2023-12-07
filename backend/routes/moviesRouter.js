const express = require('express');
const moviesRouter = express.Router();
const auth = require('../middlewares/auth');
const MoviesController = require('../controllers/moviesController');

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
        await MoviesController.getMovieStream(req, res);
    } catch (error) {
        console.error(error);
    }
});

moviesRouter.get('/movieLoading/:id', auth, async (req, res) => {
    try {
        await MoviesController.getMovieLoading(req, res);
    } catch (error) {
        console.error(error);
    }
});

moviesRouter.get('/stopMovieLoading/:id', auth, async (req, res) => {
    try {
        await MoviesController.stopMovieLoading(req, res);
    } catch (error) {
        console.error(error);
    }
});

moviesRouter.get('/fileSize/:id', auth, async (req, res) => {
    try {
        await MoviesController.getMovieFileSize(req, res);
    } catch (error) {
        console.error(error);
    }
});

moviesRouter.get('/torrentInfos/:id', auth, async (req, res) => {
    try {
        await MoviesController.getTorrentInfos(req, res);
    } catch (error) {
        console.error(error);
    }
});


module.exports = moviesRouter;