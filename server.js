// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const db = require('./models'); // Memuat models/index.js

const authRoutes = require('./routes/authRoutes');
// const projectRoutes = require('./routes/projectRoutes'); 
// const adminRoutes = require('./routes/adminRoutes');

const app = express();

const sessionStore = new SequelizeStore({
  db: db.sequelize,
  tableName: 'Sessions',
});

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 1 hari
  }
}));
sessionStore.sync(); // Membuat tabel Sessions jika belum ada (atau lakukan via migrasi terpisah)

app.get('/', (req, res) => {
  res.send('API Backend IBIK Crowdfunding Simulator Aktif!');
});
app.use('/api/auth', authRoutes);
// app.use('/api/projects', projectRoutes);
// app.use('/api/admin', adminRoutes);

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

const PORT = process.env.BACKEND_PORT || 3001;

db.sequelize.authenticate()
  .then(() => {
    console.log('Koneksi ke database berhasil.');
    // db.sequelize.sync(); // Hati-hati jika ada data, lebih baik pakai migrasi
    app.listen(PORT, () => {
      console.log(`Server backend berjalan di port ${PORT}.`);
    });
  })
  .catch(err => {
    console.error('Tidak dapat terhubung ke database:', err);
  });