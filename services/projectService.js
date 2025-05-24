// ibik-crowdfund-backend/services/projectService.js
const { Proyek, Tim, AnggotaTim, Mahasiswa, Prodi, Kategori, Transaksi, sequelize } = require('../models');
const { Op } = require('sequelize'); // Untuk query OR
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');
const IdeaFundABI = require('../contracts/abi/IdeaFundABI.json'); // Pastikan path ini benar

const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
// Jika IdeaFundABI.json adalah array ABI langsung (umum dari Remix):
const ideaFundContractView = new ethers.Contract(process.env.IDEA_FUND_CONTRACT_ADDRESS, IdeaFundABI, provider);
// Jika IdeaFundABI.json adalah objek dengan properti 'abi' (umum dari Hardhat/Truffle artifacts):
// const ideaFundContractView = new ethers.Contract(process.env.IDEA_FUND_CONTRACT_ADDRESS, IdeaFundABI.abi, provider);

// Fungsi untuk membuat proyek baru
async function createNewProject(projectData, userData) {
  const t = await sequelize.transaction();
  // Simpan path asli untuk cleanup jika terjadi error
  let originalUploadedFilePathForCleanup = projectData.uploadedFilePath; 
  
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
        throw new Error('Anda sudah memiliki proyek yang sedang direview atau aktif. Silakan tunggu hingga proyek tersebut selesai sebelum membuat proyek baru.');
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
      judul: projectData.judul,
      deskripsi: projectData.deskripsi,
      targetDana: parseFloat(projectData.targetDana),
      danaTerkumpul: 0,
      batasWaktu: null,
      durasiHari: parseInt(projectData.durasiHari),
      status: 'PENDING_REVIEW', 
      pemilikId: userData.id, 
      kategoriId: parseInt(projectData.kategoriId),
      projectImageUrl: finalProjectImageUrl,
      isNftReward: projectData.isNftReward,
      isStage1Verified: false,
      isStage2Verified: false
      // timId: null, // Proyek model does not have timId. Tim has proyekId.
    };

    const proyek = await Proyek.create(proyekToCreate, { transaction: t });

    if (projectData.isProyekTim) {
      const timToCreate = { proyekId: proyek.id, ketuaId: userData.id }; // Sequelize handles Tim's ID
      const tim = await Tim.create(timToCreate, { transaction: t }); // Link to Proyek is via tim.proyekId
      // await proyek.update({ timId: tim.id }, { transaction: t }); // This is incorrect; Proyek has no timId.
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
    // Setelah commit berhasil, path file asli tidak perlu di-cleanup lagi
    originalUploadedFilePathForCleanup = null; 
    
    return { 
        success: true, 
        message: 'Proyek berhasil diajukan dan menunggu review admin.', 
        proyekId: proyek.id,
        projectImageUrl: proyek.projectImageUrl
    };

  } catch (error) {
    await t.rollback();
    // Jika ada file yang sudah diunggah dan terjadi error, hapus file tersebut
    if (originalUploadedFilePathForCleanup) {
      try {
        // Pastikan path ini adalah path absolut atau relatif yang benar dari root proyek backend
        const fullPath = path.join(__dirname, '..', originalUploadedFilePathForCleanup); 
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`File ${fullPath} berhasil dihapus karena proses gagal.`);
        } else {
            console.warn(`File asli ${fullPath} tidak ditemukan untuk dihapus.`);
        }
      } catch (cleanupError) {
        console.error(`Gagal menghapus file asli ${originalUploadedFilePathForCleanup} setelah proses gagal:`, cleanupError);
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
async function getAllPublicActiveProjects(user, queryParams) {
  const { page = 1, limit = 9, kategoriId, sort, status, searchTerm } = queryParams;
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  let includeClause = [
    { 
      model: Kategori, 
      as: 'kategori', 
      attributes: ['id_kategori', 'nama_kategori'] 
    },
    { 
      model: Mahasiswa, 
      as: 'pemilik', 
      attributes: ['id', 'namaLengkap', 'nim', 'walletAddress'], 
    },
  ];

  let whereConditions = []; // Array untuk menampung semua kondisi AND

  // Obyek include untuk Tim, akan digunakan oleh mahasiswa dan admin
  const timInclude = {
    model: Tim,
    as: 'timProyek',
    required: false, 
    include: [
      {
        model: AnggotaTim,
        as: 'anggotaList',
        attributes: ['id'], // Hanya perlu untuk join
        include: [
          {
            model: Mahasiswa,
            as: 'mahasiswa',
            attributes: ['id', 'namaLengkap', 'nim'],
          },
        ],
      },
    ],
  };

  // Logika filter berdasarkan peran pengguna
  if (user.role === 'mahasiswa') {
    // 1. Dapatkan ID semua tim dimana mahasiswa adalah anggota
    const timsUserIsMemberOf = await AnggotaTim.findAll({
      where: { mahasiswaId: user.id },
      attributes: ['timId'],
      raw: true,
    });
    const timIds = timsUserIsMemberOf.map(at => at.timId);

    let projectIdsFromTeams = [];
    if (timIds.length > 0) {
      // 2. Dapatkan proyekId dari tim-tim tersebut
      const timRecords = await Tim.findAll({
        where: { id: { [Op.in]: timIds } },
        attributes: ['proyekId'],
        raw: true,
      });
      projectIdsFromTeams = timRecords.map(t => t.proyekId).filter(id => id); // Filter out null/undefined proyekId
    }

    const mahasiswaVisibilityOrConditions = [];

    // Kondisi 1: Proyek dimana mahasiswa adalah anggota tim.
    // Status proyek dari queryParams TIDAK berlaku di sini.
    if (projectIdsFromTeams.length > 0) {
      mahasiswaVisibilityOrConditions.push({
        id: { [Op.in]: projectIdsFromTeams }
      });
    }

    // Kondisi 2: Proyek yang dimiliki oleh mahasiswa.
    // Status proyek dari queryParams TIDAK berlaku di sini.
    mahasiswaVisibilityOrConditions.push({
      pemilikId: user.id
    });

    // Kondisi 3: Proyek publik lainnya yang AKTIF.
    // Status proyek dari queryParams BERLAKU untuk bagian ini.
    let otherPublicProjectsCondition = { status: 'AKTIF' };
    if (status && status.trim() !== '') {
      // Jika ada filter status dari query, proyek di kategori ini harus AKTIF DAN sesuai filter status tersebut.
      otherPublicProjectsCondition = {
        [Op.and]: [
          { status: 'AKTIF' }, // Harus tetap 'AKTIF' secara umum
          { status: status.trim() }  // Dan cocok dengan filter status spesifik
        ]
      };
    }
    mahasiswaVisibilityOrConditions.push(otherPublicProjectsCondition);

    // Gabungkan ketiga kondisi utama ini dengan OR.
    // Ini akan menjadi satu kesatuan kondisi yang kemudian akan di-AND-kan dengan filter kategori dan search term.
    if (mahasiswaVisibilityOrConditions.length > 0) {
      whereConditions.push({ [Op.or]: mahasiswaVisibilityOrConditions });
    }
    includeClause.push(timInclude); // Tambahkan include untuk detail tim

  } else if (user.role === 'donatur') {
    let donaturStatusQuery = { status: 'AKTIF' };
    // Jika donatur memfilter berdasarkan status, itu harus 'AKTIF'
    if (status && status.trim() !== '' && status.trim() !== 'AKTIF') {
      // Membuat kondisi yang tidak mungkin terpenuhi jika filter status bukan 'AKTIF'
      donaturStatusQuery = { [Op.and]: [{ status: 'AKTIF' }, { status: status.trim() }] };
    }
    whereConditions.push(donaturStatusQuery);

  } else if (user.role === 'admin') {
    // Admin dapat melihat semua proyek, tidak ada filter status default di sini.
    // Filter status akan diterapkan di bawah jika ada di queryParams.
    if (status && status.trim() !== '') {
      whereConditions.push({ status: status.trim() });
    }
    includeClause.push(timInclude); // Tambahkan include untuk detail tim
  }

  // Filter status dari queryParams sudah ditangani dalam logika peran di atas.

  // Filter berdasarkan kategori
  if (kategoriId && kategoriId.toString().trim() !== '') {
    const parsedKategoriId = parseInt(kategoriId, 10);
    if (!isNaN(parsedKategoriId)) {
      whereConditions.push({ kategoriId: parsedKategoriId });
    }
  }

  // Filter berdasarkan search term
  if (searchTerm && searchTerm.trim() !== '') {
    const searchQuery = `%${searchTerm.trim()}%`;
    whereConditions.push({
      [Op.or]: [
        { judul: { [Op.like]: searchQuery } },
        { deskripsi: { [Op.like]: searchQuery } },
      ]
    });
  }

  // Gabungkan semua kondisi where menjadi satu objek
  let finalWhereClause = {};
  if (whereConditions.length > 0) {
    finalWhereClause = { [Op.and]: whereConditions };
  }

  // Pengurutan
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
      where: finalWhereClause,
      order: orderClause,
      limit: parseInt(limit, 10),
      offset: offset,
      include: includeClause,
      distinct: true,
    });

    return {
      totalPages: Math.ceil(count / parseInt(limit, 10)),
      currentPage: parseInt(page, 10),
      totalProjects: count,
      projects: rows,
    };
  } catch (error) {
    console.error("Error di service getAllPublicActiveProjects:", error);
    throw new Error(error.message || 'Gagal mengambil daftar proyek.');
  }
}

