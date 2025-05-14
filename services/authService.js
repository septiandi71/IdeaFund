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

// --- REGISTRASI MAHASISWA ---
async function requestMahasiswaRegistrationOtp(data) {
  const { nim, emailKampus, id_prodi } = data;
  console.log(data);

  const mahasiswaRef = await MahasiswaReferensi.findOne({
    where: { nim },
    include: [{ model: Prodi, as: 'prodi', include: [{ model: Fakultas, as: 'fakultas' }] }]
  });

  if (!mahasiswaRef) throw new Error('NIM tidak terdaftar dalam data referensi.');
  if (mahasiswaRef.emailKampus.toLowerCase() !== emailKampus.toLowerCase()) {
    throw new Error('Email kampus tidak sesuai dengan data referensi NIM ini.');
  }
  if (mahasiswaRef.id_prodi !== parseInt(id_prodi)) {
    throw new Error('Program Studi tidak sesuai dengan data referensi NIM ini.');
  }

  const existingMahasiswaByNim = await Mahasiswa.findOne({ where: { nim } });
  if (existingMahasiswaByNim) throw new Error('NIM sudah terdaftar.');
  const existingMahasiswaByEmail = await Mahasiswa.findOne({ where: { emailKampus } });
  if (existingMahasiswaByEmail) throw new Error('Email kampus sudah terdaftar.');

  const otp = generateOtp();
  const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  const emailSent = await sendOtpEmail(mahasiswaRef.emailKampus, otp);
  if (!emailSent) throw new Error('Gagal mengirim OTP ke email kampus Anda.');

  return {
    message: 'OTP registrasi telah dikirim ke email kampus Anda.',
    tempRegData: { // Data ini akan disimpan di session oleh controller
      nim: mahasiswaRef.nim,
      namaLengkap: mahasiswaRef.namaLengkap,
      emailKampus: mahasiswaRef.emailKampus,
      id_prodi: mahasiswaRef.id_prodi,
      namaKelas: mahasiswaRef.namaKelas,
      tahunMasuk: mahasiswaRef.tahunMasuk,
      otp,
      otpExpiresAt: otpExpiresAt.toISOString() // Simpan sebagai ISO string
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
    id: crypto.randomUUID(), // Jika PK Mahasiswa adalah UUID
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
  return { message: 'Registrasi mahasiswa berhasil.', user: { id:newMahasiswa.id, nim: newMahasiswa.nim, email: newMahasiswa.emailKampus, role: 'mahasiswa', walletAddress: newMahasiswa.walletAddress } };
}

// --- REGISTRASI DONATUR & ADMIN ---
async function requestGenericUserRegistrationOtp(email, role) {
  const Model = role === 'donatur' ? Donatur : Admin;
  const existingUserByEmail = await Model.findOne({ where: { email } });
  if (existingUserByEmail) throw new Error(`Email sudah terdaftar sebagai ${role}.`);

  // Cek unik email lintas peran
  if (role === 'donatur') {
      const mhs = await Mahasiswa.findOne({where: {emailKampus: email}}); if(mhs) throw new Error('Email sudah terdaftar sebagai Mahasiswa.');
      const adm = await Admin.findOne({where: {email: email}}); if(adm) throw new Error('Email sudah terdaftar sebagai Admin.');
  } else if (role === 'admin') {
      const mhs = await Mahasiswa.findOne({where: {emailKampus: email}}); if(mhs) throw new Error('Email sudah terdaftar sebagai Mahasiswa.');
      const don = await Donatur.findOne({where: {email: email}}); if(don) throw new Error('Email sudah terdaftar sebagai Donatur.');
  }

  const otp = generateOtp();
  const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  const emailSent = await sendOtpEmail(email, otp);
  if (!emailSent) throw new Error('Gagal mengirim OTP ke email Anda.');

  return {
    message: 'OTP registrasi telah dikirim ke email Anda.',
    tempRegData: { email, role, otp, otpExpiresAt: otpExpiresAt.toISOString() }
  };
}

async function finalizeGenericUserRegistration(sessionData, otpInput, walletAddress, namaLengkap) {
  if (!sessionData || !sessionData.otp || !sessionData.otpExpiresAt || !sessionData.role || !sessionData.email) {
    throw new Error('Sesi registrasi tidak valid atau data tidak lengkap.');
  }
  if (otpInput !== sessionData.otp || new Date() > new Date(sessionData.otpExpiresAt)) {
    throw new Error('OTP salah atau sudah kedaluwarsa.');
  }

  const Model = sessionData.role === 'donatur' ? Donatur : Admin;

  const mhsByWallet = await Mahasiswa.findOne({ where: { walletAddress } });
  if (mhsByWallet) throw new Error('Alamat Wallet sudah terdaftar oleh Mahasiswa.');
  if (sessionData.role === 'donatur') {
      const admByWallet = await Admin.findOne({where: {walletAddress}}); if(admByWallet) throw new Error('Alamat Wallet sudah terdaftar sebagai Admin.');
  } else if (sessionData.role === 'admin') {
      const donByWallet = await Donatur.findOne({where: {walletAddress}}); if(donByWallet) throw new Error('Alamat Wallet sudah terdaftar sebagai Donatur.');
  }
  const existingUserByWallet = await Model.findOne({where: {walletAddress}});
  if(existingUserByWallet) throw new Error(`Alamat Wallet sudah terdaftar sebagai ${sessionData.role}.`);


  const newUser = await Model.create({
    // id akan di-generate otomatis oleh defaultValue: DataTypes.UUIDV4 di model
    nama: namaLengkap,
    email: sessionData.email,
    walletAddress,
    otp: null,
    otpExpiresAt: null,
  });
  return { 
    message: `Registrasi ${sessionData.role} berhasil.`, 
    user: { id: newUser.id, nama: newUser.nama, email: newUser.email, role: sessionData.role, walletAddress: newUser.walletAddress } 
  };
}

// --- LOGIN PENGGUNA (Wallet + OTP) ---
async function requestLoginOtp(walletAddress) {
  let user;
  let role;
  let emailTarget;

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
  const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await user.update({ otp, otpExpiresAt });

  const emailSent = await sendOtpEmail(emailTarget, otp);
  if (!emailSent) throw new Error('Gagal mengirim OTP ke email Anda.');
  
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
    userDataForToken = { id: user.id, nim: user.nim, walletAddress: user.walletAddress, role, email: user.emailKampus, nama: user.namaLengkap };
  } else {
    userDataForToken = { id: user.id, walletAddress: user.walletAddress, role, email: user.email, nama: user.nama };
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
  requestGenericUserRegistrationOtp,
  finalizeGenericUserRegistration,
  requestLoginOtp,
  verifyOtpAndLogin,
  logoutUser,
};