// ibik-crowdfund-backend/services/authService.js
const { Mahasiswa, Donatur, Admin, MahasiswaReferensi, Prodi, Fakultas, sequelize } = require('../models');
const { sendOtpEmail } = require('./emailService'); // Pastikan file ini ada dan benar
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
require('dotenv').config();

function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

const OTP_EXPIRY_MINUTES = 10; // Waktu kedaluwarsa OTP dalam menit
const OTP_RESEND_INTERVAL_SECONDS = 30; // Interval minimal untuk request OTP ulang

// --- REGISTRASI MAHASISWA ---
async function requestMahasiswaRegistrationOtp(data) {
  const { nim, id_prodi_input, id_fakultas_input } = data;

  if (!nim || !id_prodi_input || !id_fakultas_input) { // id_fakultas sekarang wajib
    throw new Error('NIM, ID Fakultas, dan ID Prodi harus diisi.');
  }

  const mahasiswaRef = await MahasiswaReferensi.findOne({
    where: { nim },
    include: [{
      model: Prodi,
      as: 'prodi', 
      where: { id_prodi: parseInt(id_prodi_input) }, // Validasi prodi saat query
      include: [{ 
        model: Fakultas, 
        as: 'fakultas',
        where: { id_fakultas: parseInt(id_fakultas_input) } // Validasi fakultas saat query
      }]
    }]
  });

  if (!mahasiswaRef) {
    throw new Error('Data NIM, Fakultas, atau Prodi tidak sesuai dengan data referensi.');
  }

  const existingMahasiswaByNim = await Mahasiswa.findOne({ where: { nim } });
  if (existingMahasiswaByNim) throw new Error('NIM sudah terdaftar di sistem aplikasi.');
  
  const existingMahasiswaByEmail = await Mahasiswa.findOne({ where: { emailKampus: mahasiswaRef.emailKampus } });
  if (existingMahasiswaByEmail) throw new Error('Email kampus yang terkait dengan NIM ini sudah terdaftar oleh pengguna lain.');

  const otp = generateOtp();
  const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  const emailKampusDariReferensi = mahasiswaRef.emailKampus;

  const emailSent = await sendOtpEmail(emailKampusDariReferensi, otp);
  if (!emailSent) throw new Error('Gagal mengirim OTP ke email kampus Anda.');

  return {
    message: `OTP registrasi telah dikirim ke ${emailKampusDariReferensi}.`,
    tempRegData: {
      nim: mahasiswaRef.nim,
      namaLengkap: mahasiswaRef.namaLengkap,
      emailKampus: emailKampusDariReferensi,
      id_prodi: mahasiswaRef.id_prodi,
      namaKelas: mahasiswaRef.namaKelas,
      tahunMasuk: mahasiswaRef.tahunMasuk,
      otp, // OTP asli untuk dicocokkan nanti
      otpExpiresAt: otpExpiresAt.toISOString(), // Simpan sebagai ISO string
      lastOtpRequestTime: new Date().toISOString() // Untuk interval
    }
  };
}

async function finalizeMahasiswaRegistration(sessionData, otpInput, walletAddress) {
  if (!sessionData || !sessionData.otp || !sessionData.otpExpiresAt) {
    throw new Error('Sesi registrasi tidak valid atau OTP belum diminta.');
  }
  if (otpInput !== sessionData.otp || new Date() > new Date(sessionData.otpExpiresAt)) {
    throw new Error('OTP salah atau sudah kedaluwarsa.');
  }

  // Cek keunikan walletAddress di semua tabel pengguna
  const mhsByWallet = await Mahasiswa.findOne({ where: { walletAddress } });
  if (mhsByWallet) throw new Error('Alamat Wallet sudah terdaftar oleh Mahasiswa.');
  const donByWallet = await Donatur.findOne({ where: { walletAddress } });
  if (donByWallet) throw new Error('Alamat Wallet sudah terdaftar oleh Donatur.');
  const admByWallet = await Admin.findOne({ where: { walletAddress } });
  if (admByWallet) throw new Error('Alamat Wallet sudah terdaftar oleh Admin.');

  const newMahasiswa = await Mahasiswa.create({
    id: crypto.randomUUID(), // PK UUID
    nim: sessionData.nim,
    namaLengkap: sessionData.namaLengkap,
    emailKampus: sessionData.emailKampus,
    walletAddress,
    id_prodi: sessionData.id_prodi,
    namaKelas: sessionData.namaKelas,
    tahunMasuk: sessionData.tahunMasuk,
    statusAktif: true,
    otp: null, 
    otpExpiresAt: null,
  });
  return { message: 'Registrasi mahasiswa berhasil.', user: { id:newMahasiswa.id, nim: newMahasiswa.nim, namaLengkap: newMahasiswa.namaLengkap, email: newMahasiswa.emailKampus, role: 'mahasiswa', walletAddress: newMahasiswa.walletAddress } };
}

