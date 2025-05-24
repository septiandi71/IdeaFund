'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Proyek', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      judul: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      deskripsi: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      targetDana: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0
      },
      danaTerkumpul: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0
      },
      batasWaktu: {
        type: Sequelize.DATE,
        allowNull: true
      },
      durasiHari: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('PENDING_REVIEW', 'AKTIF', 'SUKSES', 'GAGAL', 'DITOLAK'),
        allowNull: false,
        defaultValue: 'PENDING_REVIEW'
      },
      pemilikId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Mahasiswa',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      kategoriId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Kategori',
          key: 'id_kategori'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      projectImageUrl: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      isStage1Verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isStage2Verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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
    await queryInterface.dropTable('Proyek');
  }
};