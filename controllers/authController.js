// controllers/authController.js
const authService = require('../services/authService');
const { validationResult } = require('express-validator'); // Jika Anda pakai express-validator

// --- Registrasi Mahasiswa ---
exports.mhsRegRequestOtp = async (req, res, next) => {
  try {
    // Tambahkan validasi input dari express-validator di sini jika perlu
    const { nim, id_prodi, emailKampus } = req.body;
    if (!nim || !id_prodi || !emailKampus) {
      const error = new Error('NIM, ID Prodi, dan Email Kampus diperlukan.');
      error.statusCode = 400;
      throw error;
    }
    const resultService = await authService.requestMahasiswaRegistrationOtp({ nim, id_prodi, emailKampus });
    
    req.session.registrationAttempt = resultService.tempRegData; // Simpan data ke session

    res.status(200).json({ message: resultService.message });
  } catch (error) {
    next(error);
  }
};

exports.mhsRegFinalize = async (req, res, next) => {
  try {
    const { otp, walletAddress } = req.body;
    if (!otp || !walletAddress ) {
      const error = new Error('OTP dan Alamat Wallet diperlukan.');
      error.statusCode = 400;
      throw error;
    }
    if (!req.session.registrationAttempt) {
      const error = new Error('Sesi registrasi tidak ditemukan atau kedaluwarsa. Harap ulangi permintaan OTP.');
      error.statusCode = 400;
      throw error;
    }
    const result = await authService.finalizeMahasiswaRegistration(req.session.registrationAttempt, otp, walletAddress);
    
    delete req.session.registrationAttempt; // Hapus data session setelah berhasil
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

// --- Registrasi Donatur & Admin ---
exports.genericUserRegRequestOtp = async (req, res, next) => {
    try {
        const { email, role } = req.body; // role akan di-set di routes
        if (!email || !['donatur', 'admin'].includes(role)) {
            const error = new Error("Email dan Peran (donatur/admin) valid diperlukan.");
            error.statusCode = 400;
            throw error;
        }
        const resultService = await authService.requestGenericUserRegistrationOtp(email, role);
        
        req.session.genericRegistrationAttempt = resultService.tempRegData;

        res.status(200).json({ message: resultService.message });
    } catch (error) {
        next(error);
    }
};

exports.genericUserRegFinalize = async (req, res, next) => {
    try {
        const { otp, walletAddress, namaLengkap } = req.body;
         if (!otp || !walletAddress || !namaLengkap) {
            const error = new Error("OTP, Alamat Wallet, dan Nama Lengkap diperlukan.");
            error.statusCode = 400;
            throw error;
        }
        if (!req.session.genericRegistrationAttempt) {
            const error = new Error('Sesi registrasi tidak ditemukan atau kedaluwarsa. Harap ulangi permintaan OTP.');
            error.statusCode = 400;
            throw error;
        }
        
        const result = await authService.finalizeGenericUserRegistration(req.session.genericRegistrationAttempt, otp, walletAddress, namaLengkap);
        
        delete req.session.genericRegistrationAttempt;
        
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};


// --- Login (Wallet + OTP) ---
exports.requestOtpForLogin = async (req, res, next) => {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress) {
      const error = new Error('Alamat wallet diperlukan.');
      error.statusCode = 400;
      throw error;
    }
    const result = await authService.requestLoginOtp(walletAddress);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.loginWithOtp = async (req, res, next) => {
  try {
    const { walletAddress, otp } = req.body;
    if (!walletAddress || !otp) {
      const error = new Error('Alamat wallet dan OTP diperlukan.');
      error.statusCode = 400;
      throw error;
    }
    const result = await authService.verifyOtpAndLogin(walletAddress, otp);
    
    res.cookie('token', result.token, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax' 
    });

    res.status(200).json({ message: result.message, user: result.user });
  } catch (error) {
    next(error);
  }
};

// --- Logout ---
exports.logoutUser = async (req, res, next) => {
    try {
        const result = await authService.logoutUser(req);
        res.clearCookie('token'); // Hapus cookie token utama
        // Jika Anda menggunakan cookie lain untuk session, hapus juga di sini
        // Contoh: res.clearCookie('connect.sid'); // Nama default cookie express-session
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

// --- Get Current User Profile (Contoh rute terproteksi) ---
// Anda perlu middleware 'protectRoute' yang memverifikasi JWT dan mengisi req.user
exports.getCurrentUserProfile = async (req, res, next) => {
    try {
        // Asumsi 'protectRoute' middleware akan mengisi req.user
        if (!req.user) { // req.user diisi oleh middleware autentikasi setelah verifikasi token
            const error = new Error('Tidak terautentikasi. Tidak ada data pengguna.');
            error.statusCode = 401;
            throw error;
        }
        // Kembalikan data pengguna dari token (sudah berisi info yang relevan)
        res.status(200).json({ user: req.user });
    } catch (error) {
        next(error);
    }
};