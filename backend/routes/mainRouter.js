const express = require('express');
const userRouter = require('./userRouter');
const moviesRouter = require('./moviesRouter');
const commentsRouter = require('./commentsRouter');

const mainRouter = express.Router();

mainRouter.use('/user', userRouter);
mainRouter.use('/movies', moviesRouter);
mainRouter.use('/comments', commentsRouter);

module.exports = mainRouter;