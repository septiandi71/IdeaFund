// controllers/authController.js
const authService = require('../services/authService');

// --- Registrasi Mahasiswa --- (Tetap sama)
exports.mhsRegRequestOtp = async (req, res, next) => {
  try {
    const { nim, id_prodi } = req.body;
    if (!nim || !id_prodi) {
      const error = new Error('NIM dan ID Prodi diperlukan.');
      error.statusCode = 400;
      throw error;
    }
    const resultService = await authService.requestMahasiswaRegistrationOtp({ nim, id_prodi_input: id_prodi });
    
    req.session.registrationAttempt = resultService.tempRegData; 
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
    
    delete req.session.registrationAttempt; 
    res.status(201).json(result);
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
        if (req.session && req.session[userIdentifier] && req.session[userIdentifier].lastOtpRequestTime) {
            const lastReqTime = new Date(req.session[userIdentifier].lastOtpRequestTime).getTime();
            const currentTime = new Date().getTime();
            const intervalSeconds = authService.OTP_RESEND_INTERVAL_SECONDS || 30;
            if ((currentTime - lastReqTime) < (intervalSeconds * 1000)) {
                const timeLeft = Math.ceil((intervalSeconds * 1000 - (currentTime - lastReqTime)) / 1000);
                const error = new Error(`Harap tunggu ${timeLeft} detik sebelum meminta OTP baru.`);
                error.statusCode = 429;
                throw error;
            }
        }

        const resultService = await authService.requestGenericUserRegistrationOtp(namaLengkap, email, 'donatur'); // Kirim 'donatur' sebagai role
        
        req.session = req.session || {};
        req.session.donaturRegistrationAttempt = resultService.tempRegData; 
        req.session[userIdentifier] = { lastOtpRequestTime: new Date().toISOString() };

        res.status(200).json({ message: resultService.message });
    } catch (error) {
        next(error);
    }
};

exports.donaturRegFinalize = async (req, res, next) => {
    try {
        const { otp, walletAddress } = req.body; // namaLengkap akan diambil dari session
         if (!otp || !walletAddress) { // Tidak perlu namaLengkap dari body
            const error = new Error("OTP dan Alamat Wallet diperlukan.");
            error.statusCode = 400;
            throw error;
        }
        if (!req.session.donaturRegistrationAttempt) { 
            const error = new Error('Sesi registrasi Donatur tidak ditemukan atau kedaluwarsa. Harap ulangi permintaan OTP.');
            error.statusCode = 400;
            throw error;
        }
        // Panggil finalizeGenericUserRegistration, namaLengkap ada di sessionData
        const result = await authService.finalizeGenericUserRegistration(req.session.donaturRegistrationAttempt, otp, walletAddress, req.session.donaturRegistrationAttempt.namaLengkap);
        
        delete req.session.donaturRegistrationAttempt;
        
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

// --- Login & Lainnya (Tetap Sama) ---
exports.requestOtpForLogin = async (req, res, next) => {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress) {
      const error = new Error('Alamat wallet diperlukan.');
      error.statusCode = 400;
      throw error;
    }
    const result = await authService.requestLoginOtp(walletAddress, req.session); 
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

exports.logoutUser = async (req, res, next) => {
    try {
        const result = await authService.logoutUser(req); 
        res.clearCookie('token'); 
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.getCurrentUserProfile = async (req, res, next) => {
    try {
        if (!req.user) { 
            const error = new Error('Tidak terautentikasi. Tidak ada data pengguna.');
            error.statusCode = 401;
            throw error;
        }
        res.status(200).json({ user: req.user });
    } catch (error) {
        next(error);
    }
};