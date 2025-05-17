// ibik-crowdfund-backend/services/projectService.js
const { Proyek, Tim, AnggotaTim, Mahasiswa, Prodi, Kategori, sequelize } = require('../models');
const crypto = require('crypto'); // Untuk generate UUID jika model tidak otomatis (Sequelize UUIDV4 lebih baik)
const { Op } = require('sequelize'); // Untuk query OR

// Fungsi untuk membuat proyek baru
async function createNewProject(projectData, userData) {
  const t = await sequelize.transaction();
  let uploadedFilePathForCleanup = projectData.uploadedFilePath; // Simpan path untuk cleanup

  try {
    if (!userData || !userData.id) {
      throw new Error('Informasi pengguna (pemilik proyek) tidak valid.');
    }

    if (userData.role === 'mahasiswa') {
      const existingActiveOrPendingProject = await Proyek.findOne({
        where: { pemilikId: userData.id, status: { [Op.or]: ['PENDING_REVIEW', 'AKTIF'] } },
        transaction: t
      });
      if (existingActiveOrPendingProject) {
        throw new Error('Anda sudah memiliki proyek yang sedang direview atau aktif. Selesaikan atau batalkan sebelum membuat yang baru.');
      }
    }

    let finalProjectImageUrl = null;
    if (projectData.uploadedFilePath) {
        finalProjectImageUrl = projectData.uploadedFilePath.replace(/^public[\\/]/, '/').replace(/\\/g, '/');
    } else {
        // Jika gambar wajib, controller seharusnya sudah menangani ini.
        // Jika tidak, dan Anda memperbolehkan proyek tanpa gambar:
        // finalProjectImageUrl = null; 
        // Namun, karena frontend 'required', ini seharusnya tidak terjadi.
        throw new Error("Tidak ada file gambar proyek yang diunggah.");
    }

    const proyekToCreate = {
      id: crypto.randomUUID(), 
      judul: projectData.judul,
      deskripsi: projectData.deskripsi,
      targetDana: parseFloat(projectData.targetDana),
      danaTerkumpul: 0,
      batasWaktu: projectData.batasWaktu,
      status: 'PENDING_REVIEW', 
      pemilikId: userData.id, 
      kategoriId: parseInt(projectData.kategoriId),
      projectImageUrl: finalProjectImageUrl,
      isNftReward: projectData.isNftReward,
      isStage1Verified: false,
      isStage2Verified: false,
      timId: null, 
    };

    const proyek = await Proyek.create(proyekToCreate, { transaction: t });

    if (projectData.isProyekTim) {
      // ... (logika pembuatan Tim dan AnggotaTim tetap sama) ...
      const timToCreate = { id: crypto.randomUUID(), proyekId: proyek.id, ketuaId: userData.id };
      const tim = await Tim.create(timToCreate, { transaction: t });
      await proyek.update({ timId: tim.id }, { transaction: t });
      if (projectData.anggotaTambahanNims && projectData.anggotaTambahanNims.length > 0) {
        for (const anggotaNim of projectData.anggotaTambahanNims) {
          if (anggotaNim === userData.nim) continue;
          const anggotaMahasiswa = await Mahasiswa.findOne({ 
            where: { nim: anggotaNim }, attributes: ['id'], transaction: t 
          });
          if (anggotaMahasiswa && anggotaMahasiswa.id) {
            const existingAnggota = await AnggotaTim.findOne({
                where: { timId: tim.id, mahasiswaId: anggotaMahasiswa.id }, transaction: t
            });
            if (!existingAnggota) {
                await AnggotaTim.create({ timId: tim.id, mahasiswaId: anggotaMahasiswa.id }, { transaction: t });
            }
          } else { console.warn(`NIM anggota ${anggotaNim} tidak ditemukan.`); }
        }
      }
    }

    await t.commit();
    // Setelah commit berhasil, path file tidak perlu di-cleanup lagi
    uploadedFilePathForCleanup = null; 
    
    return { 
        success: true, 
        message: 'Proyek berhasil diajukan dan menunggu review admin.', 
        proyekId: proyek.id,
        projectImageUrl: proyek.projectImageUrl
    };

  } catch (error) {
    await t.rollback();
    // Jika ada file yang sudah diunggah dan terjadi error, hapus file tersebut
    if (uploadedFilePathForCleanup) {
      try {
        // Pastikan path ini adalah path absolut atau relatif yang benar dari root proyek backend
        const fullPath = path.join(__dirname, '..', uploadedFilePathForCleanup); // Sesuaikan '..' jika perlu
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`File ${fullPath} berhasil dihapus karena proses gagal.`);
        } else {
            console.warn(`File ${fullPath} tidak ditemukan untuk dihapus.`);
        }
      } catch (cleanupError) {
        console.error(`Gagal menghapus file ${uploadedFilePathForCleanup} setelah proses gagal:`, cleanupError);
      }
    }
    console.error("Error di service createNewProject:", error);
    throw new Error(error.message || 'Gagal membuat proyek baru.');
  }
}

