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

module.exports = moviesRouter;