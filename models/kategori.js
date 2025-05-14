'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Kategori extends Model {
    static associate(models) {
      Kategori.hasMany(models.Proyek, {
        foreignKey: 'kategoriId', // Nama FK di tabel Proyek
        as: 'proyekList'
      });
    }
  }
  Kategori.init({
    id_kategori: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    nama_kategori: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    deskripsi_kategori: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Kategori',
    tableName: 'Kategori', // Singular
  });
  return Kategori;
};