// --- FUNGSI UNTUK DASHBOARD FEED (Pastikan Kategori dan Mahasiswa diimpor) ---
async function getDashboardProjectFeed(user) {
  if (!user || !user.id || !user.role) {
    throw new Error('Informasi pengguna tidak lengkap untuk mengambil feed dashboard.');
  }
  const limit = 3; 
  try {
    if (user.role === 'mahasiswa') {
      const myLatestProjects = await Proyek.findAll({
        where: { pemilikId: user.id },
        order: [['createdAt', 'DESC']],
        limit: limit,
        include: [
          { model: Kategori, as: 'kategori', attributes: ['nama_kategori'] }, // Menggunakan model Kategori
          { model: Mahasiswa, as: 'pemilik', attributes: ['id', 'namaLengkap', 'nim'] } 
        ]
      });
      const otherActiveProjects = await Proyek.findAll({
        where: { 
          status: 'AKTIF',
          pemilikId: { [Op.ne]: user.id } 
        },
        order: [['createdAt', 'DESC']],
        limit: limit,
        include: [
          { model: Kategori, as: 'kategori', attributes: ['nama_kategori'] }, // Menggunakan model Kategori
          { model: Mahasiswa, as: 'pemilik', attributes: ['id', 'namaLengkap', 'nim'] }
        ]
      });
      return { /* ... */ }; // Sisa respons sama
    } else if (user.role === 'donatur') {
      const activeProjects = await Proyek.findAll({
        where: { status: 'AKTIF' },
        order: [['danaTerkumpul', 'DESC'], ['createdAt', 'DESC']],
        limit: limit * 2, 
        include: [
          { model: Kategori, as: 'kategori', attributes: ['nama_kategori'] }, // Menggunakan model Kategori
          { model: Mahasiswa, as: 'pemilik', attributes: ['id', 'namaLengkap', 'nim'] }
        ]
      });
      return { titleSection1: "Proyek Butuh Dukungan", projectsSection1: activeProjects };
    } else if (user.role === 'admin') {
      const pendingReviewProjects = await Proyek.findAll({
        where: { status: 'PENDING_REVIEW' },
        order: [['createdAt', 'ASC']], 
        limit: limit,
        include: [
          { model: Kategori, as: 'kategori', attributes: ['nama_kategori'] }, // Menggunakan model Kategori
          { model: Mahasiswa, as: 'pemilik', attributes: ['id', 'namaLengkap', 'nim'] }
        ]
      });
      const recentlyActiveProjects = await Proyek.findAll({
        where: { status: 'AKTIF' },
        order: [['createdAt', 'DESC']],
        limit: limit,
        include: [
          { model: Kategori, as: 'kategori', attributes: ['nama_kategori'] }, // Menggunakan model Kategori
          { model: Mahasiswa, as: 'pemilik', attributes: ['id', 'namaLengkap', 'nim'] }
        ]
      });
      return { /* ... */ }; // Sisa respons sama
    } else {
      return { titleSection1: "Proyek Tersedia", projectsSection1: [] };
    }
  } catch (error) {
    console.error("Error di service getDashboardProjectFeed:", error);
    throw new Error(error.message || 'Gagal mengambil feed proyek untuk dashboard.');
  }
}

