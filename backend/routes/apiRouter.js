const express = require('express');
const UserController = require('../controllers/userController');
const MoviesController = require('../controllers/moviesController');
const CommentsController = require('../controllers/commentsController');
const { validateApiRegister, validateApiGetUserById, validateApiPatchUserById, validateApiAuth } = require('../middlewares/userMiddleware');
const { validateApiMovieById, validateApiPostCommentByMoviesRoute } = require('../middlewares/moviesMiddleware');
const { validateApiGetCommentById, validateApiPatchCommentById, validateApiDeleteCommentById, validateApiPostComment } = require('../middlewares/commentsMiddleware');
const authApi = require('../middlewares/authApi');
const authApiUser = require('../middlewares/authApiUser');

const apiRouter = express.Router();

apiRouter.post('/oauth/token', validateApiAuth, async (req, res) => {
    try {
        await UserController.apiAuth(req, res);
    } catch (error) {
        console.error(error);
    }
});

apiRouter.post('/register', authApi, validateApiRegister, async (req, res) => {
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

apiRouter.get('/users', authApiUser, async (req, res) => {
    try {
        await UserController.apiGetUsers(req, res);
    } catch (error) {
        console.error(error);
    }
});

apiRouter.get('/users/:id', authApiUser, validateApiGetUserById, async (req, res) => {
    try {
        await UserController.apiGetUserById(req, res);
    } catch (error) {
        console.error(error);
    }
});

apiRouter.patch('/users/:id', authApiUser, validateApiPatchUserById, async (req, res) => {
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

apiRouter.get('/movies/:id', authApiUser, validateApiMovieById, async (req, res) => {
    try {
        await MoviesController.apiGetMovieById(req, res);
    } catch (error) {
        console.error(error);
    }
});

apiRouter.get('/comments', authApiUser, async (req, res) => {
    try {
        await CommentsController.apiGetLatestComments(req, res);
    } catch (error) {
        console.error(error);
    }
});

apiRouter.get('/comments/:id', authApiUser, validateApiGetCommentById, async (req, res) => {
    try {
        await CommentsController.apiGetCommentById(req, res);
    } catch (error) {
        console.error(error);
    }
});

apiRouter.patch('/comments/:id', authApiUser, validateApiPatchCommentById, async (req, res) => {
    try {
        await CommentsController.apiPatchCommentById(req, res);
    } catch (error) {
        console.error(error);
    }
});

apiRouter.delete('/comments/:id', authApiUser, validateApiDeleteCommentById, async (req, res) => {
    try {
        await CommentsController.apiDeleteCommentById(req, res);
    } catch (error) {
        console.error(error);
    }
});

apiRouter.post('/comments', authApiUser, validateApiPostComment, async (req, res) => {
    try {
        await CommentsController.apiPostComment(req, res);
    } catch (error) {
        console.error(error);
    }
});

apiRouter.post('/movies/:movie_id/comments', authApiUser, validateApiPostCommentByMoviesRoute, async (req, res) => {
    try {
        await CommentsController.apiPostCommentByMoviesRoute(req, res);
    } catch (error) {
        console.error(error);
    }
});

module.exports = apiRouter;