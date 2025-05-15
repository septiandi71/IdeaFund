// ibik-crowdfund-backend/controllers/authController.js
const authService = require('../services/authService');
// const { validationResult } = require('express-validator'); // Jika Anda pakai

// --- Registrasi Mahasiswa ---
exports.mhsRegRequestOtp = async (req, res, next) => {
  try {
    const { nim, id_prodi, id_fakultas } = req.body;
    if (!nim || !id_prodi || !id_fakultas) {
      const error = new Error('NIM, ID Fakultas, dan ID Prodi diperlukan.');
      error.statusCode = 400;
      throw error;
    }
    const resultService = await authService.requestMahasiswaRegistrationOtp({ nim, id_prodi_input: id_prodi, id_fakultas_input: id_fakultas });
    
    req.session.registrationAttempt = { 
        ...resultService.tempRegData, 
        type: 'mahasiswa'
    }; 
    await req.session.save();

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
    if (!req.session.registrationAttempt || req.session.registrationAttempt.type !== 'mahasiswa') {
      const error = new Error('Sesi registrasi mahasiswa tidak ditemukan atau kedaluwarsa. Harap ulangi permintaan OTP.');
      error.statusCode = 400;
      throw error;
    }
    const result = await authService.finalizeMahasiswaRegistration(req.session.registrationAttempt, otp, walletAddress);
    
    req.session.registrationAttempt = null; 
    await req.session.save();
    
    // Set cookie token setelah registrasi sukses (sama seperti login)
    res.cookie('token', result.token, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax' 
    });

    res.status(201).json({ message: result.message, user: result.user });
  } catch (error) {
    next(error);
  }
};

// --- Registrasi Donatur ---
exports.donaturRegRequestOtp = async (req, res, next) => {
    try {
        const { email, namaLengkap } = req.body; 
        if (!email || !namaLengkap) {
            const error = new Error("Email dan Nama Lengkap diperlukan.");
            error.statusCode = 400;
            throw error;
        }
        
        const userIdentifier = `reg_otp_req_donatur_${email}`;
        if (req.session[userIdentifier] && req.session[userIdentifier].lastOtpRequestTime) {
            const lastReqTime = new Date(req.session[userIdentifier].lastOtpRequestTime).getTime();
            const currentTime = new Date().getTime();
            const intervalSeconds = 30; // Anda bisa ambil dari authService.OTP_RESEND_INTERVAL_SECONDS
            if ((currentTime - lastReqTime) < (intervalSeconds * 1000)) {
                const timeLeft = Math.ceil((intervalSeconds * 1000 - (currentTime - lastReqTime)) / 1000);
                const error = new Error(`Harap tunggu ${timeLeft} detik sebelum meminta OTP baru.`);
                error.statusCode = 429;
                throw error;
            }
        }

        const resultService = await authService.requestDonaturRegistrationOtp(namaLengkap, email);
        
        req.session.donaturRegistrationAttempt = {
            ...resultService.tempRegData,
            type: 'donatur'
        };
        req.session[userIdentifier] = { lastOtpRequestTime: new Date().toISOString() };
        await req.session.save();

        res.status(200).json({ message: resultService.message });
    } catch (error) {
        next(error);
    }
};

exports.donaturRegFinalize = async (req, res, next) => {
    try {
        const { otp, walletAddress } = req.body;
         if (!otp || !walletAddress) {
            const error = new Error("OTP dan Alamat Wallet diperlukan.");
            error.statusCode = 400;
            throw error;
        }
        if (!req.session.donaturRegistrationAttempt || req.session.donaturRegistrationAttempt.type !== 'donatur') { 
            const error = new Error('Sesi registrasi Donatur tidak ditemukan atau kedaluwarsa. Harap ulangi permintaan OTP.');
            error.statusCode = 400;
            throw error;
        }
        
        const result = await authService.finalizeDonaturRegistration(req.session.donaturRegistrationAttempt, otp, walletAddress);
        
        req.session.donaturRegistrationAttempt = null;
        await req.session.save();

        // Set cookie token setelah registrasi sukses
        res.cookie('token', result.token, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', 
            maxAge: 24 * 60 * 60 * 1000,
            sameSite: 'lax' 
        });
        
        res.status(201).json({ message: result.message, user: result.user });
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
    const result = await authService.requestLoginOtp(walletAddress, req.session); 
    await req.session.save();
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
        req.session.destroy(err => {
            if (err) {
                console.error("Session destruction error:", err);
                // Tetap lanjutkan clear cookie
            }
            res.clearCookie('token'); 
            return res.status(200).json({ message: 'Logout berhasil.' });
        });
    } catch (error) {
        next(error);
    }
};

// --- Get Current User Profile (Endpoint /me) ---
exports.getCurrentUserProfile = async (req, res, next) => {
    try {
        // req.user diisi oleh middleware protectRoute jika token valid
        if (!req.user) { 
            const error = new Error('Data pengguna tidak ditemukan dari token.');
            error.statusCode = 401; 
            throw error;
        }
        // Kembalikan data pengguna yang ada di req.user (dari payload token)
        res.status(200).json({ user: req.user });
    } catch (error) {
        next(error);
    }
};
