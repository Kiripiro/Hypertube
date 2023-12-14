const { DataTypes } = require('sequelize');

module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        args: true,
        msg: 'Username already exists',
      },
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    passwordReset: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    passwordResetToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    emailToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tokenCreationDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    tokenExpirationDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    loginApi: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    language: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });

  return User;
};