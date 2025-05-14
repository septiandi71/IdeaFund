'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class MahasiswaReferensi extends Model {
    static associate(models) {
      MahasiswaReferensi.belongsTo(models.Prodi, { foreignKey: 'id_prodi', as: 'prodi' });
    }
  }
  MahasiswaReferensi.init({
    nim: { type: DataTypes.STRING(15), primaryKey: true, allowNull: false },
    namaLengkap: { type: DataTypes.STRING(255), allowNull: false },
    emailKampus: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    id_prodi: { type: DataTypes.INTEGER, allowNull: false },
    namaKelas: { type: DataTypes.STRING(50), allowNull: true },
    idTahunAjar: { type: DataTypes.STRING(10), allowNull: true },
    tahunMasuk: { type: DataTypes.STRING(10), allowNull: true }
  }, {
    sequelize,
    modelName: 'MahasiswaReferensi',
    tableName: 'MahasiswaReferensi' // Eksplisit singular
  });
  return MahasiswaReferensi;
};