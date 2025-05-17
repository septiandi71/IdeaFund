// ibik-crowdfund-backend/services/projectService.js
const { Proyek, Tim, AnggotaTim, Mahasiswa, Kategori, sequelize } = require('../models');
const crypto = require('crypto'); // Untuk generate UUID jika model tidak otomatis (Sequelize UUIDV4 lebih baik)
const { Op } = require('sequelize'); // Untuk query OR

// Fungsi untuk membuat proyek baru
async function createNewProject(projectData, userData) {
  const t = await sequelize.transaction(); 

  try {
    if (!userData || !userData.id) {
      throw new Error('Informasi pengguna (pemilik proyek) tidak valid.');
    }

    // --- PENGECEKAN PROYEK AKTIF/PENDING DARI MAHASISWA ---
    const existingActiveOrPendingProject = await Proyek.findOne({
      where: {
        pemilikId: userData.id, // PK UUID Mahasiswa
        status: {
          [Op.or]: ['PENDING_REVIEW', 'AKTIF'] // Status yang dianggap masih berjalan
        }
      },
      transaction: t
    });

    if (existingActiveOrPendingProject) {
      throw new Error('Anda sudah memiliki proyek yang sedang direview atau aktif menggalang dana. Selesaikan atau batalkan proyek tersebut sebelum membuat yang baru.');
    }
    // --- AKHIR PENGECEKAN ---


    if (projectData.isProyekTim && (!userData.id)) { // Ketua tim harus user yang login
      throw new Error('Ketua tim harus pengguna yang mengajukan proyek.');
    }

    const proyekToCreate = {
      id: crypto.randomUUID(), 
      judul: projectData.judul,
      deskripsi: projectData.deskripsi,
      targetDana: projectData.targetDana,
      danaTerkumpul: 0,
      batasWaktu: projectData.batasWaktu,
      status: 'PENDING_REVIEW', 
      pemilikId: userData.id, // PK UUID dari Mahasiswa yang login
      kategoriId: projectData.kategoriId,
      projectImageUrl: projectData.projectImageUrl, // Gambar utama proyek
      isNftReward: projectData.isNftReward,
      // Jika isNftReward true, nftImageUrl diisi dengan projectImageUrl
      projectImageUrl: projectData.isNftReward ? projectData.projectImageUrl : null, 
      isStage1Verified: false,
      isStage2Verified: false,
      timId: null, 
    };

    const proyek = await Proyek.create(proyekToCreate, { transaction: t });

    if (projectData.isProyekTim) {
      const timToCreate = {
        id: crypto.randomUUID(), 
        proyekId: proyek.id,
        ketuaId: userData.id, // PK UUID Mahasiswa sebagai ketua
      };
      const tim = await Tim.create(timToCreate, { transaction: t });

      await proyek.update({ timId: tim.id }, { transaction: t });

      if (projectData.anggotaTambahanNims && projectData.anggotaTambahanNims.length > 0) {
        for (const anggotaNim of projectData.anggotaTambahanNims) {
          if (anggotaNim === userData.nim) continue; // Lewati jika NIM ketua (seharusnya sudah divalidasi di frontend)

          // Cari mahasiswa berdasarkan NIM untuk mendapatkan ID UUID-nya
          const anggotaMahasiswa = await Mahasiswa.findOne({ 
            where: { nim: anggotaNim }, 
            attributes: ['id'], // Hanya butuh ID
            transaction: t 
          });

          if (anggotaMahasiswa && anggotaMahasiswa.id) {
            await AnggotaTim.create({
              timId: tim.id,
              mahasiswaId: anggotaMahasiswa.id, // Gunakan PK UUID Mahasiswa
            }, { transaction: t });
          } else {
            console.warn(`NIM anggota ${anggotaNim} tidak ditemukan di tabel Mahasiswa, tidak ditambahkan ke tim.`);
            // Anda bisa memutuskan untuk throw error di sini jika anggota harus sudah terdaftar
            // throw new Error(`Anggota tim dengan NIM ${anggotaNim} tidak ditemukan.`);
          }
        }
      }
    }

    await t.commit();
    
    return { 
        success: true, 
        message: 'Proyek berhasil diajukan dan menunggu review admin.', 
        proyekId: proyek.id 
    };

  } catch (error) {
    await t.rollback();
    console.error("Error di service createNewProject:", error);
    // Teruskan pesan error yang lebih spesifik jika ada
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
  const { page = 1, limit = 9, kategoriId, sort, searchTerm } = queryParams; // Tambahkan searchTerm
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let whereClause = { status: 'AKTIF' };

  // Terapkan filter kategori hanya jika kategoriId ada dan tidak kosong
  if (kategoriId && kategoriId !== '') {
    const parsedKategoriId = parseInt(kategoriId);
    if (!isNaN(parsedKategoriId)) {
      whereClause.kategoriId = parsedKategoriId;
    } else {
      console.warn(`Nilai kategoriId tidak valid diterima: ${kategoriId}`);
      // Anda bisa memilih untuk mengabaikan filter atau mengembalikan error
    }
  }

  // Tambahkan filter pencarian berdasarkan judul atau deskripsi
  if (searchTerm && searchTerm.trim() !== '') {
    whereClause[Op.or] = [
      { judul: { [Op.like]: `%${searchTerm}%` } },
      { deskripsi: { [Op.like]: `%${searchTerm}%` } }
    ];
  }

  let orderClause = [['createdAt', 'DESC']]; 
  if (sort) {
    if (sort === 'dana_terkumpul_desc') orderClause = [['danaTerkumpul', 'DESC']];
    if (sort === 'dana_terkumpul_asc') orderClause = [['danaTerkumpul', 'ASC']];
    if (sort === 'terbaru') orderClause = [['createdAt', 'DESC']];
    if (sort === 'terlama') orderClause = [['createdAt', 'ASC']];
    if (sort === 'batas_waktu_asc') orderClause = [['batasWaktu', 'ASC']]; // Contoh sort batas waktu
    if (sort === 'batas_waktu_desc') orderClause = [['batasWaktu', 'DESC']];
  }
  
  try {
    const { count, rows } = await Proyek.findAndCountAll({
      where: whereClause,
      order: orderClause,
      limit: parseInt(limit),
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
          attributes: ['id', 'namaLengkap', 'nim', 'walletAddress'] // Kirim walletAddress pemilik
        }
      ],
      distinct: true,
    });
    return {
        totalPages: Math.ceil(count / parseInt(limit)),
        currentPage: parseInt(page),
        totalProjects: count,
        projects: rows
    };
  } catch (error) {
    console.error("Error di service getAllPublicActiveProjects:", error);
    throw new Error(error.message || 'Gagal mengambil daftar proyek aktif.');
  }
}

module.exports = {
  createNewProject,
  getDashboardProjectFeed,
  getAllPublicActiveProjects
};
