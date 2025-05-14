// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
// const { protectRoute } = require('../middlewares/authMiddleware'); // Akan dibuat nanti

// === RUTE REGISTRASI ===
router.post('/register/mahasiswa/request-otp', authController.mhsRegRequestOtp);
router.post('/register/mahasiswa/finalize', authController.mhsRegFinalize);

router.post('/register/donatur/request-otp', (req, res, next) => {
    req.body.role = 'donatur';
    authController.genericUserRegRequestOtp(req, res, next);
});
router.post('/register/donatur/finalize', authController.genericUserRegFinalize);

router.post('/register/admin/request-otp', (req, res, next) => {
    req.body.role = 'admin';
    authController.genericUserRegRequestOtp(req, res, next);
});
router.post('/register/admin/finalize', authController.genericUserRegFinalize);


// === RUTE LOGIN ===
router.post('/login/request-otp', authController.requestOtpForLogin);
router.post('/login/verify-otp', authController.loginWithOtp);

// === RUTE SESI & PROFIL ===
router.post('/logout', authController.logoutUser);
// router.get('/me', protectRoute, authController.getCurrentUserProfile); // Aktifkan setelah middleware siap

module.exports = router;