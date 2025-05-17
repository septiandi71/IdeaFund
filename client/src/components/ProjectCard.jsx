// src/components/ProjectCard.jsx
import React from 'react';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/';

// Ikon-ikon sederhana (ganti dengan SVG dari aset Anda jika ada)
const CategoryIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#4acd8d] transition-colors mr-1.5">
        <path d="M3 2.75C3 1.784 3.784 1 4.75 1h6.5c.966 0 1.75.784 1.75 1.75v3.516c0 .456-.18.892-.496 1.207L9.26 11.72a.75.75 0 0 1-1.06 0L4.996 8.47a1.75 1.75 0 0 0-1.207-.496H2.029A4.5 4.5 0 0 1 6.08 3.5H3.5V2.75Zm1.01-.25C4.284 1.64 3.75 1.011 3.75 0H2.25C1.007 0 0 1.007 0 2.25v9.5C0 13.993 1.007 15 2.25 15h11.5c1.243 0 2.25-1.007 2.25-2.25v-9.5C16 1.007 14.993 0 13.75 0H10V1.75a2.75 2.75 0 0 1-2.75 2.75H6.75A2.75 2.75 0 0 1 4 1.75V0C3.011.001 2.14.785 2.029 1.75H3.5V2.75a1 1 0 0 0 1-1Z" />
    </svg>
);
const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 text-gray-500 mr-1">
      <path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm.75-10.25a.75.75 0 0 0-1.5 0V8.5c0 .414.336.75.75.75h3.25a.75.75 0 0 0 0-1.5H8.75V4.75Z" clipRule="evenodd" />
    </svg>
);
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 text-gray-500 mr-1">
      <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
    </svg>
);

const daysLeft = (deadline) => {
  if (!deadline) return { text: "N/A", isUrgent: false, isFinished: false };
  const difference = new Date(deadline).getTime() - Date.now();
  if (difference <= 0) return { text: "Selesai", isUrgent: false, isFinished: true };
  const remainingDays = Math.ceil(difference / (1000 * 60 * 60 * 24));
  return {
    text: remainingDays.toString() + (remainingDays === 1 ? " hari" : " hari"),
    isUrgent: remainingDays <= 7 && remainingDays > 0,
    isFinished: false,
  };
};

