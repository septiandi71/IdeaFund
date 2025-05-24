// src/pages/ExploreCampaignPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { Loader, CustomButton, ProjectCard } from '../components';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ExploreCampaignPage = () => {
  const navigate = useNavigate();
  const { user, isLoading: authIsLoading } = useAuthContext();

  const [projects, setProjects] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [selectedKategori, setSelectedKategori] = useState('');
  const [sortBy, setSortBy] = useState('terbaru');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const projectsPerPage = 6;

  // Fetch kategori
  useEffect(() => {
    const fetchKategori = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/data/kategori`);
        setKategoriList([{ id_kategori: '', nama_kategori: 'Semua Kategori' }, ...response.data]);
      } catch (err) {
        console.error('Gagal mengambil data kategori:', err);
      }
    };
    fetchKategori();
  }, []);

  // Fetch projects
  const fetchProjects = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError('');
    try {
      const params = { 
        page, 
        limit: projectsPerPage, 
        sort: sortBy, 
        kategoriId: selectedKategori, 
        status: user.role === 'admin' ? statusFilter : undefined,
      };

      const response = await axios.get(`${API_BASE_URL}/projects/explore`, { params });
      setProjects(response.data.projects || []);
      setTotalPages(response.data.totalPages || 1);
      setCurrentPage(response.data.currentPage || 1);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err.response?.data?.message || 'Tidak dapat memuat daftar proyek.');
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedKategori, sortBy, statusFilter, projectsPerPage, user.role]);

  useEffect(() => {
    fetchProjects(1);
  }, [selectedKategori, sortBy, statusFilter, fetchProjects]);

  const handleKategoriChange = (e) => setSelectedKategori(e.target.value);
  const handleSortChange = (e) => setSortBy(e.target.value);
  const handleStatusChange = (e) => setStatusFilter(e.target.value);
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) fetchProjects(newPage);
  };

  const handleProjectClick = (project) => {
    navigate(`/campaign-details/${project.id}`, { state: project });
  };

  if (authIsLoading && !user) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><Loader message="Memverifikasi sesi..." /></div>;
  }

  return (
    <div className="animate-fadeIn p-4 md:p-0 space-y-10">
      <section>
        <div className="mb-8 p-6 bg-[#1c1c24] rounded-xl shadow-xl">
          <h1 className="font-epilogue font-bold text-xl sm:text-2xl text-white leading-tight">
            Eksplorasi Semua Proyek
          </h1>
          <p className="font-epilogue font-normal text-md text-[#b2b3bd] mt-1">
            Temukan dan dukung ide-ide inovatif!
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8 p-4 bg-[#1c1c24] rounded-xl shadow sticky top-[80px] sm:top-[90px] z-10 backdrop-blur-md bg-opacity-80">
          <div className="flex-1">
            <label htmlFor="kategoriFilter" className="block text-xs font-medium text-[#808191] mb-1">Kategori:</label>
            <select 
              id="kategoriFilter" 
              value={selectedKategori} 
              onChange={handleKategoriChange} 
              disabled={isLoading} 
              className="w-full py-2.5 px-3 bg-[#2c2f32] border border-[#3a3a43] text-white rounded-[10px] focus:ring-[#4acd8d] focus:border-[#4acd8d] text-sm"
            >
              {kategoriList.map(kat => (
                <option key={kat.id_kategori || 'all-cat'} value={kat.id_kategori}>
                  {kat.nama_kategori}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label htmlFor="sortFilter" className="block text-xs font-medium text-[#808191] mb-1">Urutkan:</label>
            <select 
              id="sortFilter" 
              value={sortBy} 
              onChange={handleSortChange} 
              disabled={isLoading} 
              className="w-full py-2.5 px-3 bg-[#2c2f32] border border-[#3a3a43] text-white rounded-[10px] focus:ring-[#4acd8d] focus:border-[#4acd8d] text-sm"
            >
              <option value="terbaru">Terbaru</option>
              <option value="terlama">Terlama</option>
              <option value="dana_terkumpul_desc">Populer (Dana Terbanyak)</option>
              <option value="dana_terkumpul_asc">Dana Terendah</option>
              <option value="batas_waktu_asc">Segera Berakhir</option>
            </select>
          </div>
          {user?.role === 'admin' && (
            <div className="flex-1">
              <label htmlFor="statusFilter" className="block text-xs font-medium text-[#808191] mb-1">Status:</label>
              <select 
                id="statusFilter" 
                value={statusFilter} 
                onChange={handleStatusChange} 
                disabled={isLoading} 
                className="w-full py-2.5 px-3 bg-[#2c2f32] border border-[#3a3a43] text-white rounded-[10px] focus:ring-[#4acd8d] focus:border-[#4acd8d] text-sm"
              >
                <option value="">Semua Status</option>
                <option value="PENDING_REVIEW">Pending Review</option>
                <option value="AKTIF">Aktif</option>
                <option value="DITOLAK">Ditolak</option>
              </select>
            </div>
          )}
        </div>

        {isLoading ? (
          <Loader message="Memuat proyek..." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                handleClick={() => handleProjectClick(project)} 
              />
            ))}
          </div>
        )}

        {!isLoading && totalPages > 1 && (
          <div className="flex justify-center items-center mt-10 space-x-3">
            <CustomButton 
              title="Sebelumnya" 
              handleClick={() => handlePageChange(currentPage - 1)} 
              disabled={currentPage === 1} 
              styles={`px-4 py-2 text-xs rounded-md ${currentPage === 1 ? 'bg-gray-700 opacity-50' : 'bg-[#4acd8d] hover:bg-green-600'}`} 
            />
            <span className="font-epilogue text-white text-xs">Halaman {currentPage} dari {totalPages}</span>
            <CustomButton 
              title="Berikutnya" 
              handleClick={() => handlePageChange(currentPage + 1)} 
              disabled={currentPage === totalPages} 
              styles={`px-4 py-2 text-xs rounded-md ${currentPage === totalPages ? 'bg-gray-700 opacity-50' : 'bg-[#4acd8d] hover:bg-green-600'}`} 
            />
          </div>
        )}
      </section>
    </div>
  );
};

export default ExploreCampaignPage;
