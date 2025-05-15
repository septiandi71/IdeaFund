// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
// const { protectRoute } = require('../middlewares/authMiddleware');

// === RUTE REGISTRASI ===
router.post('/register/mahasiswa/request-otp', authController.mhsRegRequestOtp);
router.post('/register/mahasiswa/finalize', authController.mhsRegFinalize);

// Rute Registrasi Donatur disesuaikan dengan controller baru
router.post('/register/donatur/request-otp', authController.donaturRegRequestOtp); // Menggunakan controller yang sudah menerima namaLengkap
router.post('/register/donatur/finalize', authController.donaturRegFinalize); 

// TIDAK ADA RUTE REGISTRASI ADMIN
// router.post('/register/admin/request-otp', ...); (Dihapus)
// router.post('/register/admin/finalize', ...); (Dihapus)


// === RUTE LOGIN ===
router.post('/login/request-otp', authController.requestOtpForLogin);
router.post('/login/verify-otp', authController.loginWithOtp);

// === RUTE SESI & PROFIL ===
router.post('/logout', authController.logoutUser);
// router.get('/me', protectRoute, authController.getCurrentUserProfile);

module.exports = router;