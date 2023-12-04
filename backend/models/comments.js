'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Comments extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            Comments.belongsTo(models.User, { foreignKey: 'author_id' });
            Comments.hasMany(models.Comments, { foreignKey: 'parent_id', as: 'children' });
            Comments.belongsTo(models.Movies, { foreignKey: 'movie_id' });
        }
    }
    Comments.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        author_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            foreignKey: true,
        },
        text: {
            type: DataTypes.STRING,
            allowNull: false,
            len: [1, 255],
        },
        imdb_id: {
            type: DataTypes.STRING,
            allowNull: true,
            foreignKey: true,
        },
        parent_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            foreignKey: true,
        },
    }, {
        sequelize,
        modelName: 'Comments',
    });
    return Comments;
};