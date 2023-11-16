const express = require('express');
const userRouter = require('./userRouter');

const mainRouter = express.Router();

mainRouter.use('/user', userRouter);

module.exports = mainRouter;