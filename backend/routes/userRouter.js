const express = require('express');
const UserController = require('../controllers/userController');
const { validateUserRegistration, validateUserLogin } = require('../middlewares/userMiddleware');
const auth = require('../middlewares/auth');

const userRouter = express.Router();
userRouter.post('/register', validateUserRegistration, async (req, res) => {
    try {
        await UserController.register(req, res);
    } catch (error) {
        console.error(error);
    }
});

userRouter.post('/login', validateUserLogin, async (req, res) => {
    try {
        await UserController.login(req, res);
    } catch (error) {
        console.error(error);
    }
});

userRouter.post('/login42', async (req, res) => {
    try {
        await UserController.login42(req, res);
    } catch (error) {
        console.error(error);
    }
});

userRouter.post('/loginGoogle', async (req, res) => {
    try {
        await UserController.loginGoogle(req, res);
    } catch (error) {
        console.error(error);
    }
});

userRouter.post('/logout', auth, async (req, res) => {
    try {
        await UserController.logout(req, res);
    } catch (error) {
        console.error(error);
    }
});

userRouter.post('/refreshToken', async (req, res) => {
    try {
        await UserController.refresh(req, res);
    } catch (error) {
        console.error(error);
    }
});

userRouter.post('/id', auth, async (req, res) => {
    try {
        await UserController.getUserById(req, res);
    } catch (error) {
        console.error(error);
    }
});

userRouter.post('/username', auth, async (req, res) => {
    try {
        await UserController.getUserByUsername(req, res);
    } catch (error) {
        console.error(error);
    }
});

userRouter.get('/id', auth, async (req, res) => {
    try {
        await UserController.getPersonalUser(req, res);
    } catch (error) {
        console.error(error);
    }
});

userRouter.get('/allUsernames', auth, async (req, res) => {
    try {
        await UserController.getAllUsernames(req, res);
    } catch (error) {
        console.error(error);
    }
});

userRouter.post('/settingsUpdate', auth, async (req, res) => {
    try {
        await UserController.settingsUpdateInfos(req, res);
    } catch (error) {
        console.error(error);
    }
});


userRouter.post('/delete', auth, async (req, res) => {
    try {
        await UserController.deleteUser(req, res);
    } catch (error) {
        console.error(error);
    }
});

userRouter.post('/resetPassword', async (req, res) => {
    try {
        await UserController.resetPassword(req, res);
    } catch (error) {
        console.error(error);
    }
});

userRouter.post('/resetPasswordValidate', async (req, res) => {
    try {
        await UserController.resetPasswordValidate(req, res);
    } catch (error) {
        console.error(error);
    }
});

module.exports = userRouter;