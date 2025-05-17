// ibik-crowdfund-backend/controllers/dataReferensiController.js
const { Fakultas, Prodi, Kategori, Mahasiswa, MahasiswaReferensi } = require('../models'); // Tambahkan Kategori

// Mengambil semua Fakultas (sudah ada)
exports.getAllFakultas = async (req, res, next) => {
  try {
    const fakultasList = await Fakultas.findAll({
      attributes: ['id_fakultas', 'nama_fakultas'],
      order: [['nama_fakultas', 'ASC']],
    });
    res.status(200).json(fakultasList);
  } catch (error) {
    console.error("Error di getAllFakultas:", error);
    next(error);
  }
};

// Mengambil Prodi berdasarkan id_fakultas (sudah ada)
exports.getProdiByFakultas = async (req, res, next) => {
  try {
    const { fakultasId } = req.query;
    if (!fakultasId) {
      return res.status(400).json({ message: 'Parameter fakultasId diperlukan.' });
    }
    const parsedFakultasId = parseInt(fakultasId, 10);
    if (isNaN(parsedFakultasId)) {
        return res.status(400).json({ message: 'Parameter fakultasId harus berupa angka.' });
    }
    const prodiList = await Prodi.findAll({
      where: { id_fakultas: parsedFakultasId }, 
      attributes: ['id_prodi', 'nama_prodi', 'jenjang'],
      order: [['nama_prodi', 'ASC']],
    });
    res.status(200).json(prodiList || []); 
  } catch (error) {
    console.error("Error di getProdiByFakultas:", error);
    next(error);
  }
};

// Mengambil Info Mahasiswa berdasarkan NIM (sudah ada)
exports.getMahasiswaInfoByNim = async (req, res, next) => {
  try {
    const { nim } = req.query;
    if (!nim) {
      return res.status(400).json({ success: false, message: 'Parameter NIM diperlukan.' });
    }

    // Cari di tabel Mahasiswa (yang sudah terdaftar di platform Anda)
    // karena anggota tim idealnya sudah menjadi pengguna sistem.
    // Jika Anda ingin bisa menambahkan NIM dari data BAAK yang belum tentu punya akun,
    // Anda bisa mencari di MahasiswaReferensi juga.
    const mahasiswa = await Mahasiswa.findOne({ 
      where: { nim: nim.trim() }, // Lakukan trim untuk membersihkan spasi
      attributes: ['id', 'nim', 'namaLengkap', 'emailKampus'], // Ambil field yang dibutuhkan
    });

    if (!mahasiswa) {
      // Jika tidak ditemukan di tabel Mahasiswa, coba cari di MahasiswaReferensi
      const mahasiswaRef = await MahasiswaReferensi.findOne({
        where: { nim: nim.trim() },
        attributes: ['nim', 'namaLengkap', 'emailKampus'],
      });

      if (!mahasiswaRef) {
        return res.status(404).json({ success: false, message: 'Mahasiswa dengan NIM tersebut tidak ditemukan.' });
      }
      // Jika ditemukan di referensi tapi belum punya akun di sistem, Anda bisa putuskan responsnya.
      // Untuk sekarang, kita anggap ini valid untuk ditampilkan namanya.
      return res.status(200).json({ 
        success: true,
        nim: mahasiswaRef.nim,
        namaLengkap: mahasiswaRef.namaLengkap,
        // Anda bisa tambahkan flag isRegistered: false jika mau
      });
    }

    // Jika ditemukan di tabel Mahasiswa (sudah punya akun)
    res.status(200).json({
      success: true,
      id: mahasiswa.id, // Kirim juga ID UUID jika ada
      nim: mahasiswa.nim,
      namaLengkap: mahasiswa.namaLengkap,
      // emailKampus: mahasiswa.emailKampus, // Opsional
      // isRegistered: true // Opsional
    });

  } catch (error) {
    console.error("Error di getMahasiswaInfoByNim:", error);
    next(error);
  }
};

// --- FUNGSI BARU UNTUK MENGAMBIL SEMUA KATEGORI PROYEK ---
exports.getAllKategori = async (req, res, next) => {
  try {
    const kategoriList = await Kategori.findAll({
      attributes: ['id_kategori', 'nama_kategori', 'deskripsi_kategori'], // Sesuaikan atribut yang ingin dikirim
      order: [['nama_kategori', 'ASC']],
    });
    res.status(200).json(kategoriList);
  } catch (error) {
    console.error("Error di getAllKategori:", error);
    next(error);
  }
};
