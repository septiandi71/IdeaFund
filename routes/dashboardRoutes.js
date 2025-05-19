const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protectRoute } = require('../middlewares/authMiddleware');
const restrictToRole = require('../middlewares/restrictToRole');

// Endpoint untuk admin (hanya admin yang diizinkan)
router.get('/admin', protectRoute, restrictToRole(['admin']), dashboardController.getAdminDashboardData);

// Endpoint untuk donatur (hanya donatur yang diizinkan)
router.get('/donatur', protectRoute, restrictToRole(['donatur']), dashboardController.getDonaturDashboardData);

module.exports = router;