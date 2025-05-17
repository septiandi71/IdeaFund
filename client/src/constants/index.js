// src/constants/index.js

// Impor ikon Anda di sini. Pastikan path dan nama file sudah benar.
// Saya menggunakan nama placeholder, sesuaikan dengan aset Anda.
import { 
    dashboard as dashboardIcon, 
    createCampaign as campaignIcon, 
    profile as profileIcon, 
    logout as logoutIcon, 
    sun as sunIcon, // Jika masih dipakai
    logo as appLogo, // Logo aplikasi Anda
    search as searchIcon,
    
    // Tambahkan ikon lain jika perlu:
    // import exploreIcon from '../assets/explore.svg';
    // import historyIcon from '../assets/history.svg';
    // import usersIcon from '../assets/users.svg'; // Untuk admin
    // import verifyIcon from '../assets/verify.svg'; // Untuk admin
} from '../assets';

// Definisikan navlinks yang lebih terstruktur
// 'roles' bisa berisi: ['all_logged_in'], ['guest'], ['mahasiswa'], ['donatur'], ['admin']
// 'authRequired': true jika butuh login, false jika tidak (untuk link guest)

export const navlinks = [
  {
    name: 'Dashboard',
    imgUrl: dashboardIcon,
    link: '/dashboard',
    authRequired: true,
    roles: ['mahasiswa', 'donatur', 'admin'], // Semua peran yang login bisa lihat dashboard
  },
  {
    name: 'Ajukan Proyek',
    imgUrl: campaignIcon,
    link: '/create-campaign',
    authRequired: true,
    roles: ['mahasiswa'], // Hanya mahasiswa
  },
  {
    name: 'Eksplorasi Proyek',
    // imgUrl: exploreIcon || searchIcon, // Ganti dengan ikon yang sesuai
    imgUrl: searchIcon, // Menggunakan ikon search untuk sementara
    link: '/explore-campaign', // Halaman utama akan jadi tempat eksplorasi untuk user login
    authRequired: true,
    roles: ['mahasiswa', 'donatur', 'admin'],
  },
  {
    name: 'Profil Saya',
    imgUrl: profileIcon,
    link: '/profile', // Halaman profil akan menampilkan info, proyek saya (Mhs), riwayat donasi (Donatur)
    authRequired: true,
    roles: ['mahasiswa', 'donatur', 'admin'],
  },
  // Contoh untuk Admin (jika Anda ingin menambahkannya nanti)
  // {
  //   name: 'Manajemen Pengguna',
  //   imgUrl: usersIcon,
  //   link: '/admin/users',
  //   authRequired: true,
  //   roles: ['admin'],
  // },
  // {
  //   name: 'Verifikasi Proyek',
  //   imgUrl: verifyIcon,
  //   link: '/admin/verifications',
  //   authRequired: true,
  //   roles: ['admin'],
  // },
  {
    name: 'Logout',
    imgUrl: logoutIcon,
    link: '#', // Tidak ada navigasi link, hanya aksi
    authRequired: true,
    roles: ['mahasiswa', 'donatur', 'admin'], 
    isLogout: true, // Penanda khusus untuk aksi logout
  },
  // Link untuk Guest (jika ingin ditampilkan di mobile drawer Navbar saat belum login)
  // {
  //   name: 'Login',
  //   imgUrl: loginIcon, // Anda perlu ikon ini
  //   link: '/login',
  //   authRequired: false,
  //   roles: ['guest'],
  // },
  // {
  //   name: 'Registrasi',
  //   imgUrl: registerIcon, // Anda perlu ikon ini
  //   link: '/register-options',
  //   authRequired: false,
  //   roles: ['guest'],
  // },
];

// Ekspor aset lain jika masih digunakan dari sini
export { appLogo, searchIcon as search, sunIcon as sun, profileIcon as userIcon }; 
// Mengganti 'thirdweb as userIcon' dengan 'profileIcon as userIcon' agar lebih jelas
