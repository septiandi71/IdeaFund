'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Mahasiswa', { // Plural default
      id: { // PK baru UUID
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID, // atau Sequelize.STRING(36)
        defaultValue: Sequelize.UUIDV4 // Di model untuk auto-generate, bukan di migrasi
      },
      nim: {
        type: Sequelize.STRING(15),
        allowNull: false,
        unique: true  // nim tetap unik
      },
      namaLengkap: { type: Sequelize.STRING(255), allowNull: false },
      emailKampus: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      walletAddress: { type: Sequelize.STRING(42), allowNull: false, unique: true },
      id_prodi: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Prodi', key: 'id_prodi' }, // Nama tabel Prodi
        onUpdate: 'CASCADE', onDelete: 'RESTRICT'
      },
      namaKelas: { type: Sequelize.STRING(50), allowNull: true },
      tahunMasuk: { type: Sequelize.STRING(10), allowNull: true },
      statusAktif: { type: Sequelize.BOOLEAN, defaultValue: true },
      otp: { type: Sequelize.STRING(6), allowNull: true },
      otpExpiresAt: { type: Sequelize.DATE, allowNull: true },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });
    await queryInterface.addIndex('Mahasiswa', ['nim']);
    await queryInterface.addIndex('Mahasiswa', ['emailKampus']);
    await queryInterface.addIndex('Mahasiswa', ['walletAddress']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Mahasiswa');
  }
};