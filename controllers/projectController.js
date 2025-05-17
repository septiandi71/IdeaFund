// ibik-crowdfund-backend/controllers/projectController.js
const projectService = require('../services/projectService');
// const { validationResult } = require('express-validator'); // Untuk validasi input nanti

exports.createProject = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
        const error = new Error('Tidak terautentikasi atau data pengguna tidak lengkap.');
        error.statusCode = 401;
        throw error;
    }
    
    const projectDataFromForm = req.body;
    const userData = req.user; 

    // Informasi file yang diunggah akan ada di req.file
    if (!req.file) {
      // Jika gambar utama proyek wajib
      const error = new Error('Gambar utama proyek wajib diunggah.');
      error.statusCode = 400;
      throw error;
    }

    // Konversi string boolean dari FormData ke boolean
    const parseBoolean = (value) => {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') return value.toLowerCase() === 'true';
        return false;
    };
    
    // Gabungkan data form dengan path file gambar
    const projectData = {
      ...projectDataFromForm,
      targetDana: parseFloat(projectDataFromForm.targetDana),
      kategoriId: parseInt(projectDataFromForm.kategoriId),
      isNftReward: parseBoolean(projectDataFromForm.isNftReward),
      isProyekTim: parseBoolean(projectDataFromForm.isProyekTim),
      // anggotaTambahanNims mungkin perlu diparsing jika dikirim sebagai string JSON dari FormData
      anggotaTambahanNims: projectDataFromForm.anggotaTambahanNims ? 
                           (typeof projectDataFromForm.anggotaTambahanNims === 'string' ? JSON.parse(projectDataFromForm.anggotaTambahanNims) : projectDataFromForm.anggotaTambahanNims) 
                           : [],
      uploadedFilePath: req.file.path // Path ke file yang disimpan oleh multer
    };
    
    const result = await projectService.createNewProject(projectData, userData);
    
    res.status(201).json(result);

  } catch (error) {
    // Tangani error multer (misalnya file terlalu besar, tipe salah)
     if (error instanceof require('multer').MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            error.message = 'Ukuran file gambar terlalu besar (maks 2MB).';
        } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
             error.message = error.message || 'Tipe file tidak diizinkan. Hanya gambar (JPEG, PNG, GIF).';
        }
        error.statusCode = 400;
    } else if (error.name === 'SyntaxError' && error.message.includes('JSON.parse')) {
        error.message = 'Format data anggota tim tidak valid.';
        error.statusCode = 400;
    }
    next(error);
  }
};

// Fungsi getDashboardFeed yang sudah ada sebelumnya...
exports.getDashboardFeed = async (req, res, next) => {
  try {
    if (!req.user) {
        const error = new Error('Tidak terautentikasi.');
        error.statusCode = 401;
        throw error;
    }
    const feedData = await projectService.getDashboardProjectFeed(req.user);
    res.status(200).json(feedData);
  } catch (error) {
    next(error);
  }
};

exports.getUserProjects = async (req, res, next) => {
  try {
    // req.user diisi oleh middleware protectRoute dan berisi ID pengguna (UUID)
    if (!req.user || !req.user.id) {
        const error = new Error('Tidak terautentikasi atau data pengguna tidak lengkap.');
        error.statusCode = 401;
        throw error;
    }
    if (req.user.role !== 'mahasiswa') {
        const error = new Error('Hanya mahasiswa yang dapat melihat "Proyek Saya".');
        error.statusCode = 403; // Forbidden
        throw error;
    }

    const queryParams = {
        page: req.query.page || 1,
        limit: req.query.limit || 5, // Default 5 proyek per halaman untuk "Proyek Saya"
        status: req.query.status, // Pengguna bisa filter status proyeknya sendiri
    };

    const projectsData = await projectService.getMyProjects(req.user.id, queryParams);
    res.status(200).json(projectsData);
  } catch (error) {
    next(error);
  }
};

// --- FUNGSI BARU UNTUK HALAMAN EKSPLORASI PROYEK ---
exports.getAllActiveProjects = async (req, res, next) => {
  try {
    // Ambil query params untuk pagination, filter, sort
    const queryParams = {
        page: req.query.page || 1,
        limit: req.query.limit || 10, // Default 10 proyek per halaman
        kategoriId: req.query.kategoriId, // Frontend akan kirim kategoriId
        sort: req.query.sort,
        // Tambahkan filter lain jika perlu (misal: search by judul)
    };
    // console.log(queryParams);
    
    const projectsData = await projectService.getAllPublicActiveProjects(queryParams);
    // console.log(projectsData);
    res.status(200).json(projectsData);
  } catch (error) {
    next(error);
  }
};