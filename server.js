// ibik-crowdfund-backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const cookieParser = require('cookie-parser'); // Diperlukan untuk req.cookies
const db = require('./models'); // Memuat models/index.js

// Impor Rute
const authRoutes = require('./routes/authRoutes');
const dataReferensiRoutes = require('./routes/dataReferensiRoutes'); // Jika sudah Anda buat
// const projectRoutes = require('./routes/projectRoutes'); 
// const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Konfigurasi Session Store dengan Sequelize
const sessionStore = new SequelizeStore({
  db: db.sequelize,
  tableName: 'Sessions', 
  checkExpirationInterval: 15 * 60 * 1000, // Membersihkan sesi kedaluwarsa setiap 15 menit
  expiration: 24 * 60 * 60 * 1000  // Sesi berlaku 24 jam
});

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Sesuaikan dengan port Vite Anda
    credentials: true 
}));
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Middleware untuk parsing cookie

// Konfigurasi Session Middleware
app.use(session({
  secret: process.env.SESSION_SECRET,
  store: sessionStore,
  resave: false, 
  saveUninitialized: false, 
  cookie: {
    secure: process.env.NODE_ENV === 'production', 
    httpOnly: true, 
    maxAge: 24 * 60 * 60 * 1000 
  }
}));
// Sinkronisasi tabel session (sebaiknya dilakukan sekali atau via migrasi)
sessionStore.sync(); 

// Routes
app.get('/', (req, res) => {
  res.send('API Backend IBIK Crowdfunding Simulator Aktif!');
});

app.use('/api/auth', authRoutes);
app.use('/api/data', dataReferensiRoutes); // Jika sudah Anda buat
// app.use('/api/projects', projectRoutes); 
// app.use('/api/admin', adminRoutes); 

// Global Error Handler Sederhana
app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR HANDLER:");
  console.error("Message:", err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error("Stack:", err.stack);
  }
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Terjadi kesalahan internal pada server.';
  res.status(statusCode).json({ success: false, message });
});

const PORT = process.env.PORT || 3001; // Menggunakan PORT dari .env

db.sequelize.authenticate()
  .then(() => {
    console.log('Koneksi ke database berhasil.');
    app.listen(PORT, () => {
      console.log(`Server backend berjalan di port ${PORT}.`);
    });
  })
  .catch(err => {
    console.error('Tidak dapat terhubung ke database atau menjalankan server:', err);
  });
