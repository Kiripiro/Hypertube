const Sequelize = require('sequelize');

require('dotenv').config();
const { DATABASE, USER, PASSWORD, HOST } = process.env;

const sequelize = new Sequelize(DATABASE, USER, PASSWORD, {
    host: HOST,
    dialect: 'mysql',
    logging: false
});

module.exports = sequelize;