async function getMyProjects(userId, queryParams) {
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
              model: Mahasiswa, // Ini akan menggunakan alias dari Tim.belongsToMany(Mahasiswa)
              as: 'anggotaMahasiswa', // Sesuaikan dengan alias di model Tim
              through: { attributes: [] },
              attributes: ['id', 'namaLengkap', 'nim', 'walletAddress'],
            },
          ],
        },
        {
          model: Mahasiswa,
          as: 'pemilik',
          attributes: ['id', 'namaLengkap', 'nim'],
          include: [{
            model: Prodi,
            as: 'prodi',
            attributes: ['nama_prodi']
          }]
        },
      ],
    });

    if (!project) {
      return null; // Atau throw error jika lebih sesuai
    }

    // Jika proyek sudah dipublikasikan ke blockchain, coba ambil data on-chain
    let onChainData = null;
    if (project.isPublishedOnChain && project.onChainProjectId) {
      try {
        const scDetails = await ideaFundContractView.getCampaignDetails(project.onChainProjectId);
        onChainData = {
          owner: scDetails[0], // Indeks berdasarkan urutan return di SC
          title: scDetails[1], 
          targetAmount: ethers.formatUnits(scDetails[2], 6), // USDT memiliki 6 desimal
          raisedAmount: ethers.formatUnits(scDetails[3], 6), // USDT memiliki 6 desimal
          deadlineTimestamp: Number(scDetails.deadline), // Unix timestamp
          deadlineDate: new Date(Number(scDetails.deadline) * 1000),
          claimed: scDetails.claimed,
        };
      } catch (scError) {
        console.warn(`Gagal mengambil detail on-chain untuk proyek ${projectId}: ${scError.message}`);
        // Tetap lanjutkan dengan data dari DB
      }
    }

    // Gabungkan data dari DB dengan data on-chain jika ada
    const projectJson = project.toJSON();
    if (onChainData) {
      projectJson.onChainData = onChainData;
      // Anda bisa memilih untuk menimpa beberapa field dari DB dengan data on-chain
      // Misalnya, danaTerkumpul dan onChainDeadline
      projectJson.danaTerkumpul = onChainData.raisedAmount; // Tampilkan dana terkumpul dari SC
      projectJson.onChainDeadline = onChainData.deadlineDate; // Gunakan deadline dari SC
    }

    return projectJson;
  } catch (error) {
    console.error('Error di service getProjectById:', error);
    throw error;
  }
}