// --- FUNGSI UNTUK HALAMAN EKSPLORASI PROYEK (Pastikan Kategori dan Mahasiswa diimpor) ---
async function getAllPublicActiveProjects(queryParams) {
  const { page = 1, limit = 9, kategoriId, sort, searchTerm } = queryParams;
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  let whereClause = { status: 'AKTIF' };

  if (kategoriId && kategoriId.toString().trim() !== '') {
    const parsedKategoriId = parseInt(kategoriId, 10);
    if (!isNaN(parsedKategoriId)) {
      whereClause.kategoriId = parsedKategoriId;
    }
  }

  if (searchTerm && searchTerm.trim() !== '') {
    const searchQuery = `%${searchTerm.trim()}%`;
    whereClause[Op.or] = [
      { judul: { [Op.like]: searchQuery } },
      { deskripsi: { [Op.like]: searchQuery } }
    ];
  }

  let orderClause = [['createdAt', 'DESC']]; 
  if (sort) {
    if (sort === 'dana_terkumpul_desc') orderClause = [['danaTerkumpul', 'DESC']];
    if (sort === 'dana_terkumpul_asc') orderClause = [['danaTerkumpul', 'ASC']];
    if (sort === 'terbaru') orderClause = [['createdAt', 'DESC']];
    if (sort === 'terlama') orderClause = [['createdAt', 'ASC']];
    if (sort === 'batas_waktu_asc') orderClause = [['batasWaktu', 'ASC']];
    if (sort === 'batas_waktu_desc') orderClause = [['batasWaktu', 'DESC']];
  }

  try {
    const { count, rows } = await Proyek.findAndCountAll({
      where: whereClause,
      order: orderClause,
      limit: parseInt(limit, 10),
      offset: offset,
      include: [
        { 
          model: Kategori, 
          as: 'kategori', 
          attributes: ['id_kategori', 'nama_kategori'] 
        },
        { 
          model: Mahasiswa, 
          as: 'pemilik', 
          attributes: ['id', 'namaLengkap', 'nim', 'walletAddress'], // Ambil atribut dasar Mahasiswa
          include: [{ // Include Prodi dari Mahasiswa
            model: Prodi,
            as: 'prodi', // Pastikan alias ini ada di model Mahasiswa
            attributes: ['id_prodi', 'nama_prodi'],
            // Jika ingin nama fakultas juga:
            // include: [{
            //   model: Fakultas,
            //   as: 'fakultas', // Pastikan alias ini ada di model Prodi
            //   attributes: ['nama_fakultas']
            // }]
          }]
        }
      ],
      distinct: true,
    });
    return {
        totalPages: Math.ceil(count / parseInt(limit, 10)),
        currentPage: parseInt(page, 10),
        totalProjects: count,
        projects: rows
    };
  } catch (error) {
    console.error("Error di service getAllPublicActiveProjects:", error);
    throw new Error(error.message || 'Gagal mengambil daftar proyek aktif.');
  }
}

async function getMyProjects(userId, queryParams) {
  if (!userId) {
    throw new Error('User ID diperlukan untuk mengambil proyek saya.');
  }
  const { page = 1, limit = 3, status } = queryParams; 
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  let whereClause = { pemilikId: userId }; 
  
  if (status && status !== '' && status !== 'SEMUA') {
    whereClause.status = status;
  }

  try {
    const { count, rows } = await Proyek.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit, 10),
      offset: offset,
      include: [
        { 
          model: Kategori, 
          as: 'kategori', 
          attributes: ['id_kategori', 'nama_kategori'] 
        },
        // Untuk "Proyek Saya", pemiliknya adalah user itu sendiri.
        // Jika Anda tetap ingin data pemilik (meskipun redundan), include seperti di getAllPublicActiveProjects.
        // Atau, jika tidak perlu, bisa dihilangkan dari include di sini.
        // Untuk konsistensi data di ProjectCard, kita bisa tetap include:
        { 
          model: Mahasiswa, 
          as: 'pemilik', 
          attributes: ['id', 'namaLengkap', 'nim', 'walletAddress'],
          include: [{
            model: Prodi,
            as: 'prodi',
            attributes: ['id_prodi', 'nama_prodi'],
          }]
        }
      ],
      distinct: true,
    });
    return { /* ... (sama seperti sebelumnya) ... */ };
  } catch (error) {
    console.error("Error di service getMyProjects:", error);
    throw new Error(error.message || 'Gagal mengambil daftar proyek Anda.');
  }
}

module.exports = {
  createNewProject,
  getDashboardProjectFeed,
  getAllPublicActiveProjects,
  getMyProjects
};
