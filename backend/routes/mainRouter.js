const express = require('express');
const userRouter = require('./userRouter');
const moviesRouter = require('./moviesRouter');

const mainRouter = express.Router();

mainRouter.use('/user', userRouter);
mainRouter.use('/movies', moviesRouter);

module.exports = mainRouter;