'use strict';
const { Model, DataTypes } = require('sequelize'); // Impor DataTypes
module.exports = (sequelize) => {
  class Mahasiswa extends Model {
    static associate(models) {
      Mahasiswa.belongsTo(models.Prodi, { foreignKey: 'id_prodi', as: 'prodi' });
      // Relasi ke Proyek, Tim, AnggotaTim akan menggunakan Mahasiswa.id (PK UUID) sebagai FK
      Mahasiswa.hasMany(models.Proyek, { foreignKey: 'pemilikId', sourceKey: 'id', as: 'proyekDiajukan' });
      Mahasiswa.hasMany(models.Tim, { foreignKey: 'ketuaId', sourceKey: 'id', as: 'timDipimpin' });
      Mahasiswa.belongsToMany(models.Tim, {
        through: models.AnggotaTim,
        foreignKey: 'mahasiswaId', // FK di AnggotaTim yang merujuk ke Mahasiswa.id
        sourceKey: 'id',
        otherKey: 'timId',
        as: 'timDiikuti'
      });
    }
  }
  Mahasiswa.init({
    id: {
      type: DataTypes.UUID, // atau STRING(36)
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
    tableName: 'Mahasiswa' // Plural default
  });
  return Mahasiswa;
};