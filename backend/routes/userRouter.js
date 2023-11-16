const express = require('express');
const UserController = require('../controllers/userController');
const { validateUserRegistration } = require('../middlewares/userMiddleware');

const userRouter = express.Router();
userRouter.post('/register', validateUserRegistration, async (req, res) => {
    try {
        await UserController.register(req, res);
    } catch (error) {
        console.error(error);
    }
});

module.exports = userRouter;