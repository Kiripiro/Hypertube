const fs = require('fs');
const path = require('path');
const { CronJob } = require('cron');
const { MoviesHistory } = require('../models');
const { Op } = require('sequelize');
const StreamController = require('../controllers/streamController');

const cleanupTask = async () => {
    try {
        console.log('Running cleanup task...');
        const oneMonthAgo = new Date();
        // Uncomment the line below for production use
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        // Fake date for testing purposes, use 5min ago instead
        // oneMonthAgo.setMinutes(oneMonthAgo.getMinutes() - 1);

        const rows = await MoviesHistory.findAll({
            attributes: ['imdbId'],
            where: {
                updatedAt: {
                    [Op.lt]: oneMonthAgo,
                },
            },
        });

        if (rows.length > 0) {
            console.log(`Found ${rows.length} movie(s) to delete`);
        } else {
            console.log(`Found 0 movies to delete`);
            return;
        }

        for (const { imdbId } of rows) {
            const count = await MoviesHistory.count({
                where: {
                    imdbId,
                    updatedAt: {
                        [Op.gte]: oneMonthAgo,
                    },
                },
            });

            const mp4Path = path.join(__dirname, `../download/${imdbId}.mp4`);
            const mkvPath = path.join(__dirname, `../download/${imdbId}.mkv`);
            const webmPath = path.join(__dirname, `../download/${imdbId}.webm`);
            const filePath = fs.existsSync(mp4Path) ? mp4Path : fs.existsSync(mkvPath) ? mkvPath : fs.existsSync(webmPath) ? webmPath : null;
            StreamController.removeMovie(imdbId);
            if (filePath && count === 0) {
                console.log(`Deleting movie with imdb_id '${imdbId}'`);
                const files = fs.existsSync(filePath) ? [filePath] : [];
                const file = files[0];

                if (file) {
                    fs.unlinkSync(filePath);

                    const subtitleDirVtt = path.join(__dirname, `../subtitles/vtt`);
                    const subtitleDirSrt = path.join(__dirname, `../subtitles/srt`);

                    const deleteSubtitles = (subtitleDir, extension) => {
                        const subtitleFiles = fs.readdirSync(subtitleDir)
                            .filter(file => file.startsWith(`${imdbId}-`) && file.endsWith(extension));

                        subtitleFiles.forEach(subtitleFile => {
                            const filePath = path.join(subtitleDir, subtitleFile);
                            fs.unlinkSync(filePath);
                        });
                    };

                    deleteSubtitles(subtitleDirVtt, '.vtt');
                    deleteSubtitles(subtitleDirSrt, '.srt');

                    console.log(`Deleted file and subtitles for movie with imdb_id '${imdbId}'`);
                } else {
                    console.log(`No file found for movie with imdb_id '${imdbId}'`);
                }
            }
        }
    } catch (error) {
        console.error('Error during cleanup task:', error.message);
    }
};

// Run every minute for testing purposes
// const job = new CronJob('*/1 * * * *', cleanupTask);

// Uncomment the line below for production use to run every day at 00:00
const job = new CronJob('0 0 * * *', cleanupTask);

module.exports = job;