// --- REGISTRASI DONATUR ---
async function requestDonaturRegistrationOtp(namaLengkap, email) {
  const existingDonaturByEmail = await Donatur.findOne({ where: { email } });
  if (existingDonaturByEmail) throw new Error(`Email sudah terdaftar sebagai donatur.`);
  
  const mhs = await Mahasiswa.findOne({where: {emailKampus: email}}); if(mhs) throw new Error('Email sudah terdaftar sebagai Mahasiswa.');
  const adm = await Admin.findOne({where: {email: email}}); if(adm) throw new Error('Email sudah terdaftar sebagai Admin.');

  const otp = generateOtp();
  const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  const emailSent = await sendOtpEmail(email, otp);
  if (!emailSent) throw new Error('Gagal mengirim OTP ke email Anda.');

  return {
    message: 'OTP registrasi telah dikirim ke email Anda.',
    tempRegData: { 
        namaLengkap,
        email, 
        role: 'donatur', 
        otp, 
        otpExpiresAt: otpExpiresAt.toISOString(), 
        lastOtpRequestTime: new Date().toISOString() 
    }
  };
}

async function finalizeDonaturRegistration(sessionData, otpInput, walletAddress) {
  if (!sessionData || !sessionData.otp || !sessionData.otpExpiresAt || sessionData.role !== 'donatur' || !sessionData.email || !sessionData.namaLengkap) {
    throw new Error('Sesi registrasi tidak valid atau data awal (nama/email) tidak lengkap.');
  }
  if (otpInput !== sessionData.otp || new Date() > new Date(sessionData.otpExpiresAt)) {
    throw new Error('OTP salah atau sudah kedaluwarsa.');
  }

  const mhsByWallet = await Mahasiswa.findOne({ where: { walletAddress } });
  if (mhsByWallet) throw new Error('Alamat Wallet sudah terdaftar oleh Mahasiswa.');
  const admByWallet = await Admin.findOne({where: {walletAddress}}); if(admByWallet) throw new Error('Alamat Wallet sudah terdaftar sebagai Admin.');
  const existingDonaturByWallet = await Donatur.findOne({where: {walletAddress}});
  if(existingDonaturByWallet) throw new Error(`Alamat Wallet sudah terdaftar sebagai Donatur.`);

  const newDonatur = await Donatur.create({
    id: crypto.randomUUID(), 
    namaLengkap: sessionData.namaLengkap, // Menggunakan namaLengkap
    email: sessionData.email,
    walletAddress,
    otp: null,
    otpExpiresAt: null,
  });
  return { 
      message: `Registrasi donatur berhasil.`, 
      user: { id: newDonatur.id, namaLengkap: newDonatur.namaLengkap, email: newDonatur.email, role: 'donatur', walletAddress: newDonatur.walletAddress } 
    };
}

