const { User, InvalidTokens, Comments } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid')
const axios = require('axios');

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client();
const fs = require('fs');

var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
    }
});

const maxAgeAccessToken = 900000;
const maxAgeRefreshToken = 86400000;

class UserController {

    register = async (req, res) => {
        try {
            const { username, firstName, lastName, email, password } = req.body;

            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(409).json({ error: 'Email is already registered.' });
            }
            const existingUsername = await User.findOne({ where: { username } });
            if (existingUsername) {
                return res.status(409).json({ error: 'Username is already taken.' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const token = uuidv4();

            const newUser = await User.create({
                username,
                firstName,
                lastName,
                email,
                password: hashedPassword,
                avatar: 'baseAvatar.png',
                token: token,
                tokenCreationDate: this._getTimestampString(),
                tokenExpirationDate: this._getTimestampString(1)
            });
            // mailOptions.to = userData.email;
            // mailOptions.subject = "Email verification";
            // mailOptions.text = "Hi " + userData.username + "\nClick on the following link to activate your account:\n" + process.env.FRONTEND_URL + "/verification/email/" + emailVerificationToken;
            // transporter.sendMail(mailOptions, function (error, info) {
            //     if (error) {
            //         console.log('error = ' + error);
            //     } else {
            //         console.log('Email sent: ' + info.response);
            //     }
            // });

            res.cookie('accessToken', this._generateToken(newUser.id), { httpOnly: true, maxAge: maxAgeAccessToken });
            res.cookie('refreshToken', token, { httpOnly: true, maxAge: maxAgeRefreshToken });
            return res.status(201).json({ message: 'User registered successfully', user: newUser });
        } catch (error) {
            console.error('Error registering user:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    };

    login = async (req, res) => {
        try {
            const { username, password } = req.body;
            const userExists = await User.findOne({ where: { username } });
            if (!userExists) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            if (!userExists.password) {
                return res.status(401).json({ message: 'Invalid credentials. You may have signed up with the 42 or Google\'s API' });
            }
            const isPasswordValid = await bcrypt.compare(password, userExists.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Invalid password' });
            }

            // if (userExists.emailVerified === false) {
            //     return res.status(401).json({ message: 'Email not verified' });
            // }

            const accessToken = this._generateToken(userExists.id);
            const refreshToken = uuidv4();
            if (userExists.passwordReset) {
                const dataToUpdate = {
                    passwordReset: false,
                    passwordResetToken: null,
                    token: refreshToken,
                    tokenCreationDate: this._getTimestampString(),
                    tokenExpirationDate: this._getTimestampString(1)
                };
                await User.update(dataToUpdate, { where: { username } });
            } else {
                const dataToUpdate = {
                    token: refreshToken,
                    tokenCreationDate: this._getTimestampString(),
                    tokenExpirationDate: this._getTimestampString(1)
                };
                await User.update(dataToUpdate, { where: { username } });
            }
            const user = {
                "id": userExists.id,
                "username": userExists.username,
                "firstName": userExists.firstName,
                "lastName": userExists.lastName,
                "avatar": userExists.avatar,
            };
            console.log(Date.now());
            res.cookie('accessToken', accessToken, { httpOnly: true, maxAge: maxAgeAccessToken });
            res.cookie('refreshToken', refreshToken, { httpOnly: true, maxAge: maxAgeRefreshToken });
            return res.status(200).json({ message: 'User logged in successfully', user: user });
        } catch (error) {
            console.error('Error logging in user:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    };

    login42 = async (req, res) => {
        try {
            const { code } = req.body;
            const response = await axios.post('https://api.intra.42.fr/oauth/token', {
                grant_type: 'authorization_code',
                client_id: process.env.CLIENT_UID_42,
                client_secret: process.env.CLIENT_SECRET_42,
                code: code,
                redirect_uri: 'http://localhost:4200/auth/login'
            });
            const accessToken = response.data.access_token;
            const headers = { Authorization: 'Bearer ' + accessToken };
            const user = await axios.get('https://api.intra.42.fr/v2/me', {
                headers: headers
            });
            const userExists = await User.findOne({ where: { email: user.data.email } });
            const refreshToken = uuidv4();
            if (!userExists) {
                const newUser = await User.create({
                    username: user.data.login,
                    firstName: user.data.first_name,
                    lastName: user.data.last_name,
                    email: user.data.email,
                    email_checked: true,
                    avatar: user.data.image.link,
                    token: refreshToken,
                    tokenCreationDate: this._getTimestampString(),
                    tokenExpirationDate: this._getTimestampString(1),
                    loginApi: true,
                });
                res.cookie('accessToken', this._generateToken(newUser.id), { httpOnly: true, maxAge: maxAgeAccessToken });
                res.cookie('refreshToken', refreshToken, { httpOnly: true, maxAge: maxAgeRefreshToken });
                return res.status(201).json({ message: 'User registered successfully', user: newUser });
            }
            const dataToUpdate = {
                token: refreshToken,
                tokenCreationDate: this._getTimestampString(),
                tokenExpirationDate: this._getTimestampString(1)
            };
            await User.update(dataToUpdate, { where: { email: user.data.email } });
            res.cookie('accessToken', this._generateToken(userExists.id), { httpOnly: true, maxAge: maxAgeAccessToken });
            res.cookie('refreshToken', refreshToken, { httpOnly: true, maxAge: maxAgeRefreshToken });
            return res.status(200).json({ message: 'User logged in successfully', user: userExists });
        } catch (error) {
            console.error('Error logging in user:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    };

    loginGoogle = async (req, res) => {
        try {
            const userData = req.body.user;
            const userExists = await User.findOne({ where: { email: userData.email } });
            if (userExists && !userExists.loginApi) {
                return res.status(401).json({ error: 'Invalid credentials, you have signed up manually using this email.' });
            }
            const refreshToken = uuidv4();
            if (!userExists) {
                const newUser = await User.create({
                    username: userData.name,
                    firstName: userData.given_name,
                    lastName: userData?.family_name || null,
                    email: userData.email,
                    email_checked: true,
                    avatar: userData.avatar || 'baseAvatar.png',
                    token: refreshToken,
                    tokenCreationDate: this._getTimestampString(),
                    tokenExpirationDate: this._getTimestampString(1),
                    loginApi: true,
                });
                res.cookie('accessToken', this._generateToken(newUser.id), { httpOnly: true, maxAge: maxAgeAccessToken });
                res.cookie('refreshToken', userData.sub, { httpOnly: true, maxAge: maxAgeRefreshToken });
                return res.status(201).json({ message: 'User registered successfully', user: newUser });
            } else {
                const dataToUpdate = {
                    token: refreshToken,
                    tokenCreationDate: this._getTimestampString(),
                    tokenExpirationDate: this._getTimestampString(1)
                };
                await User.update(dataToUpdate, { where: { email: userData.email } });
                res.cookie('accessToken', this._generateToken(userExists.id), { httpOnly: true, maxAge: maxAgeAccessToken });
                res.cookie('refreshToken', userData.sub, { httpOnly: true, maxAge: maxAgeRefreshToken });
                return res.status(200).json({ message: 'User logged in successfully', user: userExists });
            }
        } catch (error) {
            console.error('Error logging in user:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    };

    logout = async (req, res) => {
        try {
            const accessToken = this._parseCookie(req, 'accessToken');
            if (!accessToken) {
                return res.status(401).json({ message: 'Access token missing' });
            }
            const refreshToken = this._parseCookie(req, 'refreshToken');
            if (!refreshToken) {
                return res.status(401).json({ message: 'Refresh token missing' });
            }

            const invalidToken = await InvalidTokens.create({ accessToken, refreshToken });
            if (invalidToken) {
                res.clearCookie('accessToken');
                res.clearCookie('refreshToken');
                return res.status(200).json({ message: 'User logged out successfully' });
            } else {
                return res.status(401).json({ message: 'Invalid token' });
            }
        } catch (error) {
            console.error('Error logging out user:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    };

    refresh = async (req, res) => {
        try {
            const refreshToken = this._parseCookie(req, 'refreshToken');
            // console.log(refreshToken);
            if (!refreshToken) {
                return res.status(401).json({ message: 'Refresh token missing' });
            }
            if (await InvalidTokens.findOne({ where: { refreshToken: refreshToken } })) {
                return res.status(401).json({ message: 'Invalid token' });
            }
            const user = await User.findOne({ where: { token: refreshToken } });
            if (!user) {
                return res.status(403).json({ message: 'Invalid token' });
            }
            const expiration = new Date(user.tokenExpirationDate);
            const now = new Date();
            if (now > expiration) {
                return res.status(401).json({ message: 'Token expired' });
            }
            const accessToken = this._generateToken(user.id);
            res.cookie('accessToken', accessToken, { httpOnly: true, maxAge: maxAgeAccessToken });
            res.status(200).json({ message: 'Token refreshed successfully' });
        } catch (error) {
            console.error('Error refreshing token:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    };

    getUserById = async (req, res) => {
        try {
            const user = await User.findOne({ where: { id: req.body.id } });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            } else {
                let avatar = user.avatar;
                if (avatar && !avatar.includes("http://") && !avatar.includes("https://")) {
                    avatar = await this._getPictureDataFromPath("/app/imagesSaved/" + avatar);
                }
                const userData = {
                    "id": user.id,
                    "username": user.username,
                    "firstName": user.firstName,
                    "lastName": user.lastName,
                    "avatar": avatar,
                    "loginApi": user.loginApi,
                };
                return res.status(200).json({ message: 'User found', user: userData });
            }
        } catch (error) {
            console.error('Error getting user:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    };

    getUserByUsername = async (req, res) => {
        try {
            const user = await User.findOne({ where: { username: req.body.username } });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            } else {
                let avatar = user.avatar;
                if (avatar && !avatar.includes("http://") && !avatar.includes("https://")) {
                    avatar = await this._getPictureDataFromPath("/app/imagesSaved/" + avatar);
                }
                const userData = {
                    "id": user.id,
                    "username": user.username,
                    "firstName": user.firstName,
                    "lastName": user.lastName,
                    "avatar": avatar,
                };
                return res.status(200).json({ message: 'User found', user: userData });
            }
        } catch (error) {
            console.error('Error getting user:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    };

    getPersonalUser = async (req, res) => {
        try {
            const user = await User.findOne({ where: { id: req.user.userId } });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            } else {
                const userData = {
                    "id": user.id,
                    "username": user.username,
                    "firstName": user.firstName,
                    "lastName": user.lastName,
                    "avatar": user.avatar,
                    "loginApi": user.loginApi,
                    "email_checked": user.email_checked,
                };
                return res.status(200).json({ message: 'User found', user: userData });
            }
        } catch (error) {
            console.error('Error getting user:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    };

    async settingsUpdateInfos(req, res) {
        try {
            const userId = req.user.userId;
            const userData = req.body.user;
            const file = req.body.file;
            if (!userData) {
                res.status(400).json({ error: 'Missing data' });
                return;
            }

            if (userData.username && (await User.findOne({ where: { username: userData.username } })) !== null) {
                res.status(400).json({ error: 'Username already in use' });
                return;
            }
            if (userData.email && (await User.findOne({ where: { email: userData.email } })) !== null) {
                res.status(400).json({ error: 'Email already in use' });
                return;
            }

            if (file) {
                try {
                    const avatar = await this._savePicture(file, userId);
                    if (avatar) {
                        userData.avatar = avatar;
                    }
                } catch (error) {
                    console.error('Error saving picture:', error);
                }
            }
            if (userData.password && userData.confirm_password && userData.password == userData.confirm_password) {
                const hashedPassword = await bcrypt.hash(userData.password, 10);
                userData.password = hashedPassword;
            } else if (userData.password && userData.confirm_password && userData.password != userData.confirm_password) {
                res.status(400).json({ error: 'Passwords do not match' });
                return;
            } else if (userData.password && !userData.confirm_password || !userData.password && userData.confirm_password) {
                res.status(400).json({ error: 'Missing password or confirmation' });
                return;
            }
            await User.update(userData, { where: { id: userId } });
            const user = await User.findOne({ where: { id: userId } });
            const userReturn = {
                "id": user.id,
                "username": user.username,
                "firstName": user.firstName,
                "lastName": user.lastName,
                "avatar": user.avatar,
                "loginApi": user.loginApi,
                "email_checked": user.email_checked,
            };
            return res.status(200).json({ message: 'User updated', user: userReturn });
        } catch (error) {
            console.error('Error updating user:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    deleteUser = async (req, res) => {
        try {
            const userId = req.user.userId;
            const user = await User.findOne({ where: { id: userId } });

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const userComments = await Comments.findAll({ where: { author_id: userId } });

            await Promise.all(userComments.map(comment => comment.destroy()));
            await user.destroy();

            if (user.avatar) {
                await this._removePicture(user.avatar);
            }

            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
            return res.status(200).json({ message: 'User deleted' });
        } catch (error) {
            console.error('Error deleting user:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    };


    resetPassword = async (req, res) => {
        try {
            const { email } = req.body;
            const user = await User.findOne({ where: { email } });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            } else {
                //send an email with a link to reset password
                const passwordResetToken = uuidv4();
                const dataToUpdate = {
                    passwordReset: true,
                    passwordResetToken: passwordResetToken,
                };
                await User.update(dataToUpdate, { where: { email } });
                const mailOptions = {
                    from: process.env.EMAIL,
                    to: email,
                    subject: 'Password reset',
                    text: 'Hi ' + user.username + '\nClick on the following link to reset your password:\n' + process.env.FRONTEND_URL + '/verification/resetpassword/' + passwordResetToken
                };
                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.log('error = ' + error);
                    } else {
                        console.log('Email sent: ' + info.response);
                    }
                });
                return res.status(200).json({ message: 'Email sent, please check your emails.' });
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    };

    resetPasswordValidate = async (req, res) => {
        try {
            console.log(req.body);
            const { password, passwordResetToken } = req.body;
            const user = await User.findOne({ where: { passwordResetToken } });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            } else {
                const hashedPassword = await bcrypt.hash(password, 10);
                const dataToUpdate = {
                    password: hashedPassword,
                    passwordReset: false,
                    passwordResetToken: null,
                };
                await User.update(dataToUpdate, { where: { passwordResetToken } });
                return res.status(200).json({ message: 'Password updated' });
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    };

    _generateToken(userId) {
        const secretKey = process.env.JWT_SECRET;
        const expiresInMinutes = Number(process.env.JWT_EXPIRES_IN);

        if (!secretKey || !expiresInMinutes) {
            throw new Error('JWT configuration error');
        }

        const currentTimeInSeconds = Math.floor(Date.now() / 1000);
        const expirationTimeInSeconds = currentTimeInSeconds + expiresInMinutes * 60;

        const payload = {
            userId: userId,
            iat: currentTimeInSeconds,
            exp: expirationTimeInSeconds
        };
        const token = jwt.sign(payload, secretKey);

        return token;
    }

    _getTimestampString(nextDays = 0) {
        const date = new Date();

        const options = { timeZone: 'Europe/Paris' };
        const formatter = new Intl.DateTimeFormat('en-US', options);

        date.setDate(date.getDate() + nextDays);
        const dateString = formatter.format(date);

        return dateString;
    }

    _parseCookie(req, toFind) {
        const cookies = req.headers.cookie;
        if (cookies) {
            const cookieArray = cookies.split(';');
            for (let i = 0; i < cookieArray.length; i++) {
                const cookie = cookieArray[i].split('=');
                if (cookie[0].trim() === toFind) {
                    return cookie[1];
                }
            }
        }
        return null;
    }

    async _verify(token) {
        try {
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });

            const payload = ticket.getPayload();
            return payload;
        } catch (error) {
            console.error(error);
        }
    }

    async _savePicture(file, userId) {
        return new Promise((resolve, reject) => {
            const fileExtension = file.substring("data:image/".length, file.indexOf(";base64"));
            const filename = 'avatar_' + userId + '.' + fileExtension;
            const path = "/app/imagesSaved/" + filename;
            const base64Data = file.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

            fs.writeFile(path, base64Data, 'base64', (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(filename);
                }
            });
        });
    }

    async _removePicture(filename) {
        fs.readdir("/app/imagesSaved/", (error, files) => {
            if (error) {
                return null;
            }
            const fileToRemove = files.find((file) =>
                file.startsWith(filename)
            );
            if (fileToRemove && fileToRemove.length > 0) {
                const pathToRemove = "/app/imagesSaved/" + fileToRemove;
                fs.unlink(pathToRemove, (error) => {
                    if (error) {
                        return null;
                    } else {
                        return true;
                    }
                });
            }
        });
    }

    async _getPictureDataFromPath(path) {
        if (!path || path.length <= 0) {
            return "";
        }
        return new Promise((resolve, reject) => {
            fs.readFile(path, (error, data) => {
                if (error) {
                    reject(error);
                } else {
                    const imageString = data.toString('base64');
                    resolve(imageString);
                }
            });
        });
    }

}

module.exports = new UserController();