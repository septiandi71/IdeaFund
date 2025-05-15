// src/pages/DashboardPage.jsx
import React, { useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Loader, CustomButton } from '../components';
// Impor ikon jika Anda punya (misalnya dari Heroicons atau aset Anda)
// import { UserCircleIcon, DocumentPlusIcon, EyeIcon, CogIcon, UsersIcon, ChartBarIcon } from '@heroicons/react/24/outline';

// Komponen Konten Dashboard Spesifik Peran yang lebih menarik
const MahasiswaDashboardContent = ({ user }) => (
  <div className="mt-8 grid md:grid-cols-2 gap-6 animate-fadeInUp">
    <div className="bg-[#1c1c24] p-6 rounded-xl shadow-lg hover:shadow-purple-500/30 transition-shadow">
      {/* <DocumentPlusIcon className="w-12 h-12 text-[#1dc071] mb-3" /> */}
      <div className="text-[#1dc071] text-4xl mb-3">📝</div>
      <h3 className="font-epilogue font-semibold text-xl text-white mb-2">Ajukan Proyek Baru</h3>
      <p className="font-epilogue font-normal text-sm text-[#808191] mb-4">
        Punya ide brilian? Segera ajukan proposal proyek Anda dan dapatkan pendanaan untuk mewujudkannya!
      </p>
      <Link to="/create-campaign">
        <CustomButton title="Mulai Ajukan" styles="w-full bg-[#1dc071] hover:bg-green-600" />
      </Link>
    </div>
    <div className="bg-[#1c1c24] p-6 rounded-xl shadow-lg hover:shadow-blue-500/30 transition-shadow">
      {/* <EyeIcon className="w-12 h-12 text-blue-500 mb-3" /> */}
      <div className="text-blue-500 text-4xl mb-3">👀</div>
      <h3 className="font-epilogue font-semibold text-xl text-white mb-2">Proyek Saya</h3>
      <p className="font-epilogue font-normal text-sm text-[#808191] mb-4">
        Pantau progres pendanaan, perbarui milestone, dan kelola semua proyek yang telah Anda ajukan.
      </p>
      <Link to="/profile">
        <CustomButton title="Lihat Proyek Saya" styles="w-full bg-blue-500 hover:bg-blue-600" />
      </Link>
    </div>
  </div>
);

const DonaturDashboardContent = ({ user }) => (
  <div className="mt-8 grid md:grid-cols-2 gap-6 animate-fadeInUp">
    <div className="bg-[#1c1c24] p-6 rounded-xl shadow-lg hover:shadow-purple-500/30 transition-shadow">
      {/* <MagnifyingGlassIcon className="w-12 h-12 text-purple-500 mb-3" /> */}
      <div className="text-purple-500 text-4xl mb-3">🔍</div>
      <h3 className="font-epilogue font-semibold text-xl text-white mb-2">Eksplorasi Proyek</h3>
      <p className="font-epilogue font-normal text-sm text-[#808191] mb-4">
        Temukan berbagai proyek inovatif dari mahasiswa IBIK yang membutuhkan dukungan Anda.
      </p>
      <Link to="/">
        <CustomButton title="Mulai Eksplorasi" styles="w-full bg-purple-500 hover:bg-purple-600" />
      </Link>
    </div>
    <div className="bg-[#1c1c24] p-6 rounded-xl shadow-lg hover:shadow-teal-500/30 transition-shadow">
      {/* <ClockIcon className="w-12 h-12 text-teal-500 mb-3" /> */}
      <div className="text-teal-500 text-4xl mb-3">📜</div>
      <h3 className="font-epilogue font-semibold text-xl text-white mb-2">Riwayat Donasi</h3>
      <p className="font-epilogue font-normal text-sm text-[#808191] mb-4">
        Lihat kembali semua proyek yang telah Anda dukung dan kontribusi yang telah Anda berikan.
      </p>
       <Link to="/profile">
        <CustomButton title="Lihat Riwayat Saya" styles="w-full bg-teal-500 hover:bg-teal-600" />
      </Link>
    </div>
  </div>
);

