'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Tim', { // Plural default
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      proyekId: { // FK ke Proyek.id
        type: Sequelize.UUID,
        allowNull: false,
        unique: true, // Satu proyek hanya punya satu tim (jika ada)
        references: { model: 'Proyek', key: 'id' }, // Tabel Proyek
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      ketuaId: { // FK ke Mahasiswa.id (UUID)
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Mahasiswa', key: 'id' }, // Tabel Mahasiswa
        onUpdate: 'CASCADE', onDelete: 'RESTRICT'
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
    await queryInterface.dropTable('Tim');
  }
};