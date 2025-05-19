'use strict';
const { Model, DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  class Mahasiswa extends Model {
    static associate(models) {
      Mahasiswa.belongsTo(models.Prodi, { foreignKey: 'id_prodi', as: 'prodi' });
      Mahasiswa.hasMany(models.Proyek, { foreignKey: 'pemilikId', sourceKey: 'id', as: 'proyekDiajukan' });
      Mahasiswa.hasMany(models.Tim, { foreignKey: 'ketuaId', sourceKey: 'id', as: 'timDipimpin' });
      Mahasiswa.belongsToMany(models.Tim, {
        through: models.AnggotaTim,
        foreignKey: 'mahasiswaId',
        sourceKey: 'id',
        otherKey: 'timId',
        as: 'timDiikuti'
      });

      // Relasi ke Transaksi sebagai target user
      Mahasiswa.hasMany(models.Transaksi, { foreignKey: 'targetUserId', as: 'transaksiSebagaiTarget' });
    }
  }
  Mahasiswa.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    nim: { type: DataTypes.STRING(15), allowNull: false, unique: true },
    namaLengkap: { type: DataTypes.STRING(255), allowNull: false },
    emailKampus: { type: DataTypes.STRING(255), allowNull: false, unique: true, validate: { isEmail: true } },
    walletAddress: { type: DataTypes.STRING(42), allowNull: false, unique: true },
    id_prodi: { type: DataTypes.INTEGER, allowNull: false },
    namaKelas: { type: DataTypes.STRING(50), allowNull: true },
    tahunMasuk: { type: DataTypes.STRING(10), allowNull: true },
    statusAktif: { type: DataTypes.BOOLEAN, defaultValue: true },
    otp: { type: DataTypes.STRING(6), allowNull: true },
    otpExpiresAt: { type: DataTypes.DATE, allowNull: true }
  }, {
    sequelize,
    modelName: 'Mahasiswa',
    tableName: 'Mahasiswa'
  });
  return Mahasiswa;
};