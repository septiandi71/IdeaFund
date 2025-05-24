'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const timTable = await queryInterface.describeTable('Tim');
    const anggotaTimTable = await queryInterface.describeTable('AnggotaTim');

    // Tambahkan kolom proyekId di tabel Tim jika belum ada
    if (!timTable.proyekId) {
      await queryInterface.addColumn('Tim', 'proyekId', {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Proyek', // Nama tabel yang dirujuk
          key: 'id',       // Kolom di tabel Proyek yang dirujuk
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
    }

    // Tambahkan kolom timId di tabel AnggotaTim jika belum ada
    if (!anggotaTimTable.timId) {
      await queryInterface.addColumn('AnggotaTim', 'timId', {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Tim', // Nama tabel yang dirujuk
          key: 'id',    // Kolom di tabel Tim yang dirujuk
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
    }

    // Tambahkan kolom mahasiswaId di tabel AnggotaTim jika belum ada
    if (!anggotaTimTable.mahasiswaId) {
      await queryInterface.addColumn('AnggotaTim', 'mahasiswaId', {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Mahasiswa', // Nama tabel yang dirujuk
          key: 'id',          // Kolom di tabel Mahasiswa yang dirujuk
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const timTable = await queryInterface.describeTable('Tim');
    const anggotaTimTable = await queryInterface.describeTable('AnggotaTim');

    // Hapus kolom proyekId dari tabel Tim jika ada
    if (timTable.proyekId) {
      await queryInterface.removeColumn('Tim', 'proyekId');
    }

    // Hapus kolom timId dari tabel AnggotaTim jika ada
    if (anggotaTimTable.timId) {
      await queryInterface.removeColumn('AnggotaTim', 'timId');
    }

    // Hapus kolom mahasiswaId dari tabel AnggotaTim jika ada
    if (anggotaTimTable.mahasiswaId) {
      await queryInterface.removeColumn('AnggotaTim', 'mahasiswaId');
    }
  }
};
