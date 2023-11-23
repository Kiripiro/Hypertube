const Sequelize = require('sequelize');
const UserModel = require('./models/user');
const express = require('express');
const app = express();
const cors = require('cors');
const sequelize = require('./config/db');
const mainRouter = require('./routes/mainRouter');

require('./config/checkEnv');
const port = process.env.NODE_PORT;

const User = UserModel(sequelize, Sequelize);

sequelize.sync({ alter: false }) //enable alter to update tables, disable to prevent data loss
    .then(() => {
        console.log('Tables synchronized successfully');
    })
    .catch((err) => {
        if (err.name === 'SequelizeConnectionRefusedError') {
            console.error('Unable to connect to the database:', err);
        } else if (err.name === 'SequelizeValidationError') {
            console.error('Validation error:', err);
        } else {
            console.error('Error while synchronizing tables', err);
        }
    });

var corsOptions = {
    origin: 'http://localhost:4200',
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(mainRouter);

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});