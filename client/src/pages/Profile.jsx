// src/pages/Profile.jsx
import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Loader, CustomButton } from '../components'; // Pastikan path ini benar
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Contoh Ikon (Anda bisa menggunakan SVG atau library ikon)
const ProfileSectionIcon = ({ children, colorClass = "text-[#4acd8d]" }) => (
  <div className={`p-3 bg-[#2c2f32] rounded-full mr-4 self-start ${colorClass}`}>
    {children}
  </div>
);

const ProfilePage = () => {
  const { user, isLoading: authIsLoading, authError } = useAuthContext();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState(null);
  const [isLoadingPageData, setIsLoadingPageData] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoadingPageData(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfileData(response.data);
      } catch (error) {
        console.error('Gagal mengambil data profil:', error);
      } finally {
        setIsLoadingPageData(false);
      }
    };

    if (user) fetchProfileData();
  }, [user]);

  if (authIsLoading || isLoadingPageData) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader message="Memuat profil Anda..." />
      </div>
    );
  }

  if (!user) {
    // ProtectedRoute seharusnya sudah menangani ini, tapi sebagai fallback
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

  const getStatusColor = (status) => {
    if (status === 'PENDANAAN_AKTIF') return 'text-blue-400';
    if (status && status.includes('SUKSES')) return 'text-green-400';
    if (status === 'DITOLAK') return 'text-red-400';
    return 'text-gray-400';
  };

  return (
    <div className="text-white p-4 md:p-0 animate-fadeIn space-y-8">
      
      {/* Bagian Informasi Akun Dasar */}
      <section className="bg-[#1c1c24] p-6 sm:p-8 rounded-xl shadow-2xl">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-[#2c2f32] flex items-center justify-center text-[#4acd8d] text-5xl font-bold shadow-md">
            {(user.namaLengkap || user.nama || "U").substring(0,1).toUpperCase()}
            {/* Atau ganti dengan <img src={user.avatarUrl || defaultUserIcon} alt="Avatar" className="w-full h-full rounded-full object-cover" /> */}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="font-epilogue font-bold text-2xl sm:text-3xl lg:text-4xl text-white leading-tight mb-1">
              {user.namaLengkap || user.nama}
            </h1>
            <p className="font-epilogue font-medium text-md text-[#4acd8d] capitalize mb-2">
              {user.role}
            </p>
            <p className="font-epilogue text-sm text-[#b2b3bd] mb-1 break-all" title={user.email}>Email: {user.email}</p>
            <p className="font-epilogue text-sm text-[#b2b3bd] mb-1 break-all" title={user.walletAddress}>Wallet: {user.walletAddress}</p>
            {user.role === 'mahasiswa' && user.nim && 
                <p className="font-epilogue text-sm text-[#b2b3bd]">NIM: {user.nim}</p>
            }
          </div>
          {/* <CustomButton title="Edit Profil" styles="bg-indigo-600 hover:bg-indigo-700 text-sm px-6 py-2 mt-4 sm:mt-0 self-start sm:self-center" handleClick={() => alert("Fitur edit profil segera hadir!")} /> */}
        </div>
      </section>

      {/* Konten Spesifik Peran */}
      {profileData && profileData.role === 'mahasiswa' && (
        <>
          {/* Statistik Mahasiswa */}
          <section className="bg-[#1c1c24] p-6 rounded-xl shadow-lg">
            <h2 className="font-epilogue font-semibold text-xl text-white mb-4 border-b border-gray-700 pb-3">Ringkasan Aktivitas Proyek</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div className="bg-[#2c2f32] p-4 rounded-lg text-center shadow">
                <p className="font-epilogue text-3xl font-bold text-[#4acd8d]">{profileData.totalSubmittedProjects}</p>
                <p className="font-epilogue text-xs text-[#808191] mt-1">Proyek Diajukan</p>
              </div>
              <div className="bg-[#2c2f32] p-4 rounded-lg text-center shadow">
                <p className="font-epilogue text-3xl font-bold text-blue-400">{profileData.totalActiveProjects}</p>
                <p className="font-epilogue text-xs text-[#808191] mt-1">Proyek Menggalang Dana</p>
              </div>
              <div className="bg-[#2c2f32] p-4 rounded-lg text-center shadow">
                <p className="font-epilogue text-3xl font-bold text-green-400">{`$USDT ${profileData.totalFundsRaised.toLocaleString('id-ID')}`}</p>
                <p className="font-epilogue text-xs text-[#808191] mt-1">Total Dana Terkumpul (dari Proyek Anda)</p>
              </div>
            </div>
          </section>

          {/* Proyek Terbaru Mahasiswa */}
          <section className="bg-[#1c1c24] p-6 rounded-xl shadow-lg">
            <h2 className="font-epilogue font-semibold text-xl text-white mb-4 border-b border-gray-700 pb-3">Proyek Terbaru Saya</h2>
            {profileData.latestProjects.length > 0 ? (
              <div className="space-y-4">
                {profileData.latestProjects.map(proyek => (
                  <div key={proyek.id} className="p-4 bg-[#2c2f32] rounded-lg flex justify-between items-center hover:bg-[#3a3a43] transition-colors">
                    <div>
                      <h3 className="font-epilogue font-semibold text-md text-white">{proyek.judul}</h3>
                      <p className={`font-epilogue text-xs font-medium ${getStatusColor(proyek.status)}`}>Status: {proyek.status.replace(/_/g, ' ')}</p>
                    </div>
                    <Link to={`/campaign-details/${proyek.id}`}>
                      <CustomButton title="Lihat Detail" styles="bg-blue-600 hover:bg-blue-700 text-xs px-3 py-1.5" />
                    </Link>
                  </div>
                ))}
                 <Link to="/my-projects" className="inline-block mt-4">
                    <CustomButton title="Lihat Semua Proyek Saya" styles="bg-gray-600 hover:bg-gray-700 text-sm" />
                </Link>
              </div>
            ) : <p className="font-epilogue text-sm text-[#808191]">Belum ada proyek yang diajukan.</p>}
          </section>
          
          {/* Riwayat Transaksi Mahasiswa */}
           <section className="bg-[#1c1c24] p-6 rounded-xl shadow-lg">
            <h2 className="font-epilogue font-semibold text-xl text-white mb-4 border-b border-gray-700 pb-3">Riwayat Transaksi Singkat</h2>
            {profileData.recentTransactions.length > 0 ? (
                <ul className="space-y-3">
                {profileData.recentTransactions.map((trx) => (
                    <li key={trx.id} className="p-3 bg-[#2c2f32] rounded-md text-sm">
                    <div className="flex justify-between items-center">
                        <span className={`font-epilogue font-medium ${trx.tipe.includes('MASUK') ? 'text-green-400' : 'text-red-400'}`}>{trx.tipe.replace(/_/g, ' ')}</span>
                        <span className="font-epilogue text-xs text-gray-400">{new Date(trx.createdAt).toLocaleDateString('id-ID')}</span>
                    </div>
                    <p className="font-epilogue text-[#b2b3bd] mt-1">{trx.txHash}</p>
                    <p className="font-epilogue font-semibold text-white text-right">{`$USDT ${trx.jumlah.toLocaleString('id-ID')}`}</p>
                    </li>
                ))}
                </ul>
            ) : <p className="font-epilogue text-sm text-[#808191]">Belum ada transaksi.</p>}
             <Link to="/history" className="inline-block mt-4">
                <CustomButton title="Lihat Semua Riwayat" styles="bg-gray-600 hover:bg-gray-700 text-sm" />
            </Link>
           </section>
        </>
      )}

      {profileData && profileData.role === 'donatur' && (
        <>
          <section className="bg-[#1c1c24] p-6 rounded-xl shadow-lg">
            <h2 className="font-epilogue font-semibold text-xl text-white mb-4 border-b border-gray-700 pb-3">Ringkasan Aktivitas Donasi</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-[#2c2f32] p-4 rounded-lg text-center shadow">
                <p className="font-epilogue text-3xl font-bold text-[#8c6dfd]">{`$USDT ${profileData.totalDonations.toLocaleString('id-ID')}`}</p>
                <p className="font-epilogue text-xs text-[#808191] mt-1">Total Donasi Diberikan</p>
              </div>
              <div className="bg-[#2c2f32] p-4 rounded-lg text-center shadow">
                <p className="font-epilogue text-3xl font-bold text-green-400">{profileData.supportedProjects}</p>
                <p className="font-epilogue text-xs text-[#808191] mt-1">Proyek Didukung</p>
              </div>
              <div className="bg-[#2c2f32] p-4 rounded-lg text-center shadow">
                <p className="font-epilogue text-3xl font-bold text-teal-400">{profileData.nftReceived}</p>
                <p className="font-epilogue text-xs text-[#808191] mt-1">NFT Reward Diterima</p>
              </div>
            </div>
          </section>

          <section className="bg-[#1c1c24] p-6 rounded-xl shadow-lg">
            <h2 className="font-epilogue font-semibold text-xl text-white mb-4 border-b border-gray-700 pb-3">Donasi Terbaru Anda</h2>
            {profileData.recentDonations.length > 0 ? (
                <div className="space-y-4">
                {profileData.recentDonations.map(donasi => (
                  <div key={donasi.id} className="p-4 bg-[#2c2f32] rounded-lg hover:bg-[#3a3a43] transition-colors">
                    <h3 className="font-epilogue font-semibold text-md text-white">{donasi.proyek.judul}</h3>
                    <p className="font-epilogue text-xs text-[#808191]">Jumlah: {`$USDT ${donasi.jumlah.toLocaleString('id-ID')}`}</p>
                  </div>
                ))}
                <Link to="/history" className="inline-block mt-4">
                    <CustomButton title="Lihat Semua Riwayat Donasi" styles="bg-gray-600 hover:bg-gray-700 text-sm" />
                </Link>
                </div>
            ) : <p className="font-epilogue text-sm text-[#808191]">Belum ada donasi.</p>}
          </section>
          {/* Anda bisa menambahkan bagian untuk menampilkan NFT di sini */}
        </>
      )}
      
      {profileData && profileData.role === 'admin' && (
         <section className="bg-[#1c1c24] p-6 rounded-xl shadow-lg">
            <h2 className="font-epilogue font-semibold text-xl text-white mb-4 border-b border-gray-700 pb-3">Ringkasan Sistem</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-[#2c2f32] p-4 rounded-lg text-center shadow">
                    <p className="font-epilogue text-3xl font-bold text-white">{profileData.totalActiveUsers}</p>
                    <p className="font-epilogue text-xs text-[#808191] mt-1">Pengguna Aktif</p>
                </div>
                <div className="bg-[#2c2f32] p-4 rounded-lg text-center shadow">
                    <p className="font-epilogue text-3xl font-bold text-white">{profileData.totalProjects}</p>
                    <p className="font-epilogue text-xs text-[#808191] mt-1">Total Proyek</p>
                </div>
                <div className="bg-[#2c2f32] p-4 rounded-lg text-center shadow">
                    <p className="font-epilogue text-3xl font-bold text-yellow-400">{profileData.projectsPendingReview}</p>
                    <p className="font-epilogue text-xs text-[#808191] mt-1">Proyek Review</p>
                </div>
                <div className="bg-[#2c2f32] p-4 rounded-lg text-center shadow">
                    <p className="font-epilogue text-3xl font-bold text-orange-400">{profileData.pendingWithdrawals}</p>
                    <p className="font-epilogue text-xs text-[#808191] mt-1">Pencairan Verifikasi</p>
                </div>
            </div>
            <div className="mt-6">
                <h3 className="font-epilogue font-semibold text-lg text-white mb-3">Aksi Cepat Admin</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {/* <Link to="/admin/users"><CustomButton title="Manajemen Pengguna" styles="w-full bg-orange-500 hover:bg-orange-600 text-sm" /></Link> */}
                    {/* <Link to="/admin/projects"><CustomButton title="Manajemen Proyek" styles="w-full bg-orange-500 hover:bg-orange-600 text-sm" /></Link> */}
                    <p className="text-sm text-yellow-400 col-span-full"><i>(Link ke fitur admin akan ditambahkan)</i></p>
                </div>
            </div>
         </section>
      )}

      {!['mahasiswa', 'donatur', 'admin'].includes(user.role) && (
        <p className="text-yellow-400 mt-6">Peran pengguna tidak dikenali: {user.role}</p>
      )}
    </div>
  );
};

export default ProfilePage;
