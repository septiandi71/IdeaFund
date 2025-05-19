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

  try {
    if (user.role === 'mahasiswa') {
      // Hitung jumlah proyek yang diajukan oleh user
      const totalSubmittedProjects = await Proyek.count({
        where: { pemilikId: user.id },
      });

      // Hitung jumlah proyek aktif oleh user
      const totalActiveProjects = await Proyek.count({
        where: { pemilikId: user.id, status: 'AKTIF' },
      });

      // Hitung total dana terkumpul dari semua proyek user
      const totalFundsRaised = await Proyek.sum('danaTerkumpul', {
        where: { pemilikId: user.id },
      });

      return {
        totalSubmittedProjects,
        totalActiveProjects,
        totalFundsRaised: totalFundsRaised || 0, // Jika null, kembalikan 0
      };
    } else if (user.role === 'admin') {
      // Statistik untuk admin
      const totalProjects = await Proyek.count();
      const totalActiveProjects = await Proyek.count({
        where: { status: 'AKTIF' },
      });
      const totalFundsRaised = await Proyek.sum('danaTerkumpul');

      return {
        totalProjects,
        totalActiveProjects,
        totalFundsRaised: totalFundsRaised || 0,
      };
    } else {
      throw new Error('Peran pengguna tidak valid untuk dashboard feed.');
    }
  } catch (error) {
    console.error('Error di service getDashboardProjectFeed:', error);
    throw new Error(error.message || 'Gagal mengambil data dashboard.');
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
  console.log(userId);
  if (!userId) {
    throw new Error('User ID diperlukan untuk mengambil proyek saya.');
  }
  const { page = 1, limit = 3 } = queryParams; 
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  let whereClause = { pemilikId: userId }; 

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
    return { 
        totalPages: Math.ceil(count / parseInt(limit, 10)),
        currentPage: parseInt(page, 10),
        totalProjects: count,
        projects: rows
     };
  } catch (error) {
    console.error("Error di service getMyProjects:", error);
    throw new Error(error.message || 'Gagal mengambil daftar proyek Anda.');
  }
}

async function getProjectById(projectId) {
  try {
    const project = await Proyek.findOne({
      where: { id: projectId },
      include: [
        {
          model: Tim,
          as: 'timProyek',
          include: [
            {
              model: Mahasiswa,
              as: 'ketuaTim',
              attributes: ['id', 'namaLengkap', 'nim'],
            },
            {
              model: Mahasiswa,
              as: 'anggotaList',
              through: { attributes: [] }, // Jangan ambil data dari tabel junction
              attributes: ['id', 'namaLengkap', 'nim'],
            },
          ],
        },
        {
          model: Mahasiswa,
          as: 'pemilik',
          attributes: ['id', 'namaLengkap', 'nim'],
        },
      ],
    });

    if (!project) {
      throw new Error('Proyek tidak ditemukan.');
    }

    return project;
  } catch (error) {
    console.error('Error di service getProjectById:', error);
    throw new Error(error.message || 'Gagal mengambil detail proyek.');
  }
}

module.exports = {
  createNewProject,
  getDashboardProjectFeed,
  getAllPublicActiveProjects,
  getMyProjects,
  getProjectById
};