async function recordClaimedFunds(userId, projectId, txHash, amountClaimedEth) {
  const t = await sequelize.transaction();
  try {
    const proyek = await Proyek.findByPk(projectId, { transaction: t });
    if (!proyek) throw new Error('Proyek tidak ditemukan.');
    if (proyek.pemilikId !== userId) throw new Error('Anda bukan pemilik proyek ini.');
    if (!proyek.isPublishedOnChain) throw new Error('Proyek belum dipublikasikan ke blockchain.');

    // Update status proyek di DB, misalnya menjadi 'DANA_DIKLAIM' atau 'SUKSES'
    // proyek.status = 'DANA_DIKLAIM'; // Anda mungkin perlu menambahkan status ini ke ENUM
    // await proyek.save({ transaction: t });

    // Catat transaksi pencairan dana
    await Transaksi.create({
      proyekId: projectId,
      targetUserId: userId, // Pemilik proyek
      targetUserWallet: proyek.pemilik.walletAddress, // Ini mungkin perlu jika pemilik adalah entitas Mahasiswa
      jumlah: ethers.parseEther(amountClaimedEth.toString()).toString(), // Simpan sebagai WEI string
      txHash: txHash,
      tipe: 'PENCAIRAN_DANA', // Atau tipe yang lebih spesifik
      timestamp: new Date()
    }, { transaction: t });

    await t.commit();
    return { success: true, message: 'Klaim dana berhasil dicatat.' };
  } catch (error) {
    await t.rollback();
    console.error("Error di service recordClaimedFunds:", error);
    throw new Error(error.message || 'Gagal mencatat klaim dana.');
  }
}

