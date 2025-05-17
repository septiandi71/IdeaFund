// src/pages/ExploreCampaignPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { Loader, CustomButton, ProjectCard } from '../components';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Komponen untuk menampilkan bagian proyek dengan pagination
const ProjectSectionDisplay = ({ title, projects, isLoading, error, currentPage, totalPages, onPageChange, onProjectClick, emptyMessage, showCreateButton, createButtonLink, createButtonText, sectionId }) => {
    if (isLoading) {
        return <div className="flex justify-center py-10"><Loader message={`Memuat ${title ? title.toLowerCase() : 'proyek'}...`} /></div>;
    }
    if (error) {
        return <div className="p-4 my-4 text-sm text-red-300 bg-red-700/30 rounded-lg text-center"><span className="font-medium">Oops!</span> {error}</div>;
    }
    
    const noProjectsFound = !projects || projects.length === 0;

    return (
        <div className="bg-[#13131a] p-4 sm:p-6 rounded-xl shadow-xl"> 
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8">
                <h2 className="font-epilogue font-bold text-xl sm:text-2xl text-white leading-tight">
                    {title}
                </h2>
                {showCreateButton && !noProjectsFound && (
                     <Link to={createButtonLink} className="mt-3 sm:mt-0">
                        <CustomButton title={createButtonText} styles="bg-green-500 hover:bg-green-600 text-sm px-4 py-2" />
                    </Link>
                )}
            </div>
            
            {noProjectsFound ? (
                <div className="text-center py-10 bg-[#1c1c24] rounded-xl">
                    <svg className="mx-auto h-16 w-16 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.133 5.604C7.991 4.403 6.36 3.75 4.5 3.75v16.5c1.86 0 3.491-.653 4.633-1.854m10.734 1.854C21.009 20.597 22.64 19.944 24.5 19.944V3.75c-1.86 0-3.491-.653-4.633 1.854m0 14.592c-.427-.38-.84-.78-1.227-1.195a12.001 12.001 0 0 0-1.805-1.628M9.133 5.604c.427.38.84.78 1.227 1.195a12.001 12.001 0 0 1 1.805 1.628m0 0V20.25m0-12.022c1.828 0 3.52.416 4.975 1.175M13.867 8.423c-1.455-.759-3.147-1.175-4.975-1.175M12 21a8.962 8.962 0 0 1-4.239-1.182M12 21a8.962 8.962 0 0 0 4.239-1.182" /></svg>
                    <h3 className="mt-3 text-lg font-medium text-white font-epilogue">{emptyMessage || "Tidak ada proyek untuk ditampilkan."}</h3>
                    {showCreateButton && (
                        <div className="mt-6">
                            <Link to={createButtonLink}>
                                <CustomButton title={createButtonText} styles="bg-green-500 hover:bg-green-600" />
                            </Link>
                        </div>
                    )}
                </div>
            ) : (
                // Layout Grid untuk 1 kolom di mobile, 2 di tablet (md), 3 di desktop (lg)
                // Jika kartu horizontal, mungkin 1 kolom di mobile, dan 2 di layar lebih besar
                // Untuk 3 kartu horizontal, kontainer harus sangat lebar atau kartu sangat ramping
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"> {/* Coba 2 kolom di lg, 3 di xl */}
                    {projects.map((project) => (
                        <ProjectCard 
                            key={`${sectionId}-${project.id}`}
                            project={project} 
                            handleClick={onProjectClick}
                        />
                    ))}
                </div>
            )}

            {!noProjectsFound && totalPages > 1 && (
                <div className="flex justify-center items-center mt-10 space-x-3">
                    <CustomButton title="Sebelumnya" handleClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} styles={`px-4 py-2 text-xs rounded-md ${currentPage === 1 ? 'bg-gray-700 opacity-50' : 'bg-[#4acd8d] hover:bg-green-600'}`} />
                    <span className="font-epilogue text-white text-xs">Halaman {currentPage} dari {totalPages}</span>
                    <CustomButton title="Berikutnya" handleClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} styles={`px-4 py-2 text-xs rounded-md ${currentPage === totalPages ? 'bg-gray-700 opacity-50' : 'bg-[#4acd8d] hover:bg-green-600'}`} />
                </div>
            )}
        </div>
    );
};


