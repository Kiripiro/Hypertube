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

    async _checkIfLegitUser(userId) {
        const existingUser = await User.findOne({ where: { id: userId } });
        if (!existingUser) {
            return false;
        } else if (existingUser.email === null || existingUser.email === "") {
            return false;
        } else {
            return true;
        }
    }

    register = async (req, res) => {
        try {
            const { username, firstName, lastName, email, password, confirm_password, language } = req.body;

            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(409).json({ error: 'Email is already registered.' });
            }
            const existingUsername = await User.findOne({ where: { username } });
            if (existingUsername) {
                return res.status(409).json({ error: 'Username is already taken.' });
            }

            if (password !== confirm_password) {
                return res.status(400).json({ error: 'Passwords do not match' });
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            const token = uuidv4();
            const emailVerificationToken = uuidv4();

            const newUser = await User.create({
                username,
                firstName,
                lastName,
                email,
                password: hashedPassword,
                emailToken: emailVerificationToken,
                avatar: 'baseAvatar.png',
                token: token,
                tokenCreationDate: this._getTimestampString(),
                tokenExpirationDate: this._getTimestampString(1),
                language
            });
            const mailOptions = {
                from: process.env.EMAIL,
                to: newUser.email,
                subject: "Email verification",
                text: "Hi " + newUser.username + "\nClick on the following link to activate your account:\n" + process.env.FRONTEND_URL + "/verification/email/" + emailVerificationToken
            };
            console.log("mailOptions", mailOptions)
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log('error = ' + error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });

            res.cookie('accessToken', this._generateToken(newUser.id, 1), { httpOnly: true, maxAge: maxAgeAccessToken });
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

            if (userExists.emailVerified === false) {
                return res.status(401).json({ message: 'Email not verified' });
            }
            if (userExists.loginApi)
                return res.status(401).json({message: 'You have logged using an API, try using it again'})

            const accessToken = this._generateToken(userExists.id, 1);
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
                "language": userExists.language
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
                    language: 'en'
                });
                res.cookie('accessToken', this._generateToken(newUser.id, 1), { httpOnly: true, maxAge: maxAgeAccessToken });
                res.cookie('refreshToken', refreshToken, { httpOnly: true, maxAge: maxAgeRefreshToken });
                return res.status(201).json({ message: 'User registered successfully', user: newUser });
            }
            const dataToUpdate = {
                token: refreshToken,
                tokenCreationDate: this._getTimestampString(),
                tokenExpirationDate: this._getTimestampString(1)
            };
            await User.update(dataToUpdate, { where: { email: user.data.email } });
            res.cookie('accessToken', this._generateToken(userExists.id, 1), { httpOnly: true, maxAge: maxAgeAccessToken });
            res.cookie('refreshToken', refreshToken, { httpOnly: true, maxAge: maxAgeRefreshToken });
            return res.status(200).json({ message: 'User logged in successfully', user: userExists });
        } catch (error) {
            console.error('Error logging in user:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    };

    loginGoogle = async (req, res) => {
        try {
            const { credential } = req.body;
            const payload = jwt.decode(credential);
            const userExists = await User.findOne({ where: { email: payload.email } });
            const refreshToken = uuidv4();
            if (!userExists) {
                const newUser = await User.create({
                    username: payload.name,
                    firstName: payload.given_name,
                    lastName: payload.family_name,
                    email: payload.email,
                    emailVerified: true,
                    avatar: payload.picture,
                    token: refreshToken,
                    tokenCreationDate: this._getTimestampString(),
                    tokenExpirationDate: this._getTimestampString(1),
                    loginApi: true,
                    language: 'en'
                });
                res.cookie('accessToken', this._generateToken(newUser.id, 1), { httpOnly: true, maxAge: maxAgeAccessToken });
                res.cookie('refreshToken', refreshToken, { httpOnly: true, maxAge: maxAgeRefreshToken });
                return res.redirect(process.env.FRONTEND_URL + '/auth/redirect?id=' + newUser.id + '&username=' + newUser.username + '&firstName=' + newUser.firstName + '&lastName=' + newUser.lastName + '&emailVerified=' + newUser.emailVerified + '&avatar=' + newUser.avatar);
            } else {
                const dataToUpdate = {
                    token: refreshToken,
                    tokenCreationDate: this._getTimestampString(),
                    tokenExpirationDate: this._getTimestampString(1),
                    loginApi: true
                };
                await User.update(dataToUpdate, { where: { email: payload.email } });
                res.cookie('accessToken', this._generateToken(userExists.id, 1), { httpOnly: true, maxAge: maxAgeAccessToken });
                res.cookie('refreshToken', refreshToken, { httpOnly: true, maxAge: maxAgeRefreshToken });
                return res.redirect(process.env.FRONTEND_URL + '/auth/redirect?id=' + userExists.id + '&username=' + userExists.username + '&firstName=' + userExists.firstName + '&lastName=' + userExists.lastName + '&emailVerified=' + userExists.emailVerified + '&avatar=' + userExists.avatar);
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
            const accessToken = this._generateToken(user.id, 1);
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
                    "language": user.language,
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

    async getAllUsernames(req, res) {
        try {
            const users = await User.findAll();
            const usernames = users.map(user => user.username);
            return res.status(200).json({ message: 'Usernames found', usernames: usernames });
        } catch (error) {
            console.error('Error getting usernames:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

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
            const userComments = await Comments.findAll({ where: { author_id: userId } });
            await Promise.all(userComments.map(comment => comment.update({ author_username: user.username })));
            const userReturn = {
                "id": user.id,
                "username": user.username,
                "firstName": user.firstName,
                "lastName": user.lastName,
                "avatar": user.avatar,
                "loginApi": user.loginApi,
                "email_checked": user.email_checked,
                "language": user.language
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
            const id = req.body.userdId;

            if (userId != id)
                return res.status(401).json({message: 'Cannot delete someone\'s else account'})
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

    async emailValidation(req, res) {
        try {
            const validationEmailData = req.body;
            const user = await User.findOne({ where: { emailToken: validationEmailData.token } });
            if (user) {
                const dataToUpdate = {
                    emailVerified: true,
                    emailToken: "",
                };
                await User.update(dataToUpdate, { where: { id: user.id } });
                res.status(200).json({ message: 'Email validated' });
            } else {
                res.status(400).json({ error: 'Incorrect token' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    resetPassword = async (req, res) => {
        try {
            const { email } = req.body;
            const user = await User.findOne({ where: { email } });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            } else {
                if (user.loginApi) {
                    return res.status(400).json({ message: 'You cannot reset the password of a 42 or Google account' });
                }
                if (!user.emailVerified) {
                    return res.status(400).json({ message: 'Email not verified' });
                }
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

    _generateToken(userId, role) {
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
            exp: expirationTimeInSeconds,
            role: role
        };
        const token = jwt.sign(payload, secretKey);

        return token;
    }

    _generateTokenApi(userId, password) {
        const secretKey = process.env.JWT_SECRET_API;
        const expiresInMinutes = Number(process.env.JWT_EXPIRES_IN);

        if (!secretKey || !expiresInMinutes) {
            throw new Error('JWT configuration error');
        }

        const currentTimeInSeconds = Math.floor(Date.now() / 1000);
        const expirationTimeInSeconds = currentTimeInSeconds + expiresInMinutes * 60;

        const payload = {
            userId: userId,
            userPassword: password,
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

    apiAuth = async (req, res) => {
        try {
            const { client, secret } = req.body;
            console.log(client, secret);
            console.log(process.env.API_CLIENT_ID, process.env.API_SECRET);
            console.log(client === process.env.API_CLIENT_ID, secret === process.env.API_SECRET);
            if (client !== process.env.API_CLIENT_ID || secret !== process.env.API_SECRET) {
                return res.status(401).json({ message: 'Invalid credentials' }); 
            }
            const tokenGenerate = this._generateTokenApi(client, secret);
            return res.status(201).json({ token: tokenGenerate });
        } catch (error) {
            console.error('Error apiRegister :', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    };

    apiRegister = async (req, res) => {
        try {
            const { username, password } = req.body;
            const existingUsername = await User.findOne({ where: { username } });
            if (existingUsername) {
                console.log("existingUsername");
                if (!await bcrypt.compare(password, existingUsername.password)) {
                    return res.status(400).json({ message: 'Invalid password' });
                } else {
                    const tokenGenerate = this._generateToken(existingUsername.id, 2);
                    const newRefreshToken = uuidv4();
                    const dataToUpdate = {
                        token: newRefreshToken,
                        tokenCreationDate: this._getTimestampString(),
                        tokenExpirationDate: this._getTimestampString(1)
                    };
                    await User.update(dataToUpdate, { where: { id: existingUsername.id  } });
                    return res.status(201).json({ accesToken: tokenGenerate, refreshToken: newRefreshToken });
                }
            } else {
                const hashedPassword = await bcrypt.hash(password, 10);
                const token = uuidv4();

                const newUser = await User.create({
                    username: username,
                    firstName: "",
                    lastName: "",
                    email: "",
                    password: hashedPassword,
                    avatar: 'baseAvatar.png',
                    token: token,
                    tokenCreationDate: this._getTimestampString(),
                    tokenExpirationDate: this._getTimestampString(1),
                    language: "en",
                    registerOurApi: true
                });
                const tokenGenerate = this._generateToken(newUser.id, 2)
                const refreshToken = token;
                return res.status(201).json({ accesToken: tokenGenerate, refreshToken: refreshToken });
            }
        } catch (error) {
            console.error('Error apiRegister :', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    };

    apiRefreshToken = async (req, res) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).send({ error: "No token provided" });
            }
            const refreshToken = authHeader.split(' ')[1];
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
            let accessToken = "";
            if (user.registerOurApi) {
                accessToken = this._generateToken(user.id, 2);
            } else {
                accessToken = this._generateToken(user.id, 1);
            }
            return res.status(201).json({ accesToken: accessToken, refreshToken: refreshToken });
        } catch (error) {
            console.error('Error api refreshing token:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    };

    apiGetUsers = async (req, res) => {
        try {
            const usersDB = await User.findAll();
            const users = usersDB.map(user => ({
                id: user.id,
                username: user.username,
            }));
            return res.status(200).json({ users: users });
        } catch (error) {
            console.error('Error apiGetUsers :', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    };

    apiGetUserById = async (req, res) => {
        try {
            const user = await User.findOne({ where: { id: req.params.id } });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            } else {
                let avatar = "/app/imagesSaved/" + user.avatar;
                const userData = {
                    "username": user.username,
                    "email": user.email ? user.email : "",
                    "avatar": avatar
                };
                return res.status(200).json({ user: userData });
            }
        } catch (error) {
            console.error('Error apiGetUserById :', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    };

    apiPatchUserById = async (req, res) => {
        try {
            const { username, email, password, url } = req.body;
            const user = await User.findOne({ where: { id: req.params.id } });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            } else {
                const emailUser = await User.findOne({ where: { email } });
                if (emailUser && emailUser.id != user.id) {
                    return res.status(409).json({ message: 'Email already in use' });
                }
                const usernameUser = await User.findOne({ where: { email } });
                if (usernameUser && usernameUser.id != user.id) {
                    return res.status(409).json({ message: 'Username already in use' });
                }
                if (!fs.existsSync(url)) {
                    return res.status(404).json({ message: 'Profile picture not found' });
                }
                const hashedPassword = await bcrypt.hash(password, 10);
                const newUrl = url.substring(url.lastIndexOf('/') + 1);
                const dataToUpdate = {
                    username: username,
                    email: email,
                    password: hashedPassword,
                    avatar: newUrl
                };
                console.log("dataToUpdate = ", dataToUpdate);
                console.log("req.params.id = ", req.params.id);
                await User.update(dataToUpdate, { where: { id: req.params.id } });
                console.log("User updated");
                return res.status(200).json();
            }
        } catch (error) {
            console.error('Error apiGetUserById :', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    };
}

module.exports = new UserController();