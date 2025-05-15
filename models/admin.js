'use strict';
const { Model, DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  class Admin extends Model {
    static associate(models) {
      // Jika Transaksi memiliki FK adminId
      Admin.hasMany(models.Transaksi, { foreignKey: 'adminId', sourceKey: 'id', as: 'transaksiDonasi' });
    }
  }
  Admin.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
    namaLengkap: { type: DataTypes.STRING(255), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true, validate: { isEmail: true } },
    walletAddress: { type: DataTypes.STRING(42), allowNull: false, unique: true },
    otp: { type: DataTypes.STRING(6), allowNull: true },
    otpExpiresAt: { type: DataTypes.DATE, allowNull: true }
  }, {
    sequelize,
    modelName: 'Admin',
    tableName: 'Admin' // Plural
  });
  return Admin;
};