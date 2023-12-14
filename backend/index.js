const express = require('express');
const app = express();
const cors = require('cors');
const sequelize = require('./config/db');
const mainRouter = require('./routes/mainRouter');
const job = require('./config/cron');

require('./config/checkEnv');
require('./config/checkTorrentApi');
require('./config/cron');

const port = process.env.NODE_PORT;

sequelize.sync({ alter: true }) //enable alter to update tables, disable to prevent data loss
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
app.use('/subtitles', express.static('/app/subtitles/vtt'));
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});

job.start();