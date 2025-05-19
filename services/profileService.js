const { Proyek, Mahasiswa, Donatur, Admin, Transaksi } = require('../models');

async function getProfileData(user) {
  if (!user || !user.id || !user.role) {
    throw new Error('Informasi pengguna tidak lengkap.');
  }

  try {
    if (user.role === 'mahasiswa') {
      const totalSubmittedProjects = await Proyek.count({ where: { pemilikId: user.id } });
      const totalActiveProjects = await Proyek.count({ where: { pemilikId: user.id, status: 'AKTIF' } });
      const totalFundsRaised = await Proyek.sum('danaTerkumpul', { where: { pemilikId: user.id } });
      const latestProjects = await Proyek.findAll({
        where: { pemilikId: user.id },
        order: [['createdAt', 'DESC']],
        limit: 3,
        attributes: ['id', 'judul', 'status'],
      });
      const recentTransactions = await Transaksi.findAll({
        where: { targetUserId: user.id },
        order: [['createdAt', 'DESC']],
        limit: 5,
        attributes: ['id', 'tipe', 'txHash', 'jumlah', 'createdAt'],
      });

      return {
        role: 'mahasiswa',
        totalSubmittedProjects,
        totalActiveProjects,
        totalFundsRaised: totalFundsRaised || 0,
        latestProjects,
        recentTransactions,
      };
    } else if (user.role === 'donatur') {
      const totalDonations = await Transaksi.sum('jumlah', { where: { targetUserId: user.id, tipe: 'DONASI' } });
      const supportedProjects = await Proyek.count({
        include: [{ model: Transaksi, as: 'transaksiList', where: { targetUserId: user.id, tipe: 'DONASI' } }],
      });
      const nftReceived = 3; // Placeholder, tambahkan logika jika ada NFT
      const recentDonations = await Transaksi.findAll({
        where: { targetUserId: user.id, tipe: 'DONASI' },
        order: [['createdAt', 'DESC']],
        limit: 5,
        attributes: ['id', 'jumlah', 'createdAt'],
        include: [{ model: Proyek, as: 'proyek', attributes: ['judul'] }],
      });

      return {
        role: 'donatur',
        totalDonations: totalDonations || 0,
        supportedProjects,
        nftReceived,
        recentDonations,
      };
    } else if (user.role === 'admin') {
      const totalActiveUsers = await Mahasiswa.count({ where: { statusAktif: true } });
      const totalProjects = await Proyek.count();
      const projectsPendingReview = await Proyek.count({ where: { status: 'PENDING_REVIEW' } });
      const pendingWithdrawals = await Transaksi.count({ where: { tipe: 'PENCAIRAN_DANA' } });

      return {
        role: 'admin',
        totalActiveUsers,
        totalProjects,
        projectsPendingReview,
        pendingWithdrawals,
      };
    } else {
      throw new Error('Peran pengguna tidak valid.');
    }
  } catch (error) {
    console.error('Error di service getProfileData:', error);
    throw new Error('Gagal mengambil data profil.');
  }
}

module.exports = { getProfileData };