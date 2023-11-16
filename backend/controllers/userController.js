const { User } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid')

var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
    }
});

class UserController {
    register = async (req, res) => {
        try {
            const { username, firstName, lastName, email, password } = req.body;

            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(409).json({ message: 'Email is already registered.' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const token = uuidv4();

            const newUser = await User.create({
                username,
                firstName,
                lastName,
                email,
                password: hashedPassword,
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

            res.cookie('accessToken', this._generateToken(newUser.id), { httpOnly: true, maxAge: 900000 });
            res.cookie('refreshToken', token, { httpOnly: true, maxAge: 86400000 });
            return res.status(201).json({ message: 'User registered successfully', user: newUser });
        } catch (error) {
            console.error('Error registering user:', error);
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

        date.setDate(date.getDate() + nextDays);
        const time = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
        const dateString = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + time;

        return dateString;
    }
}

module.exports = new UserController();