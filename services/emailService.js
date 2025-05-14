// services/emailService.js
require('dotenv').config(); // Untuk memuat variabel dari .env
const nodemailer = require('nodemailer');

// Konfigurasi transporter Nodemailer
// Pastikan variabel EMAIL_SERVICE, EMAIL_USER, dan EMAIL_PASS sudah di-set di file .env Anda
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail', // Default ke 'gmail' jika tidak diset
  auth: {
    user: process.env.EMAIL_USER, // Alamat email pengirim Anda
    pass: process.env.EMAIL_PASS, // Password email Anda atau App Password jika menggunakan Gmail
  },
  // Tambahkan opsi TLS untuk beberapa provider atau jika ada masalah SSL/TLS
  // tls: {
  //   rejectUnauthorized: false // Hanya untuk development jika ada masalah sertifikat, jangan di produksi
  // }
});

/**
 * Mengirim email berisi kode OTP ke alamat email tujuan.
 * @param {string} toEmail - Alamat email penerima.
 * @param {string} otp - Kode OTP yang akan dikirim.
 * @returns {Promise<boolean>} - Mengembalikan true jika email berhasil dikirim, false jika gagal.
 */
async function sendOtpEmail(toEmail, otp) {
  const mailOptions = {
    from: `"IBIK IdeaFund Notifikasi" <${process.env.EMAIL_USER}>`, // Nama Pengirim <alamat email pengirim>
    to: toEmail,
    subject: 'Kode OTP Verifikasi Anda - IBIK IdeaFund',
    text: `Kode OTP Anda adalah: ${otp}. Kode ini berlaku selama beberapa menit. Mohon jangan berikan kode ini kepada siapa pun.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #333;">Verifikasi Akun IBIK IdeaFund Anda</h2>
        <p>Terima kasih telah menggunakan IBIK IdeaFund.</p>
        <p>Kode OTP Anda adalah: <strong style="font-size: 1.2em; color: #007bff;">${otp}</strong></p>
        <p>Kode ini hanya berlaku selama beberapa menit (sesuai pengaturan sistem, biasanya 5 atau 10 menit). Mohon jangan berikan kode ini kepada siapa pun untuk menjaga keamanan akun Anda.</p>
        <p>Jika Anda tidak meminta kode ini, abaikan email ini.</p>
        <br/>
        <p>Salam,</p>
        <p>IBIK IdeaFund</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email OTP berhasil dikirim ke: ${toEmail}`);
    return true;
  } catch (error) {
    console.error(`Error mengirim email OTP ke ${toEmail}:`, error);
    // Anda bisa throw error di sini agar bisa ditangkap oleh service pemanggil
    // throw new Error('Gagal mengirim email OTP.');
    return false; // Atau return false untuk ditangani secara spesifik di service pemanggil
  }
}

module.exports = { sendOtpEmail };