async function confirmProjectOnChain(dbProjectId, onChainData, userId) {
  const t = await sequelize.transaction();
  try {
    const proyek = await Proyek.findByPk(dbProjectId, { transaction: t });

    if (!proyek) {
      throw new Error('Proyek tidak ditemukan di database.');
    }

    // Opsional: Verifikasi kepemilikan jika diperlukan dari service layer
    // Biasanya controller sudah menangani autentikasi, tapi bisa ada lapisan tambahan.
    if (proyek.pemilikId !== userId) {
      // Seharusnya tidak terjadi jika controller sudah memvalidasi pemilik
      throw new Error('Anda tidak berhak mengkonfirmasi proyek ini.');
    }

    if (proyek.isPublishedOnChain) {
      // Mungkin sudah dikonfirmasi sebelumnya, bisa dianggap sukses atau warning
      console.warn(`Proyek dengan ID DB ${dbProjectId} sudah ditandai sebagai on-chain.`);
      // Anda bisa memilih untuk mengembalikan pesan sukses atau error tergantung kebutuhan
      // Untuk saat ini, kita anggap ini bukan error fatal dan lanjutkan (mungkin ada update txHash)
    }

    proyek.isPublishedOnChain = true;
    proyek.txHashPublication = onChainData.txHash; // Sesuaikan dengan nama field di model Proyek
    proyek.onChainProjectId = onChainData.onChainProjectId; // Ini seharusnya sama dengan dbProjectId jika UUID-nya konsisten
    
    const onChainDeadlineTimestampNumber = Number(onChainData.onChainDeadlineTimestamp);
    if (isNaN(onChainDeadlineTimestampNumber) || onChainDeadlineTimestampNumber <= 0) {
      // Tambahkan logging atau penanganan error jika timestamp tidak valid
      console.error(`[projectService.confirmProjectOnChain] onChainDeadlineTimestamp tidak valid: ${onChainData.onChainDeadlineTimestamp}`);
      throw new Error('Timestamp deadline on-chain tidak valid.');
    }
    proyek.onChainDeadline = new Date(onChainDeadlineTimestampNumber * 1000); // Sesuaikan dengan nama field di model Proyek dan simpan sebagai DATE
    proyek.batasWaktu = new Date(onChainDeadlineTimestampNumber * 1000); // Tetap update batasWaktu juga

    console.log(`[projectService.confirmProjectOnChain] Akan mengupdate proyek ${dbProjectId} dengan:`, {
        isPublishedOnChain: proyek.isPublishedOnChain,
        txHashPublication: proyek.txHashPublication,
        onChainProjectId: proyek.onChainProjectId,
        onChainDeadline: proyek.onChainDeadline,
        batasWaktu: proyek.batasWaktu
    });
    await proyek.save({ transaction: t });
    await t.commit();

    return { success: true, message: 'Status proyek on-chain berhasil dikonfirmasi dan diperbarui di database.' };
  } catch (error) {
    await t.rollback();
    console.error("Error di service confirmProjectOnChain:", error);
    throw new Error(error.message || 'Gagal mengkonfirmasi status on-chain proyek.');
  }
}

module.exports = {
  createNewProject,
  getDashboardProjectFeed,
  getAllPublicActiveProjects,
  getMyProjects,
  getProjectById,
  recordClaimedFunds,
  confirmProjectOnChain, // Ekspor fungsi baru
};
