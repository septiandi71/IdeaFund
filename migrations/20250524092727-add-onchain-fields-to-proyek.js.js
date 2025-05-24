'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Proyek', 'onChainProjectId', {
      type: Sequelize.STRING, // Menyimpan UUID proyek itu sendiri
      allowNull: true, // Akan diisi setelah dipublish ke SC
      unique: true,
    });
    await queryInterface.addColumn('Proyek', 'isPublishedOnChain', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn('Proyek', 'onChainDeadline', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('Proyek', 'txHashPublication', {
      type: Sequelize.STRING(66), // Panjang standar untuk hash transaksi Ethereum
      allowNull: true,
      unique: true, // Setiap hash publikasi harus unik
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Proyek', 'onChainProjectId');
    await queryInterface.removeColumn('Proyek', 'isPublishedOnChain');
    await queryInterface.removeColumn('Proyek', 'onChainDeadline');
    await queryInterface.removeColumn('Proyek', 'txHashPublication');
  }
};
