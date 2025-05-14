'use strict';
const { Model } = require('sequelize'); // Cukup impor Model di sini

module.exports = (sequelize, DataTypes) => { // Terima DataTypes sebagai parameter
  class Fakultas extends Model {
    static associate(models) {
      Fakultas.hasMany(models.Prodi, {
        foreignKey: 'id_fakultas',
        as: 'prodiList'
      });
    }
  }
  Fakultas.init({
    id_fakultas: {
      type: DataTypes.INTEGER, // Gunakan DataTypes dari parameter
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    nama_fakultas: {
      type: DataTypes.STRING(100), // Gunakan DataTypes dari parameter
      allowNull: false,
      unique: true
    },
    deskripsi_fakultas: {
      type: DataTypes.TEXT, // Gunakan DataTypes dari parameter
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Fakultas',
    tableName: 'Fakultas',
  });
  return Fakultas;
};