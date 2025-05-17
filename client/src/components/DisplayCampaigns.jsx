// src/components/DisplayCampaigns.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectCard from './ProjectCard'; // Menggunakan ProjectCard yang baru/disesuaikan
import Loader from './Loader'; // Pastikan Loader diimpor

const DisplayCampaigns = ({ title, isLoading, campaigns }) => { // 'campaigns' di sini adalah array 'projects' dari backend
  const navigate = useNavigate();

  const handleNavigate = (campaign) => {
    // Mengirim seluruh objek campaign (proyek) ke halaman detail
    // Pastikan CampaignDetailsPage bisa menangani objek ini dari location.state
    navigate(`/campaign-details/${campaign.id}`, { state: campaign });
  };

  return (
    <div>
      <h1 className="font-epilogue font-semibold text-[18px] text-white text-left">
        {title} ({campaigns ? campaigns.length : 0})
      </h1>

      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <Loader message="Memuat daftar proyek..." />
        </div>
      )}

      {!isLoading && campaigns && campaigns.length === 0 && (
        <p className="font-epilogue font-semibold text-[14px] leading-[30px] text-[#818183] mt-5">
          Belum ada proyek yang tersedia saat ini.
        </p>
      )}

      {!isLoading && campaigns && campaigns.length > 0 && (
        <div className="flex flex-wrap mt-[20px] gap-[26px] justify-center md:justify-start">
          {campaigns.map((campaign) => (
            <ProjectCard 
              key={campaign.id} // Gunakan ID unik dari proyek
              project={campaign} // Teruskan seluruh objek proyek
              handleClick={() => handleNavigate(campaign)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DisplayCampaigns;
