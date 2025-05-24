'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('AnggotaTim', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      timId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Tim',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      mahasiswaId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Mahasiswa',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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

    // Tambahkan unique constraint untuk mencegah mahasiswa menjadi anggota tim yang sama lebih dari sekali
    await queryInterface.addConstraint('AnggotaTim', {
      fields: ['timId', 'mahasiswaId'],
      type: 'unique',
      name: 'unique_tim_mahasiswa'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('AnggotaTim');
  }
};