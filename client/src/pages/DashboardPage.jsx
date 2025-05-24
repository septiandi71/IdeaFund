// src/pages/DashboardPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Loader, CustomButton } from '../components';
import axios from 'axios'; // Untuk mengambil data statistik dashboard

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Komponen untuk menampilkan satu kartu statistik
const StatCard = ({ title, value, icon, color = "text-white", iconBgColor = "bg-gray-700" }) => (
  <div className="bg-[#1c1c24] p-6 rounded-xl shadow-lg flex items-center hover:bg-[#2c2f32] transition-colors duration-300">
    <div className={`p-3 ${iconBgColor} rounded-full mr-4`}>
      {icon || <span className={`font-bold text-xl ${color}`}>?</span>}
    </div>
    <div>
      <p className="font-epilogue text-sm text-[#808191]">{title}</p>
      <p className={`font-epilogue font-bold text-2xl sm:text-3xl ${color}`}>{value}</p>
    </div>
  </div>
);

// Komponen Konten Dashboard Spesifik Peran
const MahasiswaDashboardContent = ({ user, navigate }) => {
  const [stats, setStats] = useState({
    proyekDiajukan: 0,
    proyekAktif: 0,
    danaTerkumpulTotal: "$USDT 0",
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoadingStats(true);
      try {
        const token = localStorage.getItem('token'); // Ambil token dari local storage
        const response = await axios.get(`${API_BASE_URL}/projects/dashboard-feed`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Update state dengan data dari backend
        setStats({
          proyekDiajukan: response.data.totalSubmittedProjects || 0,
          proyekAktif: response.data.totalActiveProjects || 0,
          danaTerkumpulTotal: `$USDT ${response.data.totalFundsRaised.toLocaleString('id-ID')}`,
        });
      } catch (error) {
        console.error("Gagal mengambil statistik mahasiswa:", error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    if (user) fetchStats();
  }, [user]);

  if (isLoadingStats) return <Loader message="Memuat statistik..." />;

  return (
    <div className="mt-8 space-y-8 animate-fadeInUp">
      <div className="grid md:grid-cols-3 gap-6">
        <StatCard
          title="Proyek Diajukan"
          value={stats.proyekDiajukan}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.134A48.664 48.664 0 0 0 12 3c-2.392 0-4.744.175-7.024.524C3.845 3.96 3 4.923 3 6.108V18.75c0 1.243.801 2.25 1.758 2.25H6.75m9.75-1.5h-3.75M15.75 9H18M15.75 12H18m-3.75 3H18M3.75 21v-6.375c0-.621.504-1.125 1.125-1.125H19.875c.621 0 1.125.504 1.125 1.125V21m-4.875-6.75h.008v.008h-.008v-.008Z" />
            </svg>
          }
          color="text-[#1dc071]"
          iconBgColor="bg-green-800/30"
        />
        <StatCard
          title="Proyek Aktif"
          value={stats.proyekAktif}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
            </svg>
          }
          color="text-blue-400"
          iconBgColor="bg-blue-800/30"
        />
        <StatCard
          title="Total Dana Terkumpul"
          value={stats.danaTerkumpulTotal}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6A2.25 2.25 0 0 0 .75 8.25v.75A2.25 2.25 0 0 0 3 11.25v.75a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 22.5 12v-.75a2.25 2.25 0 0 0-2.25-2.25h-1.106a2.251 2.251 0 0 0-2.146-.991l-.691.097a2.25 2.25 0 0 1-2.032-.756l-.016-.024a2.25 2.25 0 0 0-2.412-.71l-.203.048a1.125 1.125 0 0 1-1.03-1.579l.168-.603A2.25 2.25 0 0 0 9.75 3H3.75Z" />
            </svg>
          }
          color="text-purple-400"
          iconBgColor="bg-purple-800/30"
        />
      </div>

      <div className="bg-[#1c1c24] p-6 rounded-xl shadow-lg">
        <h3 className="font-epilogue font-semibold text-xl text-white mb-4">Aksi Cepat</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/create-campaign" className="flex-1">
            <CustomButton title="Ajukan Proyek Baru" styles="w-full bg-[#1dc071] hover:bg-green-600" />
          </Link>
          <Link to="/explore-campaign" className="flex-1">
            <CustomButton title="Kelola Proyek Saya" styles="w-full bg-blue-500 hover:bg-blue-600" />
          </Link>
          <Link to="/history" className="flex-1">
            <CustomButton title="Riwayat Transaksi" styles="w-full bg-gray-600 hover:bg-gray-700" />
          </Link>
        </div>
      </div>
    </div>
  );
};

