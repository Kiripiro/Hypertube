'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class MoviesHistory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      //reference userId to User.id
      MoviesHistory.belongsTo(models.User, {
        foreignKey: 'userId',
        onDelete: 'CASCADE'
      });
    }
  }
  MoviesHistory.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: DataTypes.INTEGER,
    imdbId: DataTypes.STRING,
    title: DataTypes.STRING,
    timestamp: DataTypes.FLOAT
  }, {
    sequelize,
    modelName: 'MoviesHistory',
  });
  return MoviesHistory;
};