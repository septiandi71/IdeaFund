// services/authService.js
const { Mahasiswa, Donatur, Admin, MahasiswaReferensi, Prodi, Fakultas, sequelize } = require('../models');
const { sendOtpEmail } = require('./emailService');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
require('dotenv').config();

function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

const OTP_EXPIRY_MINUTES = 10;
const OTP_RESEND_INTERVAL_SECONDS = 30;

// --- REGISTRASI MAHASISWA --- (Tetap sama seperti versi terakhir yang sudah benar)
async function requestMahasiswaRegistrationOtp(data) {
  const { nim, id_prodi_input } = data;

  if (!nim || !id_prodi_input) {
    throw new Error('NIM dan Program Studi harus diisi.');
  }

  const mahasiswaRef = await MahasiswaReferensi.findOne({
    where: { nim },
    include: [{ model: Prodi, as: 'prodi', include: [{ model: Fakultas, as: 'fakultas' }] }]
  });

  if (!mahasiswaRef) throw new Error('NIM tidak terdaftar dalam data referensi.');
  if (mahasiswaRef.id_prodi !== parseInt(id_prodi_input)) {
    throw new Error('Program Studi yang dipilih tidak sesuai dengan data referensi untuk NIM ini.');
  }

  const existingMahasiswaByNim = await Mahasiswa.findOne({ where: { nim } });
  if (existingMahasiswaByNim) throw new Error('NIM sudah terdaftar.');
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
      otp,
      otpExpiresAt: otpExpiresAt.toISOString(),
      lastOtpRequestTime: new Date().toISOString()
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

  const mhsByWallet = await Mahasiswa.findOne({ where: { walletAddress } });
  if (mhsByWallet) throw new Error('Alamat Wallet sudah terdaftar oleh Mahasiswa.');
  const donByWallet = await Donatur.findOne({ where: { walletAddress } });
  if (donByWallet) throw new Error('Alamat Wallet sudah terdaftar oleh Donatur.');
  const admByWallet = await Admin.findOne({ where: { walletAddress } });
  if (admByWallet) throw new Error('Alamat Wallet sudah terdaftar oleh Admin.');

  const newMahasiswa = await Mahasiswa.create({
    id: crypto.randomUUID(),
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


// --- REGISTRASI DONATUR & ADMIN (PENYESUAIAN ALUR INPUT & FIELD NAMA) ---
// Tahap 1: Input Nama & Email, Kirim OTP
async function requestGenericUserRegistrationOtp(namaLengkap, email, role) { // Terima namaLengkap di sini
  const Model = role === 'donatur' ? Donatur : Admin;
  
  const existingUserByEmail = await Model.findOne({ where: { email } });
  if (existingUserByEmail) throw new Error(`Email sudah terdaftar sebagai ${role}.`);
  
  // Cek unik email lintas peran
  if (role === 'donatur') {
      const mhs = await Mahasiswa.findOne({where: {emailKampus: email}}); if(mhs) throw new Error('Email sudah terdaftar sebagai Mahasiswa.');
      const adm = await Admin.findOne({where: {email: email}}); if(adm) throw new Error('Email sudah terdaftar sebagai Admin.');
  } else if (role === 'admin') { // Jika ada registrasi Admin, sekarang tidak ada
      // const mhs = await Mahasiswa.findOne({where: {emailKampus: email}}); if(mhs) throw new Error('Email sudah terdaftar sebagai Mahasiswa.');
      // const don = await Donatur.findOne({where: {email: email}}); if(don) throw new Error('Email sudah terdaftar sebagai Donatur.');
  }


  const otp = generateOtp();
  const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  const emailSent = await sendOtpEmail(email, otp);
  if (!emailSent) throw new Error('Gagal mengirim OTP ke email Anda.');

  return {
    message: 'OTP registrasi telah dikirim ke email Anda.',
    tempRegData: { 
        namaLengkap, // Simpan namaLengkap dari input awal
        email, 
        role, 
        otp, 
        otpExpiresAt: otpExpiresAt.toISOString(), 
        lastOtpRequestTime: new Date().toISOString() 
    }
  };
}

// Tahap 2: Finalisasi Registrasi Donatur/Admin dengan OTP & Wallet (Nama diambil dari session)
async function finalizeGenericUserRegistration(sessionData, otpInput, walletAddress) { // Tidak perlu namaLengkap lagi di sini
  if (!sessionData || !sessionData.otp || !sessionData.otpExpiresAt || !sessionData.role || !sessionData.email || !sessionData.namaLengkap) {
    throw new Error('Sesi registrasi tidak valid atau data awal (nama/email) tidak lengkap.');
  }
  if (otpInput !== sessionData.otp || new Date() > new Date(sessionData.otpExpiresAt)) {
    throw new Error('OTP salah atau sudah kedaluwarsa.');
  }

  const Model = sessionData.role === 'donatur' ? Donatur : Admin;

  const mhsByWallet = await Mahasiswa.findOne({ where: { walletAddress } });
  if (mhsByWallet) throw new Error('Alamat Wallet sudah terdaftar oleh Mahasiswa.');
  if (sessionData.role === 'donatur') {
      const admByWallet = await Admin.findOne({where: {walletAddress}}); if(admByWallet) throw new Error('Alamat Wallet sudah terdaftar sebagai Admin.');
  } else if (sessionData.role === 'admin') { // Jika ada registrasi Admin
      // const donByWallet = await Donatur.findOne({where: {walletAddress}}); if(donByWallet) throw new Error('Alamat Wallet sudah terdaftar sebagai Donatur.');
  }
  const existingUserByWallet = await Model.findOne({where: {walletAddress}});
  if(existingUserByWallet) throw new Error(`Alamat Wallet sudah terdaftar sebagai ${sessionData.role}.`);


  const newUser = await Model.create({
    id: crypto.randomUUID(), 
    namaLengkap: sessionData.namaLengkap, // <<< GUNAKAN namaLengkap
    email: sessionData.email,
    walletAddress,
    otp: null,
    otpExpiresAt: null,
  });
  return { 
      message: `Registrasi ${sessionData.role} berhasil.`, 
      user: { id: newUser.id, namaLengkap: newUser.namaLengkap, email: newUser.email, role: sessionData.role, walletAddress: newUser.walletAddress } // Kirim namaLengkap
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
      user = await Admin.findOne({ where: { walletAddress } }); // Admin login via Wallet+OTP
      if (user) {
        role = 'admin';
        emailTarget = user.email;
      } else {
        throw new Error('Alamat wallet tidak terdaftar. Silakan registrasi.');
      }
    }
  }

  const otp = generateOtp();
  const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await user.update({ otp, otpExpiresAt });

  const emailSent = await sendOtpEmail(emailTarget, otp);
  if (!emailSent) throw new Error('Gagal mengirim OTP ke email Anda.');
  
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

  // Menyiapkan payload untuk JWT
  if (role === 'mahasiswa') {
    userDataForToken = { id: user.id, nim: user.nim, walletAddress: user.walletAddress, role, email: user.emailKampus, namaLengkap: user.namaLengkap }; // <<< namaLengkap
  } else { // Donatur atau Admin
    userDataForToken = { id: user.id, walletAddress: user.walletAddress, role, email: user.email, namaLengkap: user.namaLengkap }; // <<< namaLengkap
  }
  
  const token = jwt.sign(
    userDataForToken,
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  return { message: "Login berhasil!", token, user: userDataForToken };
}

async function logoutUser(req) {
    return new Promise((resolve, reject) => {
        if (req.session) {
            req.session.destroy(err => {
                if (err) {
                    console.error("Session destruction error:", err);
                    return reject(new Error('Gagal logout sesi.'));
                }
                resolve({ message: 'Logout berhasil.' });
            });
        } else {
            resolve({ message: 'Tidak ada sesi aktif untuk logout.' });
        }
    });
}

module.exports = {
  requestMahasiswaRegistrationOtp,
  finalizeMahasiswaRegistration,
  requestGenericUserRegistrationOtp, // Ini akan dipakai Donatur
  finalizeGenericUserRegistration, // Ini akan dipakai Donatur
  // Fungsi registrasi Admin tidak ada lagi
  requestLoginOtp,
  verifyOtpAndLogin,
  logoutUser,
};