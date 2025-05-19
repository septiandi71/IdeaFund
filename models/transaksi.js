'use strict';
const { Model, DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  class Transaksi extends Model {
    static associate(models) {
      // Relasi ke Proyek
      Transaksi.belongsTo(models.Proyek, { foreignKey: 'proyekId', as: 'proyek' });

      // Relasi ke Mahasiswa (jika target user adalah mahasiswa)
      Transaksi.belongsTo(models.Mahasiswa, { foreignKey: 'targetUserId', as: 'targetMahasiswa' });

      // Relasi ke Donatur (jika target user adalah donatur)
      Transaksi.belongsTo(models.Donatur, { foreignKey: 'targetUserId', as: 'targetDonatur' });
    }
  }
  Transaksi.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    proyekId: { type: DataTypes.UUID, allowNull: false },
    targetUserId: { type: DataTypes.UUID, allowNull: true },
    targetUserWallet: { type: DataTypes.STRING(42), allowNull: false },
    jumlah: { type: DataTypes.BIGINT, allowNull: false },
    timestamp: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    txHash: { type: DataTypes.STRING(66), allowNull: false, unique: true },
    tipe: { type: DataTypes.STRING(20), allowNull: false } // 'DONASI', 'PENCAIRAN_TAHAP1', 'PENCAIRAN_TAHAP2'
  }, {
    sequelize,
    modelName: 'Transaksi',
    tableName: 'Transaksi'
  });
  return Transaksi;
};