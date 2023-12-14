const fs = require('fs');
const path = require('path');
const { CronJob } = require('cron');
const { MoviesHistory } = require('../models');
const sequelize = require('./db');
const { Op } = require('sequelize');
const cleanupTask = async () => {
    try {
        // const oneMonthAgo = new Date();
        // oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const oneMonthAgo = new Date(new Date().setHours(new Date().getHours() - 2));
        const rows = await MoviesHistory.findAll({
            attributes: [[sequelize.fn('DISTINCT', sequelize.col('title')), 'title']],
            where: {
                updatedAt: {
                    [Op.lt]: oneMonthAgo,
                },
            },
        });

        for (const { title } of rows) {
            const count = await MoviesHistory.count({
                where: {
                    title,
                    updatedAt: {
                        [Op.gte]: oneMonthAgo,
                    },
                },
            });

            if (count === 0) {
                if (fs.existsSync(path.join(__dirname, `../download/${title}`))) {
                    const files = fs.readdirSync(path.join(__dirname, `../download/${title}`));
                    const file = files[0];
                    const extension = path.extname(file);
                    fs.unlinkSync(path.join(__dirname, `../download/${title}/${file}.${extension}`));
                    //delete the subtitles
                }
                console.log(`Deleted file and subtitles for movieTitle '${title}'`);
            }
        }
    } catch (error) {
        console.error('Error during cleanup task:', error.message);
    }
};

const job = new CronJob('*/1 * * * *', cleanupTask);;

module.exports = job;