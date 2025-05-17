'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Proyek', { // Singular
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      judul: { type: Sequelize.STRING(255), allowNull: false },
      deskripsi: { type: Sequelize.TEXT, allowNull: true },
      targetDana: { type: Sequelize.BIGINT, allowNull: false, defaultValue: 0 },
      danaTerkumpul: { type: Sequelize.BIGINT, allowNull: false, defaultValue: 0 },
      batasWaktu: { type: Sequelize.DATE, allowNull: false }, // Atau TIMESTAMP
      status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'PENDING_REVIEW' }, // PENDING_REVIEW, AKTIF, SUKSES, GAGAL, DLL.
      pemilikId: { // FK ke Mahasiswa.id (UUID)
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Mahasiswa', key: 'id' }, // Nama tabel Mahasiswa
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      kategoriId: { // FK ke Kategori.id_kategori
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Kategori', key: 'id_kategori' }, // Nama tabel Kategori
        onUpdate: 'CASCADE', onDelete: 'RESTRICT'
      },
      projectImageUrl: { type: Sequelize.STRING(255), allowNull: true },
      // Tambahkan atribut lain untuk NFT jika perlu (deskripsi, min donasi)
      isStage1Verified: { type: Sequelize.BOOLEAN, defaultValue: false },
      isStage2Verified: { type: Sequelize.BOOLEAN, defaultValue: false },
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
    await queryInterface.dropTable('Proyek');
  }
};