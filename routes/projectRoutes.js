// ibik-crowdfund-backend/routes/projectRoutes.js
const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { protectRoute } = require('../middlewares/authMiddleware');
const { uploadProjectImageMiddleware } = require('../config/multerConfig');

// Rute untuk membuat proyek baru
router.post('/create', protectRoute, uploadProjectImageMiddleware, projectController.createProject);

// Rute untuk mengambil feed proyek dashboard
router.get('/dashboard-feed', protectRoute, projectController.getDashboardFeed);

// --- RUTE BARU UNTUK HALAMAN EKSPLORASI PROYEK ---
// GET /api/projects/my?page=1&limit=5&status=AKTIF
router.get('/my', protectRoute, projectController.getUserProjects);

// GET /api/projects/explore?page=1&limit=10&kategoriId=X&sort=terbaru
router.get('/explore', protectRoute, projectController.getAllActiveProjects); 

// Tambahkan rute lain untuk proyek di sini nanti:
// GET /api/projects/my (untuk proyek milik mahasiswa)
// GET /api/projects/:id (untuk detail proyek)

module.exports = router;
