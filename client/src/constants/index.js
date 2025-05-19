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
    allowedRoles: ['mahasiswa', 'donatur', 'admin'], // Semua peran yang login bisa lihat dashboard
  },
  {
    name: 'Ajukan Proyek',
    imgUrl: campaignIcon,
    link: '/create-campaign',
    authRequired: true,
    allowedRoles: ['mahasiswa'], // Hanya mahasiswa
  },
  {
    name: 'Eksplorasi Proyek',
    imgUrl: searchIcon,
    link: '/explore-campaign',
    authRequired: true,
    allowedRoles: ['mahasiswa', 'donatur', 'admin'],
  },
  {
    name: 'Profil Saya',
    imgUrl: profileIcon,
    link: '/profile',
    authRequired: true,
    allowedRoles: ['mahasiswa', 'donatur', 'admin'],
  },
  {
    name: 'Logout',
    imgUrl: logoutIcon,
    link: '#',
    authRequired: true,
    allowedRoles: ['mahasiswa', 'donatur', 'admin'],
    isLogout: true,
  },
];

// Ekspor aset lain jika masih digunakan dari sini
export { appLogo, searchIcon as search, sunIcon as sun, profileIcon as userIcon }; 
// Mengganti 'thirdweb as userIcon' dengan 'profileIcon as userIcon' agar lebih jelas
