"use strict";

module.exports = function(sequelize, DataTypes) {
  return sequelize.define( "Project", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    data: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isAlphanumeric: true
      }
    },
    author: {
      type: DataTypes.STRING,
      allowNull: false
    },
    template: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isAlphanumeric: true
      }
    },
    // The original version of Butter that was used when project
    // was first created. This will usually be the same as
    // latestButterVersion, but could be different (i.e., a newer
    // version of Butter was used to edit a project), and gives
    // some insight into what was used originally, in case of
    // breaking changes.
    originalButterVersion: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // The latest version of Butter that was used to save the project.
    latestButterVersion: {
      type: DataTypes.STRING,
      allowNull: false
    },
    remixedFrom: {
      type: DataTypes.INTEGER
    },
    description: {
      type: DataTypes.STRING
    }
  });
};
