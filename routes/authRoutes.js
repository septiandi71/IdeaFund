// ibik-crowdfund-backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protectRoute } = require('../middlewares/authMiddleware'); // Impor middleware

// === RUTE REGISTRASI ===
router.post('/register/mahasiswa/request-otp', authController.mhsRegRequestOtp);
router.post('/register/mahasiswa/finalize', authController.mhsRegFinalize);

router.post('/register/donatur/request-otp', authController.donaturRegRequestOtp);
router.post('/register/donatur/finalize', authController.donaturRegFinalize);

// TIDAK ADA RUTE REGISTRASI ADMIN

// === RUTE LOGIN ===
router.post('/login/request-otp', authController.requestOtpForLogin);
router.post('/login/verify-otp', authController.loginWithOtp);

// === RUTE SESI & PROFIL ===
router.post('/logout', authController.logoutUser);
router.get('/me', protectRoute, authController.getCurrentUserProfile); // Rute terproteksi

module.exports = router;