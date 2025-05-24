// ibik-crowdfund-backend/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Untuk mengakses JWT_SECRET

const protectRoute = async (req, res, next) => {
  const token = req.cookies.token; // Ambil token dari cookie

  if (!token) {
    return res.status(401).json({ success: false, message: 'Tidak terautentikasi, tidak ada token akses.' });
  }

  try {
    const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decodedPayload; // Tambahkan data pengguna ke objek req
    next();
  } catch (error) {
    console.error('Middleware Auth Error:', error.message);
    res.clearCookie('token'); // Hapus cookie jika token tidak valid
    return res.status(401).json({ success: false, message: 'Sesi tidak valid atau token kedaluwarsa. Silakan login kembali.' });
  }
};

module.exports = { protectRoute };
