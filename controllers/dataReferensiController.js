// controllers/dataReferensiController.js
const { Fakultas, Prodi } = require('../models'); // Sesuaikan path jika model Anda ada di tempat berbeda

// Mengambil semua Fakultas
exports.getAllFakultas = async (req, res, next) => {
  try {
    const fakultasList = await Fakultas.findAll({
      attributes: ['id_fakultas', 'nama_fakultas'], // Hanya ambil field yang dibutuhkan
      order: [['nama_fakultas', 'ASC']],
    });
    res.status(200).json(fakultasList);
  } catch (error) {
    next(error);
  }
};

// Mengambil Prodi berdasarkan id_fakultas
exports.getProdiByFakultas = async (req, res, next) => {
  try {
    const { fakultasId } = req.query; // Ambil fakultasId dari query parameter
    if (!fakultasId) {
      return res.status(400).json({ message: 'Parameter fakultasId diperlukan.' });
    }

    const prodiList = await Prodi.findAll({
      where: { id_fakultas: parseInt(fakultasId) }, // Pastikan tipe datanya cocok
      attributes: ['id_prodi', 'nama_prodi'], // Hanya ambil field yang dibutuhkan
      order: [['nama_prodi', 'ASC']],
    });

    if (!prodiList || prodiList.length === 0) {
      // Tetap kembalikan array kosong jika tidak ada prodi, jangan error 404
      // agar frontend bisa handle dengan baik.
      return res.status(200).json([]); 
    }
    res.status(200).json(prodiList);
  } catch (error) {
    next(error);
  }
};