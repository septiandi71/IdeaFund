// ibik-crowdfund-backend/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Untuk mengakses JWT_SECRET

const protectRoute = async (req, res, next) => {
  // 1. Dapatkan token dari httpOnly cookie yang dikirim oleh browser
  // Nama cookie 'token' harus sesuai dengan nama yang Anda set saat login
  const token = req.cookies.token;

  if (!token) {
    // Jika tidak ada token, kirim error 401 (Unauthorized)
    // Ini akan ditangkap oleh fetchCurrentUser di frontend sebagai sesi tidak valid
    const error = new Error('Tidak terautentikasi, tidak ada token akses.');
    error.statusCode = 401;
    return next(error); // Teruskan ke global error handler
  }

  try {
    // 2. Verifikasi token menggunakan JWT_SECRET Anda
    const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Token valid. Tambahkan payload pengguna ke objek request agar bisa diakses controller.
    // Payload ini adalah apa yang Anda masukkan saat membuat token di service login
    // Contoh: { id, nim?, walletAddress, role, email, namaLengkap }
    req.user = decodedPayload; 

    next(); // Lanjutkan ke fungsi controller berikutnya (misalnya, getCurrentUserProfile)
  } catch (error) {
    console.error("Middleware Auth Error - Token tidak valid atau kedaluwarsa:", error.message);
    const authError = new Error('Sesi tidak valid atau token kedaluwarsa. Silakan login kembali.');
    authError.statusCode = 401;
    
    // Hapus cookie token yang tidak valid di sisi client
    res.clearCookie('token'); 
    
    // Hancurkan session server-side jika ada dan jika token tidak valid
    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                console.error("Gagal menghancurkan session setelah token tidak valid:", err);
            }
        });
    }
    return next(authError);
  }
};

module.exports = { protectRoute };
