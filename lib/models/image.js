"use strict";

module.exports = function(sequelize, DataTypes) {
  return sequelize.define( "Image", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    hash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    project: {
      type: DataTypes.INTEGER,
      allowNull: false,
    }
  });
};
