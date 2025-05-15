'use strict';
const { Model, DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  class Donatur extends Model {
    static associate(models) {
      // Jika Transaksi memiliki FK donaturId
      Donatur.hasMany(models.Transaksi, { foreignKey: 'donaturId', sourceKey: 'id', as: 'transaksiDonasi' });
    }
  }
  Donatur.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
    namaLengkap: { type: DataTypes.STRING(255), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true, validate: { isEmail: true } },
    walletAddress: { type: DataTypes.STRING(42), allowNull: false, unique: true },
    otp: { type: DataTypes.STRING(6), allowNull: true },
    otpExpiresAt: { type: DataTypes.DATE, allowNull: true }
  }, {
    sequelize,
    modelName: 'Donatur',
    tableName: 'Donatur' // Plural
  });
  return Donatur;
};