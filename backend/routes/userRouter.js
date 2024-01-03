const express = require('express');
const UserController = require('../controllers/userController');
const userMiddleware = require('../middlewares/validation/userMiddleware');
const auth = require('../middlewares/auth/auth');

const userRouter = express.Router();
userRouter.post('/register', userMiddleware.validateUserRegistration, async (req, res) => {
    try {
        await UserController.register(req, res);
    } catch (error) {
        console.error(error);
    }
});

userRouter.post('/login', userMiddleware.validateUserLogin, async (req, res) => {
    try {
        await UserController.login(req, res);
    } catch (error) {
        console.error(error);
    }
});

userRouter.post('/login42', userMiddleware.validateUserLogin42, async (req, res) => {
    try {
        await UserController.login42(req, res);
    } catch (error) {
        console.error(error);
    }
});

userRouter.post('/loginGoogle',/* userMiddleware.validateUserLoginGoogle,*/ async (req, res) => {
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

userRouter.post('/id', auth, userMiddleware.validateGetUserById, async (req, res) => {
    try {
        await UserController.getUserById(req, res);
    } catch (error) {
        console.error(error);
    }
});

userRouter.post('/username', auth, userMiddleware.validateGetUserByUsername, async (req, res) => {
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

userRouter.post('/settingsUpdate', auth, userMiddleware.validateSettingsUpdateInfos, async (req, res) => {
    try {
        await UserController.settingsUpdateInfos(req, res);
    } catch (error) {
        console.error(error);
    }
});


userRouter.post('/delete', auth, userMiddleware.validateDeleteUser, async (req, res) => {
    try {
        await UserController.deleteUser(req, res);
    } catch (error) {
        console.error(error);
    }
});

userRouter.post('/resetPassword', userMiddleware.validateResetPassword, async (req, res) => {
    try {
        await UserController.resetPassword(req, res);
    } catch (error) {
        console.error(error);
    }
});

userRouter.post('/resetPasswordValidate', userMiddleware.validateResetPasswordValidate, async (req, res) => {
    try {
        await UserController.resetPasswordValidate(req, res);
    } catch (error) {
        console.error(error);
    }
});

userRouter.post('/oauth/token', validateApiRegister, async (req, res) => {
    try {
        await UserController.apiRegister(req, res);
    } catch (error) {
        console.error(error);
    }
});

module.exports = userRouter;