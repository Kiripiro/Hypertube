const express = require('express');
const userRouter = require('./userRouter');
const moviesRouter = require('./moviesRouter');
const commentsRouter = require('./commentsRouter');
const apiRouter = require('./apiRouter');

const mainRouter = express.Router();

mainRouter.use('/user', userRouter);
mainRouter.use('/movie', moviesRouter);
mainRouter.use('/comment', commentsRouter);
mainRouter.use('', apiRouter);

module.exports = mainRouter;