const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { protectRoute } = require('../middlewares/authMiddleware');

// Rute untuk mengambil data profil
router.get('/', protectRoute, profileController.getProfileData);

module.exports = router;