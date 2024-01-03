const express = require('express');
const UserController = require('../controllers/userController');
const MoviesController = require('../controllers/moviesController');
const CommentsController = require('../controllers/commentsController');
const { validateApiRegister, validateApiGetUserById, validateApiPatchUserById, validateApiAuth } = require('../middlewares/userMiddleware');
const { validateApiMovieById, validateApiPostCommentByMoviesRoute } = require('../middlewares/moviesMiddleware');
const { validateApiGetCommentById, validateApiPatchCommentById, validateApiDeleteCommentById, validateApiPostComment } = require('../middlewares/commentsMiddleware');
const authApi = require('../middlewares/authApi');

const apiRouter = express.Router();

apiRouter.post('/oauth/token', validateApiAuth, async (req, res) => {
    try {
        await UserController.apiAuth(req, res);
    } catch (error) {
        console.error(error);
    }
});

apiRouter.post('/register', validateApiRegister, async (req, res) => {
    try {
        await UserController.apiRegister(req, res);
    } catch (error) {
        console.error(error);
    }
});

apiRouter.get('/refreshToken', async (req, res) => {
    try {
        await UserController.apiRefreshToken(req, res);
    } catch (error) {
        console.error(error);
    }
});

apiRouter.get('/users', authApi, async (req, res) => {
    try {
        await UserController.apiGetUsers(req, res);
    } catch (error) {
        console.error(error);
    }
});

apiRouter.get('/users/:id', authApi, validateApiGetUserById, async (req, res) => {
    try {
        await UserController.apiGetUserById(req, res);
    } catch (error) {
        console.error(error);
    }
});

apiRouter.patch('/users/:id', authApi, validateApiPatchUserById, async (req, res) => {
    try {
        await UserController.apiPatchUserById(req, res);
    } catch (error) {
        console.error(error);
    }
});

apiRouter.get('/movies', async (req, res) => {
    try {
        await MoviesController.apiGetMovies(req, res);
    } catch (error) {
        console.error(error);
    }
});

apiRouter.get('/movies/:id', authApi, validateApiMovieById, async (req, res) => {
    try {
        await MoviesController.apiGetMovieById(req, res);
    } catch (error) {
        console.error(error);
    }
});

apiRouter.get('/comments', authApi, async (req, res) => {
    try {
        await CommentsController.apiGetLatestComments(req, res);
    } catch (error) {
        console.error(error);
    }
});

apiRouter.get('/comments/:id', authApi, validateApiGetCommentById, async (req, res) => {
    try {
        await CommentsController.apiGetCommentById(req, res);
    } catch (error) {
        console.error(error);
    }
});

apiRouter.patch('/comments/:id', authApi, validateApiPatchCommentById, async (req, res) => {
    try {
        await CommentsController.apiPatchCommentById(req, res);
    } catch (error) {
        console.error(error);
    }
});

apiRouter.delete('/comments/:id', authApi, validateApiDeleteCommentById, async (req, res) => {
    try {
        await CommentsController.apiDeleteCommentById(req, res);
    } catch (error) {
        console.error(error);
    }
});

apiRouter.post('/comments', authApi, validateApiPostComment, async (req, res) => {
    try {
        await CommentsController.apiPostComment(req, res);
    } catch (error) {
        console.error(error);
    }
});

apiRouter.post('/movies/:movie_id/comments', authApi, validateApiPostCommentByMoviesRoute, async (req, res) => {
    try {
        await CommentsController.apiPostCommentByMoviesRoute(req, res);
    } catch (error) {
        console.error(error);
    }
});

module.exports = apiRouter;