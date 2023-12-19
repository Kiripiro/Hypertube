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

moviesRouter.get('/movieStream/:ytsId/:freeId', auth, async (req, res) => {
    try {
        await StreamController.getStream(req, res);
    } catch (error) {
        console.error(error);
    }
});

moviesRouter.get('/movieLoading/:ytsId/:freeId', auth, async (req, res) => {
    try {
        await StreamController.streamLauncher(req, res);
    } catch (error) {
        console.error(error);
    }
});

moviesRouter.get('/stopMovieLoading/:ytsId/:freeId', auth, async (req, res) => {
    try {
        await StreamController.stopStream(req, res);
    } catch (error) {
        console.error(error);
    }
});

moviesRouter.get('/fileSize/:ytsId/:freeId', auth, async (req, res) => {
    try {
        await StreamController.getFileSize(req, res);
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

moviesRouter.get('/downloadSubtitles/:imdbId/:lang', auth, async (req, res) => {
    try {
        await StreamController.downloadSubtitles(req, res);
    } catch (error) {
        console.error(error);
    }
});

moviesRouter.get('/getMovieHistory', auth, async (req, res) => {
    try {
        await MoviesController.getMovieHistory(req, res);
    } catch (error) {
        console.error(error);
    }
});
// moviesRouter.get('/torrentInfos/:id', auth, async (req, res) => { // FOR TEST, TO DELETE
//     try {
//         await StreamController.getTorrentInfos(req, res);
//     } catch (error) {
//         console.error(error);
//     }
// });

moviesRouter.get('/getMovieHistoryById/:id', auth, async (req, res) => {
    try {
        await MoviesController.getMovieHistory(req, res);
    } catch (error) {
        console.error(error);
    }
});


moviesRouter.get('/testMovies', auth, async (req, res) => { // FOR TEST, TO DELETE
    try {
        console.log("testMovies");
        await MoviesController.getTestMovies(req, res);
    } catch (error) {
        console.error(error);
    }
});


module.exports = moviesRouter;