const ProjectCard = ({ project, handleClick }) => {
  if (!project) return null;

  const ownerName = project.pemilik?.namaLengkap || 'Pemilik Proyek';
  const ownerNim = project.pemilik?.nim || 'N/A';
  const ownerProdi = project.pemilik?.prodi?.nama_prodi || 'Prodi Tidak Diketahui';
  
  const danaTerkumpul = parseFloat(project.danaTerkumpul) || 0;
  const targetDana = parseFloat(project.targetDana) || 1; 
  
  const danaTerkumpulFormatted = `Rp ${danaTerkumpul.toLocaleString('id-ID', {maximumFractionDigits:0})}`;
  const targetDanaFormatted = `Rp ${targetDana.toLocaleString('id-ID', {maximumFractionDigits:0})}`;
  const { text: remainingText, isUrgent, isFinished } = daysLeft(project.batasWaktu);

  const calculateBarPercentage = (goal, raisedAmount) => {
    if (goal <= 0) return 0;
    const percentage = Math.max(0, Math.min(100, (raisedAmount / goal) * 100));
    return percentage;
  };
  const percentage = calculateBarPercentage(targetDana, danaTerkumpul);

  const statusText = project.status ? project.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A';
  let statusBadgeClasses = 'text-gray-200 bg-gray-600/80';
  if (project.status === 'AKTIF') statusBadgeClasses = 'text-green-100 bg-green-500/80';
  else if (project.status === 'PENDING_REVIEW') statusBadgeClasses = 'text-yellow-100 bg-yellow-500/80';
  else if (project.status === 'GAGAL') statusBadgeClasses = 'text-red-200 bg-red-600/80';
  else if (isFinished && percentage >=100) statusBadgeClasses = 'text-teal-100 bg-teal-500/80';
  else if (isFinished && percentage < 100) statusBadgeClasses = 'text-orange-200 bg-orange-500/80';

  return (
    <div 
      className="flex flex-col sm:flex-row w-full bg-[#1e1e2d] rounded-[12px] shadow-lg overflow-hidden cursor-pointer group transform hover:-translate-y-1 hover:shadow-xl hover:shadow-[#4acd8d]/20 transition-all duration-300 ease-out border border-[#2a2a3a] hover:border-[#4acd8d]/40"
      onClick={() => handleClick(project)}
      // Tinggi kartu bisa diatur di sini atau oleh grid parent dengan item-stretch
      // Untuk layout horizontal, tinggi biasanya ditentukan oleh konten atau gambar.
      // Kita akan coba buat kontennya yang menentukan tinggi.
    >
      {/* Kolom Gambar (Kiri) */}
      {/* Lebar gambar dibuat lebih kecil dan tetap untuk layout horizontal */}
      <div className="w-full sm:w-40 md:w-48 lg:w-52 xl:w-56 flex-shrink-0 relative aspect-[4/3] bg-[#13131a] overflow-hidden">
        <img 
          src={API_BASE_URL+project.projectImageUrl || `https://via.placeholder.com/400x300/1c1c24/707070?text=${encodeURIComponent(project.judul || 'IdeaFund')}`} 
          alt={project.judul || "Gambar Proyek"} 
          className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
        />
        <div className={`absolute top-2 right-2 px-2 py-0.5 text-[9px] font-bold rounded-md ${statusBadgeClasses} shadow-md backdrop-blur-sm uppercase tracking-wider`}>
            {statusText}
        </div>
      </div>

      {/* Kolom Informasi (Kanan) */}
      <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between"> {/* flex-1 agar mengambil sisa ruang */}
        <div>
            <div className="flex items-center mb-1.5">
                <CategoryIcon />
                <p className="font-epilogue font-semibold text-[10px] text-[#808191] uppercase tracking-wider group-hover:text-[#4acd8d] transition-colors">
                    {project.kategori?.nama_kategori || 'Kategori'}
                </p>
            </div>
            <h3 className="font-epilogue font-bold text-sm md:text-base text-white leading-tight truncate_2_lines mb-1 group-hover:text-slate-100 transition-colors" title={project.judul}>
            {project.judul || "Judul Proyek"}
            </h3>
            
            {/* Info Pemilik */}
            <div className="flex items-center text-[10px] text-gray-400 mb-2.5">
                <UserIcon />
                <span className="font-medium truncate max-w-[150px] sm:max-w-full" title={`${ownerName} (${ownerNim} - ${ownerProdi})`}>
                    {ownerName} <span className="text-gray-500">({ownerNim} - {ownerProdi})</span>
                </span>
            </div>
        </div>

        <div className="mt-auto"> {/* Mendorong ke bawah */}
            {/* Progress Bar & Info Dana */}
            <div className="w-full mb-1.5">
                <div className="flex justify-between text-[10px] font-epilogue text-[#808191] mb-0.5">
                    <span className="font-medium text-[#b2b3bd]">{danaTerkumpulFormatted}</span>
                    <span className="font-semibold text-[#4acd8d]">{percentage.toFixed(0)}%</span>
                </div>
                <div className="relative w-full h-[4px] bg-[#3a3a43] rounded-full overflow-hidden"> {/* Bar lebih tipis */}
                    <div 
                        className="absolute h-full bg-gradient-to-r from-[#1dc071] to-[#4acd8d] rounded-full transition-all duration-500 ease-out" 
                        style={{ width: `${percentage}%`}}
                    ></div>
                </div>
                 <p className="text-right mt-0.5 font-epilogue text-[9px] text-[#808191]">Target: {targetDanaFormatted}</p>
            </div>

            {/* Sisa Hari */}
            <div className="flex items-center justify-end text-[10px] text-[#808191] gap-1 mt-1.5">
                <ClockIcon />
                <p className={`font-medium ${isUrgent && !isFinished ? 'text-red-400 animate-pulse' : (isFinished ? 'text-gray-500' : 'text-[#b2b3bd]')}`}>
                    {remainingText}
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