const AdminDashboardContent = ({ user }) => (
  <div className="mt-8 bg-[#1c1c24] p-6 rounded-xl shadow-lg animate-fadeInUp">
    {/* <Cog8ToothIcon className="w-12 h-12 text-yellow-500 mb-3" /> */}
    <div className="text-yellow-500 text-4xl mb-3">⚙️</div>
    <h2 className="font-epilogue font-semibold text-xl text-white mb-2">Panel Administrasi</h2>
    <p className="font-epilogue font-normal text-md text-[#b2b3bd] mb-4">
      Akses fitur pengelolaan pengguna, verifikasi proyek, manajemen kategori, dan pemantauan aktivitas sistem.
    </p>
    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {/* Contoh Tombol Aksi Admin */}
        {/* <Link to="/admin/users"><CustomButton title="Manajemen Pengguna" styles="w-full bg-orange-500 hover:bg-orange-600" /></Link> */}
        {/* <Link to="/admin/projects-verification"><CustomButton title="Verifikasi Proyek" styles="w-full bg-orange-500 hover:bg-orange-600" /></Link> */}
        {/* <Link to="/admin/categories"><CustomButton title="Manajemen Kategori" styles="w-full bg-orange-500 hover:bg-orange-600" /></Link> */}
         <p className="text-sm text-yellow-400 col-span-full"><i>(Link ke fitur spesifik admin akan ditambahkan di sini)</i></p>
    </div>
  </div>
);

const DashboardPage = () => {
  const { user, isLoading: authIsLoading, authError } = useAuthContext();

  useEffect(() => {
    console.log("DashboardPage: User:", user, "isLoading:", authIsLoading, "Error:", authError);
  }, [user, authIsLoading, authError]);

  if (authIsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader message="Memuat data pengguna..." />
      </div>
    );
  }
  
  if (!user) { // Jika setelah loading selesai user tetap null (termasuk jika ada authError)
    // ProtectedRoute seharusnya sudah redirect ke /login, ini sebagai fallback
    return (
      <div className="text-white text-center mt-10 p-6 animate-fadeInUp">
        <h2 className="font-epilogue font-bold text-xl mb-3">Akses Ditolak</h2>
        <p className="font-epilogue text-sm text-red-300 mb-4">{authError || "Sesi tidak valid atau Anda belum login."}</p>
        <Link to="/login">
            <CustomButton title="Kembali ke Halaman Login" styles="bg-blue-500 hover:bg-blue-600" />
        </Link>
      </div>
    );
  }

  return (
    <div className="text-white p-4 md:p-0 animate-fadeIn"> {/* Hapus padding jika layout sudah menangani */}
      <div className="mb-8 p-6 bg-[#1c1c24] rounded-xl shadow-xl animate-fadeInUp animation-delay-200">
        <h1 className="font-epilogue font-bold text-2xl sm:text-3xl lg:text-4xl leading-tight mb-3">
          Selamat Datang, {user.namaLengkap || user.nama}!
        </h1>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#b2b3bd]">
            <p><strong>Peran:</strong> <span className="font-semibold text-[#4acd8d] capitalize">{user.role}</span></p>
            <p><strong>Email:</strong> {user.email}</p>
            <p className="break-all"><strong>Wallet:</strong> {user.walletAddress}</p>
            {user.role === 'mahasiswa' && user.nim && 
                <p><strong>NIM:</strong> {user.nim}</p>
            }
        </div>
      </div>
      
      {user.role === 'mahasiswa' && <MahasiswaDashboardContent user={user} />}
      {user.role === 'donatur' && <DonaturDashboardContent user={user} />}
      {user.role === 'admin' && <AdminDashboardContent user={user} />}

      {!['mahasiswa', 'donatur', 'admin'].includes(user.role) && (
        <p className="text-yellow-400 mt-6 animate-fadeInUp animation-delay-400">Peran pengguna tidak dikenali: {user.role}</p>
      )}
    </div>
  );
};

export default DashboardPage;
