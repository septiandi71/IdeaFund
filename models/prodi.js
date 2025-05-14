'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Prodi extends Model {
    static associate(models) {
      // Relasi: Satu Prodi dimiliki oleh satu Fakultas
      Prodi.belongsTo(models.Fakultas, {
        foreignKey: 'id_fakultas',
        as: 'fakultas'
      });
      // Relasi: Satu Prodi memiliki banyak Mahasiswa
      Prodi.hasMany(models.Mahasiswa, {
        foreignKey: 'id_prodi',
        as: 'mahasiswaList'
      });
      // Relasi: Satu Prodi bisa ada di banyak DataReferensiBAAK
       Prodi.hasMany(models.MahasiswaReferensi, {
         foreignKey: 'id_prodi',
         as: 'mahasiswaReferensiDataList'
       });
    }
  }
  Prodi.init({
    id_prodi: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    nama_prodi: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    id_fakultas: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    jenjang: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    deskripsi_prodi: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Prodi',
    tableName: 'Prodi',
  });
  return Prodi;
};