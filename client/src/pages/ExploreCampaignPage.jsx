// src/pages/ExploreCampaignPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { DisplayCampaigns, Loader, CustomButton } from '../components'; // Pastikan DisplayCampaigns diimpor
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const ExploreCampaignPage = () => {
  const { user, isLoading: authIsLoading } = useAuthContext();
  
  const [isLoadingPage, setIsLoadingPage] = useState(false); // State loading untuk data halaman ini
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');

  const [kategoriList, setKategoriList] = useState([]);
  const [selectedKategori, setSelectedKategori] = useState(''); // ID kategori yang dipilih
  const [sortBy, setSortBy] = useState('terbaru');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);
  const projectsPerPage = 9;

  // Fetch Kategori untuk filter
  useEffect(() => {
    const fetchKategori = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/data/kategori`);
        setKategoriList([{ id_kategori: '', nama_kategori: 'Semua Kategori' }, ...response.data] || [{ id_kategori: '', nama_kategori: 'Semua Kategori' }]);
      } catch (err) {
        console.error("Gagal mengambil data kategori:", err);
        // Tidak set error utama halaman, mungkin hanya log atau pesan kecil
      }
    };
    fetchKategori();
  }, []);

  // Fungsi untuk mengambil proyek dengan filter, sort, dan pagination
  const fetchActiveCampaigns = useCallback(async (pageToFetch) => {
    setIsLoadingPage(true);
    setError('');
    try {
      const params = {
        page: pageToFetch,
        limit: projectsPerPage,
        sort: sortBy,
      };
      // Hanya tambahkan kategoriId jika ada nilai yang dipilih (bukan string kosong)
      if (selectedKategori && selectedKategori !== '') {
        params.kategoriId = selectedKategori;
      }
      
      console.log("Fetching projects with params:", params); // Untuk debugging

      const response = await axios.get(`${API_BASE_URL}/projects/explore`, { params });
      setProjects(response.data.projects || []);
      setTotalPages(response.data.totalPages || 1);
      setCurrentPage(response.data.currentPage || 1);
      setTotalProjects(response.data.totalProjects || 0);
    } catch (err) {
      console.error("Gagal mengambil daftar proyek:", err);
      setError(err.response?.data?.message || "Tidak dapat memuat daftar proyek saat ini.");
      setProjects([]);
    } finally {
      setIsLoadingPage(false);
    }
  }, [selectedKategori, sortBy, projectsPerPage]); // currentPage dihapus dari dependensi di sini

  // useEffect untuk memanggil fetchActiveCampaigns saat filter atau sort berubah
  useEffect(() => {
    // Hanya fetch jika user sudah ada atau auth loading selesai (jika halaman bisa diakses publik)
    // dan fetchActiveCampaigns sudah terdefinisi
    if ((user || !authIsLoading) && fetchActiveCampaigns) {
        fetchActiveCampaigns(1); // Selalu fetch halaman pertama saat filter/sort berubah
    }
  }, [user, authIsLoading, selectedKategori, sortBy, fetchActiveCampaigns]);


  // Handler untuk perubahan filter dan sort
  const handleKategoriChange = (e) => {
    setSelectedKategori(e.target.value);
    setCurrentPage(1); // Reset ke halaman pertama
    // fetchActiveCampaigns(1) akan dipanggil oleh useEffect di atas
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setCurrentPage(1); // Reset ke halaman pertama
    // fetchActiveCampaigns(1) akan dipanggil oleh useEffect di atas
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      // setCurrentPage(newPage); // Ini akan memicu useEffect di atas jika currentPage ada di dependensinya
      // Lebih baik panggil fetch langsung untuk kontrol yang lebih baik
      fetchActiveCampaigns(newPage);
    }
  };
  
  // Jika AuthContext masih loading user awal dan belum ada user
  if (authIsLoading && !user) { 
    return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><Loader message="Memverifikasi sesi..." /></div>;
  }

  return (
    <div className="animate-fadeIn p-4 md:p-0">
      <div className="mb-8 p-6 bg-[#1c1c24] rounded-xl shadow-xl">
        <h1 className="font-epilogue font-bold text-2xl sm:text-3xl text-white leading-tight">
          Eksplorasi Proyek Pendanaan
        </h1>
        <p className="font-epilogue font-normal text-md text-[#b2b3bd] mt-2">
          Temukan dan dukung ide-ide inovatif dari mahasiswa IBIK! ({isLoadingPage ? 'Memuat...' : `${totalProjects} proyek ditemukan`})
        </p>
      </div>

      {/* Filter dan Sort */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8 p-4 bg-[#1c1c24] rounded-xl shadow">
        <div className="flex-1">
          <label htmlFor="kategoriFilter" className="block text-sm font-medium text-[#808191] mb-1">Filter Kategori:</label>
          <select 
            id="kategoriFilter" 
            value={selectedKategori} 
            onChange={handleKategoriChange}
            disabled={isLoadingPage}
            className="w-full py-2.5 px-3 bg-[#2c2f32] border border-[#3a3a43] text-white rounded-[10px] focus:ring-[#4acd8d] focus:border-[#4acd8d] text-sm"
          >
            {kategoriList.map(kat => (
              <option key={kat.id_kategori || 'all'} value={kat.id_kategori}>{kat.nama_kategori}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label htmlFor="sortFilter" className="block text-sm font-medium text-[#808191] mb-1">Urutkan Berdasarkan:</label>
          <select 
            id="sortFilter" 
            value={sortBy} 
            onChange={handleSortChange}
            disabled={isLoadingPage}
            className="w-full py-2.5 px-3 bg-[#2c2f32] border border-[#3a3a43] text-white rounded-[10px] focus:ring-[#4acd8d] focus:border-[#4acd8d] text-sm"
          >
            <option value="terbaru">Terbaru</option>
            <option value="terlama">Terlama</option>
            <option value="dana_terkumpul_desc">Dana Terkumpul (Tertinggi)</option>
            <option value="dana_terkumpul_asc">Dana Terkumpul (Terendah)</option>
            <option value="batas_waktu_asc">Batas Waktu (Terdekat)</option>
            <option value="batas_waktu_desc">Batas Waktu (Terjauh)</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-4 text-sm text-red-300 bg-red-700 bg-opacity-30 rounded-lg" role="alert">
          <span className="font-medium">Oops!</span> {error}
        </div>
      )}

      <DisplayCampaigns 
        title="" 
        isLoading={isLoadingPage} // Menggunakan isLoadingPage lokal
        campaigns={projects}
      />
      
      {!isLoadingPage && projects.length > 0 && totalPages > 1 && (
        <div className="flex justify-center items-center mt-10 space-x-3">
          <CustomButton 
            title="Sebelumnya"
            handleClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoadingPage}
            styles={`px-4 py-2 text-sm rounded-md ${currentPage === 1 || isLoadingPage ? 'bg-gray-700 opacity-50 cursor-not-allowed' : 'bg-[#8c6dfd] hover:bg-purple-600'}`}
          />
          <span className="font-epilogue text-white text-sm">
            Halaman {currentPage} dari {totalPages}
          </span>
          <CustomButton 
            title="Berikutnya"
            handleClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isLoadingPage}
            styles={`px-4 py-2 text-sm rounded-md ${currentPage === totalPages || isLoadingPage ? 'bg-gray-700 opacity-50 cursor-not-allowed' : 'bg-[#8c6dfd] hover:bg-purple-600'}`}
          />
        </div>
      )}

      {!isLoadingPage && !error && projects.length === 0 && (
        <div className="text-center mt-10 py-10 bg-[#1c1c24] rounded-xl">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-white font-epilogue">Tidak Ada Proyek Ditemukan</h3>
            <p className="mt-1 text-sm text-[#808191] font-epilogue">
                Coba ubah filter Anda atau kembali lagi nanti.
            </p>
            {user?.role === 'mahasiswa' && (
                <div className="mt-6">
                    <Link to="/create-campaign">
                        <CustomButton
                            title="Ajukan Proyek Anda!"
                            styles="bg-green-500 hover:bg-green-600"
                        />
                    </Link>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default ExploreCampaignPage;
