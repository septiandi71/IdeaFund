// ibik-crowdfund-backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const cookieParser = require('cookie-parser');
const path = require('path'); // Impor modul path
const db = require('./models'); 

const authRoutes = require('./routes/authRoutes');
const dataReferensiRoutes = require('./routes/dataReferensiRoutes');
const projectRoutes = require('./routes/projectRoutes'); 

const app = express();

const sessionStore = new SequelizeStore({
  db: db.sequelize,
  tableName: 'Sessions',
  checkExpirationInterval: 15 * 60 * 1000, 
  expiration: 24 * 60 * 60 * 1000  
});

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173', 
    credentials: true 
}));
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); 

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
sessionStore.sync(); 

// --- BARIS BARU: Sajikan folder 'public' sebagai folder statis ---
// Ini akan membuat file di dalam folder 'public' bisa diakses dari URL
// Contoh: http://localhost:3001/uploads/projects/namafile.jpg
app.use(express.static(path.join(__dirname, 'public')));


// Routes
app.get('/', (req, res) => {
  res.send('API Backend IBIK Crowdfunding Simulator Aktif!');
});

app.use('/api/auth', authRoutes);
app.use('/api/data', dataReferensiRoutes);
app.use('/api/projects', projectRoutes); 

// Global Error Handler
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

const PORT = process.env.PORT || 3001;

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
