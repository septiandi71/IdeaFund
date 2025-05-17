// ibik-crowdfund-backend/routes/dataReferensiRoutes.js
const express = require('express');
const router = express.Router();
const dataReferensiController = require('../controllers/dataReferensiController');
const { protectRoute } = require('../middlewares/authMiddleware');

// Rute untuk mengambil semua fakultas
// GET /api/data/fakultas
router.get('/fakultas', dataReferensiController.getAllFakultas);

// Rute untuk mengambil prodi berdasarkan fakultasId (dari query parameter)
// GET /api/data/prodi?fakultasId=X
router.get('/prodi', dataReferensiController.getProdiByFakultas);

// Rute untuk info mahasiswa berdasarkan NIM
// GET /api/data/mahasiswa-info?nim=XXXX
router.get('/mahasiswa-info', protectRoute, dataReferensiController.getMahasiswaInfoByNim);

// --- RUTE BARU UNTUK MENGAMBIL SEMUA KATEGORI PROYEK ---
// GET /api/data/kategori
router.get('/kategori', dataReferensiController.getAllKategori);


// (Opsional) Rute untuk mengambil semua prodi (jika masih diperlukan)
// router.get('/prodi/all', dataReferensiController.getAllProdi);


module.exports = router;
