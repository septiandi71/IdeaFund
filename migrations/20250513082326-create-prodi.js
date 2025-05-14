'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Prodi', { // Singular
      id_prodi: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nama_prodi: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      id_fakultas: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Fakultas', // Nama tabel Fakultas
          key: 'id_fakultas'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT' // atau CASCADE jika logis
      },
      jenjang: {
        type: Sequelize.STRING(10),
        allowNull: true
      },
      deskripsi_prodi: {
        type: Sequelize.TEXT,
        allowNull: true
      },
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
    await queryInterface.dropTable('Prodi');
  }
};