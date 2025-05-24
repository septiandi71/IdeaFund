// ibik-crowdfund-backend/routes/projectRoutes.js
const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { protectRoute } = require('../middlewares/authMiddleware');
const restrictToRole = require('../middlewares/restrictToRole');
const { uploadProjectImageMiddleware } = require('../config/multerConfig');

// Rute untuk membuat proyek baru (hanya mahasiswa yang diizinkan)
router.post(
  '/create',
  protectRoute,
  restrictToRole(['mahasiswa']),
  uploadProjectImageMiddleware,
  projectController.createProject
);

// Rute untuk mengambil feed proyek dashboard (semua pengguna yang login diizinkan)
router.get('/dashboard-feed', protectRoute, projectController.getDashboardFeed);

// Rute untuk proyek milik pengguna (hanya mahasiswa yang diizinkan)
router.get('/my', protectRoute, restrictToRole(['mahasiswa']), projectController.getUserProjects);

// Rute untuk eksplorasi proyek (semua pengguna yang login diizinkan)
router.get('/explore', protectRoute, projectController.getAllActiveProjects);

// Rute untuk detail proyek (semua pengguna diizinkan)
router.get('/:id', projectController.getProjectById);

// Endpoint untuk mendapatkan semua proyek berdasarkan status (hanya admin)
router.get('/admin/all', protectRoute, projectController.getAllProjectsByStatus);

// Endpoint untuk memperbarui status proyek (semua pengguna yang login diizinkan)
router.put('/update-status', protectRoute, projectController.updateProjectStatus);

// Endpoint untuk konfirmasi proyek telah dipublish ke blockchain
router.post(
  '/:projectId/confirm-onchain',
  protectRoute,
  restrictToRole(['mahasiswa']), // Hanya pemilik proyek (mahasiswa) yang bisa konfirmasi
  projectController.confirmProjectPublicationController
);

// Endpoint untuk mencatat klaim dana
router.post('/:projectId/record-claim', protectRoute, restrictToRole(['mahasiswa']), projectController.recordClaimController);


module.exports = router;