const DonaturDashboardContent = ({ user, navigate }) => {
  const [stats, setStats] = useState({ totalDonasi: "$USDT 0", proyekDidukung: 0, nftDiterima: 0 });
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoadingStats(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/dashboard/donatur`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setStats({
          totalDonasi: `$USDT ${response.data.totalDonasi.toLocaleString('id-ID')}`,
          proyekDidukung: response.data.proyekDidukung || 0,
          nftDiterima: response.data.nftDiterima || 0,
        });
      } catch (error) {
        console.error('Gagal mengambil statistik donatur:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    if (user) fetchStats();
  }, [user]);

  if (isLoadingStats) return <Loader message="Memuat statistik donatur..." />;

  return (
    <div className="mt-8 space-y-8 animate-fadeInUp">
      <div className="grid md:grid-cols-3 gap-6">
        <StatCard
          title="Total Donasi Anda"
          value={stats.totalDonasi}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0H9.375m3.375 0A2.625 2.625 0 1 0 14.625 7.5M12 10.875v-3.375m0 0h3.375M12 10.875H9.375m1.5-3.375A2.625 2.625 0 1 1 12 4.875v0Z" />
            </svg>
          }
          color="text-[#8c6dfd]"
          iconBgColor="bg-purple-800/30"
        />
        <StatCard
          title="Proyek Didukung"
          value={stats.proyekDidukung}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296A3.745 3.745 0 0 1 16.5 21a3.745 3.745 0 0 1-2.86-1.336A3.746 3.746 0 0 1 12 21a3.746 3.746 0 0 1-1.64-.336A3.745 3.745 0 0 1 7.5 21a3.746 3.746 0 0 1-2.86-1.336A3.745 3.745 0 0 1 3 19.664V18a3 3 0 0 1 3-3h2.25m6.75 0h2.25a3 3 0 0 1 3 3v1.664a3.745 3.745 0 0 1-1.64-.336A3.745 3.745 0 0 1 16.5 21A3.745 3.745 0 0 1 13.64 19.664Zm-9.75 0h2.25" />
            </svg>
          }
          color="text-green-400"
          iconBgColor="bg-green-800/30"
        />
        <StatCard
          title="NFT Reward Diterima"
          value={stats.nftDiterima}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6A1.125 1.125 0 0 1 2.25 10.875v-3.75ZM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 0 1-1.125-1.125v-8.25ZM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 0 1-1.125-1.125v-2.25Z" />
            </svg>
          }
          color="text-teal-400"
          iconBgColor="bg-teal-800/30"
        />
      </div>
      <div className="bg-[#1c1c24] p-6 rounded-xl shadow-lg">
        <h3 className="font-epilogue font-semibold text-xl text-white mb-4">Aksi Cepat</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/explore" className="flex-1">
            <CustomButton title="Eksplorasi Proyek" styles="w-full bg-purple-500 hover:bg-purple-600" />
          </Link>
          <Link to="/history" className="flex-1">
            <CustomButton title="Riwayat Donasi Saya" styles="w-full bg-gray-600 hover:bg-gray-700" />
          </Link>
        </div>
      </div>
    </div>
  );
};

const AdminDashboardContent = ({ user, navigate }) => {
  const [stats, setStats] = useState({ totalPengguna: 0, totalProyek: 0, proyekReview: 0, pencairanVerif: 0 });
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoadingStats(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/dashboard/admin`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setStats({
          totalPengguna: response.data.totalPengguna || 0,
          totalProyek: response.data.totalProyek || 0,
          proyekReview: response.data.proyekReview || 0,
          pencairanVerif: response.data.pencairanVerif || 0,
        });
      } catch (error) {
        console.error('Gagal mengambil statistik admin:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };
    fetchStats();
  }, [user]);

  if (isLoadingStats || isLoadingProjects) return <Loader message="Memuat data..." />;

  return (
    <div className="mt-8 space-y-8 animate-fadeInUp">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Pengguna" value={stats.totalPengguna} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372M6.75 19.128a9.38 9.38 0 0 1 2.625.372m0 0a9.38 9.38 0 0 0 2.625.372M6.75 19.128A9.38 9.38 0 0 1 5.25 18.75m0 0A9.38 9.38 0 0 1 3.75 15m0 0A9.38 9.38 0 0 1 2.25 11.25m13.5 7.878A9.381 9.381 0 0 1 18.75 15m0 0A9.38 9.38 0 0 1 20.25 11.25m1.5 0A2.25 2.25 0 0 0 20.25 9V7.5A2.25 2.25 0 0 0 18 5.25H6A2.25 2.25 0 0 0 3.75 7.5V9A2.25 2.25 0 0 0 6 11.25m1.5 0h9.75" /></svg>} color="text-white" iconBgColor="bg-gray-700"/>
        <StatCard title="Total Proyek" value={stats.totalProyek} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.75h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>} color="text-white" iconBgColor="bg-gray-700"/>
        <StatCard title="Proyek Perlu Review" value={stats.proyekReview} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 0 1 9 9v.375M10.125 2.25A3.375 3.375 0 0 1 13.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 0 1 3.375 3.375M9 15l2.25 2.25L15 12" /></svg>} color="text-yellow-400" iconBgColor="bg-yellow-800/30"/>
        <StatCard title="Pencairan Perlu Verifikasi" value={stats.pencairanVerif} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.791-.065-1.668-.12-2.552-.12C4.496 3.716 2.25 5.48 2.25 7.875c0 1.988 1.628 3.224 3.914 4.069.66.243 1.156.243 1.817 0A4.5 4.5 0 0 1 12 13.5M12 13.5v7.5M11.35 3.836c.313-.023.626-.039.95-.048.791-.023 1.557.023 2.25.108.636.077 1.217.214 1.739.408M11.35 3.836c-.16.08-.313.168-.457.264m.457-.264c.051.02.1.042.15.064M8.25 15.75h7.5M12 7.5h.008v.008H12V7.5Z" /></svg>} color="text-orange-400" iconBgColor="bg-orange-800/30"/>
      </div>

 
    </div>
  );
};