// --- LOGIN PENGGUNA (Wallet + OTP untuk Mahasiswa, Donatur, Admin) ---
async function requestLoginOtp(walletAddress, session) {
  let user;
  let role;
  let emailTarget;
  let userIdentifier = `login_otp_req_${walletAddress}`; 

  if (session && session[userIdentifier] && session[userIdentifier].lastOtpRequestTime) {
    const lastReqTime = new Date(session[userIdentifier].lastOtpRequestTime).getTime();
    const currentTime = new Date().getTime();
    if ((currentTime - lastReqTime) < (OTP_RESEND_INTERVAL_SECONDS * 1000)) {
      const timeLeft = Math.ceil((OTP_RESEND_INTERVAL_SECONDS * 1000 - (currentTime - lastReqTime)) / 1000);
      throw new Error(`Harap tunggu ${timeLeft} detik sebelum meminta OTP baru.`);
    }
  }

  user = await Mahasiswa.findOne({ where: { walletAddress } });
  if (user) {
    if (!user.statusAktif) throw new Error('Akun Mahasiswa Anda tidak aktif.');
    role = 'mahasiswa';
    emailTarget = user.emailKampus;
  } else {
    user = await Donatur.findOne({ where: { walletAddress } });
    if (user) {
      role = 'donatur';
      emailTarget = user.email;
    } else {
      user = await Admin.findOne({ where: { walletAddress } });
      if (user) {
        role = 'admin';
        emailTarget = user.email;
      } else {
        throw new Error('Alamat wallet tidak terdaftar. Silakan registrasi.');
      }
    }
  }

  const otp = generateOtp();
  const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // OTP login berlaku 5 menit
  await user.update({ otp, otpExpiresAt });

  const emailSent = await sendOtpEmail(emailTarget, otp);
  if (!emailSent) throw new Error('Gagal mengirim OTP ke email Anda.');
  
  // Simpan waktu request OTP terakhir ke session untuk login
  if (session) {
      session[userIdentifier] = { lastOtpRequestTime: new Date().toISOString() };
  }
  
  return { message: 'OTP login telah dikirim ke email Anda.' };
}

async function verifyOtpAndLogin(walletAddress, otpInput) {
  let user;
  let role;
  let userDataForToken;

  user = await Mahasiswa.findOne({ where: { walletAddress } });
  if (user) {
    role = 'mahasiswa';
  } else {
    user = await Donatur.findOne({ where: { walletAddress } });
    if (user) {
      role = 'donatur';
    } else {
      user = await Admin.findOne({ where: { walletAddress } });
      if (user) {
        role = 'admin';
      } else {
        throw new Error('Pengguna dengan wallet ini tidak ditemukan.');
      }
    }
  }

  if (!user.otp || user.otp !== otpInput || new Date() > new Date(user.otpExpiresAt)) {
    if(user.otp) await user.update({ otp: null, otpExpiresAt: null });
    throw new Error('OTP salah atau sudah kedaluwarsa.');
  }
  await user.update({ otp: null, otpExpiresAt: null });

  if (role === 'mahasiswa') {
    userDataForToken = { id: user.id, nim: user.nim, walletAddress: user.walletAddress, role, email: user.emailKampus, namaLengkap: user.namaLengkap };
  } else { // Donatur atau Admin
    userDataForToken = { id: user.id, walletAddress: user.walletAddress, role, email: user.email, namaLengkap: user.namaLengkap }; // Gunakan namaLengkap
  }
  
  const token = jwt.sign(
    userDataForToken,
    process.env.JWT_SECRET,
    { expiresIn: '1d' } // Token berlaku 1 hari
  );

  return { message: "Login berhasil!", token, user: userDataForToken };
}

async function logoutUser(req) { // Terima req untuk akses session
    return new Promise((resolve, reject) => {
        if (req.session) {
            req.session.destroy(err => {
                if (err) {
                    console.error("Session destruction error:", err);
                    // Jangan reject, biarkan client tetap clear cookie
                    // return reject(new Error('Gagal logout sesi di server.'));
                }
                console.log("Session di server dihancurkan.");
                resolve({ message: 'Logout dari server berhasil.' });
            });
        } else {
            resolve({ message: 'Tidak ada sesi aktif di server untuk di-logout.' });
        }
    });
}

module.exports = {
  requestMahasiswaRegistrationOtp,
  finalizeMahasiswaRegistration,
  requestDonaturRegistrationOtp, // Menggunakan nama fungsi yang lebih spesifik
  finalizeDonaturRegistration, // Menggunakan nama fungsi yang lebih spesifik
  // Tidak ada fungsi registrasi Admin
  requestLoginOtp,
  verifyOtpAndLogin,
  logoutUser,
};