const ExploreCampaignPage = () => {
  const navigate = useNavigate();
  const { user, isLoading: authIsLoading } = useAuthContext();
  
  // ... (State dan fungsi fetch lainnya tetap sama seperti sebelumnya) ...
  const [myProjects, setMyProjects] = useState([]);
  const [isLoadingMyProjects, setIsLoadingMyProjects] = useState(false);
  const [myProjectsError, setMyProjectsError] = useState('');
  const [currentMyProjectsPage, setCurrentMyProjectsPage] = useState(1);
  const [totalMyProjectsPages, setTotalMyProjectsPages] = useState(1);

  const [exploreProjects, setExploreProjects] = useState([]);
  const [isLoadingExplore, setIsLoadingExplore] = useState(false);
  const [exploreError, setExploreError] = useState('');
  const [kategoriList, setKategoriList] = useState([]);
  const [selectedKategori, setSelectedKategori] = useState('');
  const [sortBy, setSortBy] = useState('terbaru');
  const [currentExplorePage, setCurrentExplorePage] = useState(1);
  const [totalExplorePages, setTotalExplorePages] = useState(1);
  const [totalExploreProjects, setTotalExploreProjects] = useState(0);
  
  const projectsPerPageExplore = 6; // Disesuaikan agar pas dengan 2 atau 3 kartu per baris
  const projectsPerPageMy = 2;    // Untuk "Proyek Saya", mungkin 2 kartu horizontal per baris cukup

  // ... (useEffect untuk fetchKategori, fetchMyProjects, fetchAllActiveCampaigns tetap sama) ...
  useEffect(() => {
    const fetchKategori = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/data/kategori`);
        setKategoriList([{ id_kategori: '', nama_kategori: 'Semua Kategori' }, ...response.data] || [{ id_kategori: '', nama_kategori: 'Semua Kategori' }]);
      } catch (err) { console.error("Gagal mengambil data kategori:", err); }
    };
    fetchKategori();
  }, []);

  const fetchMyProjects = useCallback(async (page = 1) => {
    if (user && user.role === 'mahasiswa') {
      setIsLoadingMyProjects(true);
      setMyProjectsError('');
      try {
        const params = { page, limit: projectsPerPageMy };
        const response = await axios.get(`${API_BASE_URL}/projects/my`, { params });
        setMyProjects(response.data.projects || []);
        setTotalMyProjectsPages(response.data.totalPages || 1);
        setCurrentMyProjectsPage(response.data.currentPage || 1);
      } catch (err) {
        setMyProjectsError(err.response?.data?.message || "Tidak dapat memuat proyek Anda.");
      } finally {
        setIsLoadingMyProjects(false);
      }
    }
  }, [user, projectsPerPageMy]);

  useEffect(() => {
    if (user && user.role === 'mahasiswa') {
        fetchMyProjects(1);
    } else {
        setMyProjects([]); 
    }
  }, [user, fetchMyProjects]);

  const fetchAllActiveCampaigns = useCallback(async (pageToFetch) => {
    setIsLoadingExplore(true);
    setExploreError('');
    try {
      const params = { page: pageToFetch, limit: projectsPerPageExplore, sort: sortBy };
      if (selectedKategori && selectedKategori !== '') params.kategoriId = selectedKategori;
      
      const response = await axios.get(`${API_BASE_URL}/projects/explore`, { params });
      setExploreProjects(response.data.projects || []);
      setTotalExplorePages(response.data.totalPages || 1);
      setCurrentExplorePage(response.data.currentPage || 1);
      setTotalExploreProjects(response.data.totalProjects || 0);
    } catch (err) {
      setExploreError(err.response?.data?.message || "Tidak dapat memuat daftar proyek.");
      setExploreProjects([]); 
    } finally {
      setIsLoadingExplore(false);
    }
  }, [selectedKategori, sortBy, projectsPerPageExplore]);

  useEffect(() => {
    fetchAllActiveCampaigns(1); 
  }, [selectedKategori, sortBy, fetchAllActiveCampaigns]);

  const handleKategoriChange = (e) => { setSelectedKategori(e.target.value); };
  const handleSortChange = (e) => { setSortBy(e.target.value); };
  
  const handleMyProjectsPageChange = (newPage) => { 
    if (newPage >= 1 && newPage <= totalMyProjectsPages) fetchMyProjects(newPage); 
  };
  const handleExplorePageChange = (newPage) => { 
    if (newPage >= 1 && newPage <= totalExplorePages) fetchAllActiveCampaigns(newPage);
  };
  
  const handleProjectClick = (project) => {
    navigate(`/campaign-details/${project.id}`, { state: project });
  };

  if (authIsLoading && !user) { 
    return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><Loader message="Memverifikasi sesi..." /></div>;
  }

  return (
    <div className="animate-fadeIn p-4 md:p-0 space-y-10">
      
      {user && user.role === 'mahasiswa' && (
        <ProjectSectionDisplay
          sectionId="my-projects"
          title="Proyek yang Saya Ajukan"
          projects={myProjects}
          isLoading={isLoadingMyProjects}
          error={myProjectsError}
          currentPage={currentMyProjectsPage}
          totalPages={totalMyProjectsPages}
          onPageChange={handleMyProjectsPageChange}
          onProjectClick={handleProjectClick}
          emptyMessage="Anda belum mengajukan proyek apapun."
          showCreateButton={true}
          createButtonLink="/create-campaign"
          createButtonText="+ Ajukan Proyek Baru"
        />
      )}

      <section>
        <div className="mb-8 p-6 bg-[#1c1c24] rounded-xl shadow-xl">
          <h1 className="font-epilogue font-bold text-xl sm:text-2xl text-white leading-tight">
            Eksplorasi Semua Proyek Aktif
          </h1>
          <p className="font-epilogue font-normal text-md text-[#b2b3bd] mt-1">
            Temukan dan dukung ide-ide inovatif! ({isLoadingExplore ? 'Memuat...' : `${totalExploreProjects} proyek ditemukan`})
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8 p-4 bg-[#1c1c24] rounded-xl shadow sticky top-[80px] sm:top-[90px] z-10 backdrop-blur-md bg-opacity-80">
          {/* ... (Filter dan Sort select box tetap sama) ... */}
           <div className="flex-1">
            <label htmlFor="kategoriFilterExplore" className="block text-xs font-medium text-[#808191] mb-1">Kategori:</label>
            <select id="kategoriFilterExplore" value={selectedKategori} onChange={handleKategoriChange} disabled={isLoadingExplore} className="w-full py-2.5 px-3 bg-[#2c2f32] border border-[#3a3a43] text-white rounded-[10px] focus:ring-[#4acd8d] focus:border-[#4acd8d] text-sm">
              {kategoriList.map(kat => (<option key={kat.id_kategori || 'all-cat-explore'} value={kat.id_kategori}>{kat.nama_kategori}</option>))}
            </select>
          </div>
          <div className="flex-1">
            <label htmlFor="sortFilterExplore" className="block text-xs font-medium text-[#808191] mb-1">Urutkan:</label>
            <select id="sortFilterExplore" value={sortBy} onChange={handleSortChange} disabled={isLoadingExplore} className="w-full py-2.5 px-3 bg-[#2c2f32] border border-[#3a3a43] text-white rounded-[10px] focus:ring-[#4acd8d] focus:border-[#4acd8d] text-sm">
              <option value="terbaru">Terbaru</option>
              <option value="terlama">Terlama</option>
              <option value="dana_terkumpul_desc">Populer (Dana Terbanyak)</option>
              <option value="dana_terkumpul_asc">Dana Terendah</option>
              <option value="batas_waktu_asc">Segera Berakhir</option>
            </select>
          </div>
        </div>

        <ProjectSectionDisplay
          sectionId="explore-projects"
          title="" 
          projects={exploreProjects}
          isLoading={isLoadingExplore}
          error={exploreError}
          currentPage={currentExplorePage}
          totalPages={totalExplorePages}
          onPageChange={handleExplorePageChange}
          onProjectClick={handleProjectClick}
          emptyMessage="Tidak ada proyek aktif ditemukan dengan filter ini."
          showCreateButton={user?.role === 'mahasiswa' && exploreProjects.length === 0 && (!myProjects || myProjects.length === 0) }
          createButtonLink="/create-campaign"
          createButtonText="Jadilah yang Pertama Mengajukan Proyek!"
        />
      </section>
    </div>
  );
};

export default ExploreCampaignPage;
