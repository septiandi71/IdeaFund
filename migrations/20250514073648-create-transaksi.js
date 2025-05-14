'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Transaksi', { // Singular
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      proyekId: { // FK ke Proyek.id
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Proyek', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      donaturId: { // FK ke Donatur.id, bisa NULL jika donasi anonim (tapi kita punya registrasi donatur)
        type: Sequelize.UUID,
        allowNull: true, // Set false jika setiap donasi HARUS dari donatur terdaftar
        references: { model: 'Donatur', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL'
      },
      donaturWallet: { // Bisa untuk mencatat wallet aktual yang berinteraksi jika berbeda atau sebagai tambahan
        type: Sequelize.STRING(42),
        allowNull: false
      },
      jumlah: { type: Sequelize.BIGINT, allowNull: false },
      timestamp: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      txHash: { type: Sequelize.STRING(66), allowNull: false, unique: true },
      tipe: { type: Sequelize.STRING(20), allowNull: false }, // 'DONASI', 'PENCAIRAN_TAHAP1', 'PENCAIRAN_TAHAP2'
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
    await queryInterface.addIndex('Transaksi', ['txHash']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Transaksi');
  }
};