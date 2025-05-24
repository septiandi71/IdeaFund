// ibik-crowdfund-backend/controllers/projectController.js
const projectService = require('../services/projectService');
const { Proyek, Mahasiswa } = require('../models'); // Tambahkan Mahasiswa jika diperlukan untuk mengambil wallet pemilik
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
    console.error('Error di controller getDashboardFeed:', error);
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
      status: req.query.status,
    };

    // Pastikan req.user dan queryParams diteruskan ke service
    const projectsData = await projectService.getAllPublicActiveProjects(req.user, queryParams);
    res.status(200).json(projectsData);
  } catch (error) {
    console.error('Error di getAllActiveProjects:', error);
    next(error);
  }
};

exports.getAllProjectsByStatus = async (req, res, next) => {
  try {
    const { status } = req.query;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Anda tidak memiliki akses ke fitur ini.' });
    }

    const whereCondition = status ? { status } : {};
    const projects = await Proyek.findAll({ where: whereCondition });

    res.status(200).json({ success: true, projects });
  } catch (error) {
    console.error('Error di getAllProjectsByStatus:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data proyek.' });
  }
};

exports.getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await projectService.getProjectById(id);

    res.status(200).json(project);
  } catch (error) {
    console.error('Error di controller getProjectById:', error);
    res.status(500).json({ message: error.message || 'Gagal mengambil detail proyek.' });
  }
};

exports.updateProjectStatus = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Anda tidak memiliki akses ke fitur ini.' });
    }

    const { projectId, status } = req.body;

    if (!['AKTIF', 'DITOLAK'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status tidak valid.' });
    }

    const project = await Proyek.findByPk(projectId);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Proyek tidak ditemukan.' });
    }

    if (project.status !== 'PENDING_REVIEW') {
      return res.status(400).json({ success: false, message: 'Proyek tidak dalam status PENDING_REVIEW.' });
    }

    // Jangan set project.batasWaktu di sini. Ini akan dihandle saat konfirmasi on-chain.

    project.status = status;
    await project.save();

    res.status(200).json({ success: true, message: `Proyek berhasil diperbarui menjadi ${status}.` });
  } catch (error) {
    console.error('Error di updateProjectStatus:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui status proyek.' });
  }
};

exports.confirmProjectPublicationController = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id; // Ambil userId dari pengguna yang terautentikasi
    const { txHash, onChainProjectId, onChainDeadlineTimestamp } = req.body;

    // Anda mungkin ingin validasi tambahan di sini
    if (!txHash || !onChainProjectId || onChainDeadlineTimestamp === undefined) {
      return res.status(400).json({ success: false, message: 'Data txHash, onChainProjectId, dan onChainDeadlineTimestamp diperlukan.' });
    }

    // Panggil service yang sudah ada atau buat yang baru jika logika berbeda
    // Asumsi projectService.confirmProjectOnChain sudah ada dan sesuai
    const result = await projectService.confirmProjectOnChain(
        projectId, // Ini adalah dbProjectId
        { txHash, onChainProjectId, onChainDeadlineTimestamp }, // Ini adalah onChainData
        userId // Teruskan userId ke service
    );
    res.status(200).json(result);
  } catch (error) {
    console.error(`Error di controller confirmProjectPublicationController untuk projectId ${req.params.projectId}:`, error);
    next(error);
  }
};

exports.recordClaimController = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { txHash, amountClaimedUSDT } = req.body; // Ganti nama variabel
    const userId = req.user.id;

    if (!txHash || amountClaimedUSDT === undefined) {
      return res.status(400).json({ success: false, message: 'Data txHash dan amountClaimedUSDT diperlukan.' });
    }
    // Pastikan service menerima amountClaimedUSDT
    const result = await projectService.recordClaimedFunds(userId, projectId, txHash, amountClaimedUSDT);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};