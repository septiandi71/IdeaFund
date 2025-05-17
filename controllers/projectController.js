// ibik-crowdfund-backend/controllers/projectController.js
const projectService = require('../services/projectService');
// const { validationResult } = require('express-validator'); // Untuk validasi input nanti

exports.createProject = async (req, res, next) => {
  try {
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //   const error = new Error('Data input tidak valid.');
    //   error.statusCode = 422;
    //   error.data = errors.array();
    //   throw error;
    // }

    // req.user akan diisi oleh middleware protectRoute
    if (!req.user || !req.user.id) {
        const error = new Error('Tidak terautentikasi atau data pengguna tidak lengkap.');
        error.statusCode = 401;
        throw error;
    }
    
    // Data proyek dari body request
    const projectData = req.body;
    // Data pengguna yang login (pemilik/ketua)
    const userData = req.user; 

    const result = await projectService.createNewProject(projectData, userData);
    
    res.status(201).json(result);

  } catch (error) {
    next(error); // Teruskan ke global error handler
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

// --- FUNGSI BARU UNTUK HALAMAN EKSPLORASI PROYEK ---
exports.getAllActiveProjects = async (req, res, next) => {
  try {
    // Ambil query params untuk pagination, filter, sort
    const queryParams = {
        page: req.query.page || 1,
        limit: req.query.limit || 10, // Default 10 proyek per halaman
        kategori: req.query.kategoriId, // Frontend akan kirim kategoriId
        sort: req.query.sort,
        // Tambahkan filter lain jika perlu (misal: search by judul)
    };
    
    const projectsData = await projectService.getAllPublicActiveProjects(queryParams);
    console.log(projectsData);
    res.status(200).json(projectsData);
  } catch (error) {
    next(error);
  }
};