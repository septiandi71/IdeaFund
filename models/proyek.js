'use strict';
const { Model, DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  class Proyek extends Model {
    static associate(models) {
      Proyek.belongsTo(models.Mahasiswa, { foreignKey: 'pemilikId', as: 'pemilik' });
      Proyek.belongsTo(models.Kategori, { foreignKey: 'kategoriId', as: 'kategori' });
      Proyek.hasMany(models.Transaksi, { foreignKey: 'proyekId', as: 'transaksiList' });
      Proyek.hasOne(models.Tim, { foreignKey: 'proyekId', as: 'timProyek' });
    }
  }
  Proyek.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
    judul: { type: DataTypes.STRING(255), allowNull: false },
    deskripsi: { type: DataTypes.TEXT, allowNull: true },
    targetDana: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
    danaTerkumpul: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
    batasWaktu: { type: DataTypes.DATE, allowNull: true },
    durasiHari: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'PENDING_REVIEW' },
    pemilikId: { type: DataTypes.UUID, allowNull: false },
    kategoriId: { type: DataTypes.INTEGER, allowNull: false },
    projectImageUrl: { type: DataTypes.STRING(255), allowNull: true },
    isStage1Verified: { type: DataTypes.BOOLEAN, defaultValue: false },
    isStage2Verified: { type: DataTypes.BOOLEAN, defaultValue: false },
    onChainProjectId: { type: DataTypes.STRING, unique: true, allowNull: true }, // ID Proyek di SC (UUID Proyek)
    isPublishedOnChain: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
    onChainDeadline: { type: DataTypes.DATE, allowNull: true },
    txHashPublication: { type: DataTypes.STRING(66), allowNull: true, unique: true } // Hash transaksi pembuatan campaign di SC
  }, {
    sequelize,
    modelName: 'Proyek',
    tableName: 'Proyek' // Singular
  });
  return Proyek;
};