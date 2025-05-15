// routes/dataReferensiRoutes.js
const express = require('express');
const router = express.Router();
const dataReferensiController = require('../controllers/dataReferensiController');

// Rute untuk mengambil semua fakultas
// GET /api/data/fakultas
router.get('/fakultas', dataReferensiController.getAllFakultas);

// Rute untuk mengambil prodi berdasarkan fakultasId
// GET /api/data/prodi?fakultasId=X
router.get('/prodi', dataReferensiController.getProdiByFakultas);

module.exports = router;