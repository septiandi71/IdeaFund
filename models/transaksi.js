'use strict';
const { Model, DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  class Transaksi extends Model {
    static associate(models) {
      Transaksi.belongsTo(models.Proyek, { foreignKey: 'proyekId', as: 'proyek' });
      Transaksi.belongsTo(models.Donatur, { foreignKey: 'donaturId', as: 'donatur' });
    }
  }
  Transaksi.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
    proyekId: { type: DataTypes.UUID, allowNull: false },
    donaturId: { type: DataTypes.UUID, allowNull: true },
    donaturWallet: { type: DataTypes.STRING(42), allowNull: false },
    jumlah: { type: DataTypes.BIGINT, allowNull: false },
    timestamp: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    txHash: { type: DataTypes.STRING(66), allowNull: false, unique: true },
    tipe: { type: DataTypes.STRING(20), allowNull: false }
  }, {
    sequelize,
    modelName: 'Transaksi',
    tableName: 'Transaksi' // Singular
  });
  return Transaksi;
};