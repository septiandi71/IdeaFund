// ibik-crowdfund-backend/config/multerConfig.js
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

// Tentukan folder tujuan upload
const uploadDir = 'public/uploads/projects/';

// Pastikan direktori upload ada, jika tidak buatkan
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Konfigurasi penyimpanan untuk gambar proyek
const projectImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Folder penyimpanan
  },
  filename: function (req, file, cb) {
    // Buat nama file unik untuk menghindari konflik
    // Format: fieldname-timestamp-randombytes.extension
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(4).toString('hex');
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filter untuk jenis file yang diizinkan (hanya gambar)
const imageFileFilter = (req, file, cb) => {
  // Cek tipe MIME
  if (file.mimetype.startsWith('image/')) {
    cb(null, true); // Terima file
  } else {
    // Tolak file, kirim error yang bisa ditangkap multer
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Hanya file gambar (JPEG, PNG, GIF) yang diizinkan!'), false);
  }
};

// Inisialisasi multer upload untuk satu file gambar proyek
// 'projectImageFile' adalah nama field di FormData yang dikirim dari frontend
const uploadProjectImageMiddleware = multer({ 
  storage: projectImageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // Batas ukuran file 2MB
  }
}).single('projectImageFile'); // Mengharapkan satu file dengan nama field 'projectImageFile'

module.exports = {
  uploadProjectImageMiddleware
};
