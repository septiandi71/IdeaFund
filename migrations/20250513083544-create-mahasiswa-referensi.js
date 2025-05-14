'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('MahasiswaReferensi', { // Singular
      nim: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING(15)
      },
      namaLengkap: { type: Sequelize.STRING(255), allowNull: false },
      emailKampus: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      id_prodi: {
        type: Sequelize.INTEGER,
        allowNull: false, // atau true jika data BAAK mungkin tidak lengkap
        references: { model: 'Prodi', key: 'id_prodi' }, // Merujuk ke tabel Prodi
        onUpdate: 'CASCADE', onDelete: 'RESTRICT'
      },
      namaKelas: { type: Sequelize.STRING(50), allowNull: true },
      idTahunAjar: { type: Sequelize.STRING(10), allowNull: true },
      tahunMasuk: { type: Sequelize.STRING(10), allowNull: true },
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
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('MahasiswaReferensi');
  }
};