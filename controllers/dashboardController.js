const { Proyek, Transaksi, Mahasiswa } = require('../models');

exports.getAdminDashboardData = async (req, res, next) => {
  try {
    const totalPengguna = await Mahasiswa.count();
    const totalProyek = await Proyek.count();
    const proyekReview = await Proyek.count({ where: { status: 'PENDING_REVIEW' } });
    const pencairanVerif = await Transaksi.count({ where: { tipe: 'PENCAIRAN_DANA' } });

    res.status(200).json({
      totalPengguna,
      totalProyek,
      proyekReview,
      pencairanVerif,
    });
  } catch (error) {
    console.error('Error di getAdminDashboardData:', error);
    res.status(500).json({ message: 'Gagal mengambil data dashboard admin.' });
  }
};

exports.getDonaturDashboardData = async (req, res, next) => {
  try {
    const totalDonasi = await Transaksi.sum('jumlah', { where: { targetUserId: req.user.id, tipe: 'DONASI' } });
    const proyekDidukung = await Proyek.count({
      include: [{ model: Transaksi, as: 'transaksiList', where: { targetUserId: req.user.id, tipe: 'DONASI' } }],
    });
    const nftDiterima = 3; // Placeholder, tambahkan logika jika ada NFT

    res.status(200).json({
      totalDonasi: totalDonasi || 0,
      proyekDidukung,
      nftDiterima,
    });
  } catch (error) {
    console.error('Error di getDonaturDashboardData:', error);
    res.status(500).json({ message: 'Gagal mengambil data dashboard donatur.' });
  }
};