const DashboardPage = () => {
  const { user, isLoading: authIsLoading, authError } = useAuthContext();
  const navigate = useNavigate();

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
  
  if (!user) {
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
    <div className="text-white p-4 md:p-0 animate-fadeIn"> 
      <div className="mb-8 p-6 bg-[#1c1c24] rounded-xl shadow-xl animate-fadeInUp animation-delay-200">
        <h1 className="font-epilogue font-bold text-2xl sm:text-3xl lg:text-4xl leading-tight">
          Dashboard {user.role === 'mahasiswa' ? 'Mahasiswa' : user.role === 'donatur' ? 'Donatur' : 'Admin'}
        </h1>
        <p className="font-epilogue font-normal text-md text-[#b2b3bd] mt-1">
          Selamat datang kembali, <span className="font-semibold text-white">{user.namaLengkap || user.nama}</span>!
        </p>
      </div>
      
      {user.role === 'mahasiswa' && <MahasiswaDashboardContent user={user} navigate={navigate} />}
      {user.role === 'donatur' && <DonaturDashboardContent user={user} navigate={navigate} />}
      {user.role === 'admin' && <AdminDashboardContent user={user} navigate={navigate} />}

      {!['mahasiswa', 'donatur', 'admin'].includes(user.role) && (
        <p className="text-yellow-400 mt-6">Peran pengguna tidak dikenali: {user.role}</p>
      )}
    </div>
  );
};

export default DashboardPage;
