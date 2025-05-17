// src/components/ProjectCard.jsx
import React from 'react';
// import { Link } from 'react-router-dom'; // Tidak perlu Link jika handleClick di-pass
// import { defaultUserIcon } from '../constants'; // Jika Anda punya ikon user default

const TagIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#4acd8d] transition-colors">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 9h.008v.008H6V9Z" />
    </svg>
);

const daysLeft = (deadline) => {
  if (!deadline) return "N/A";
  const difference = new Date(deadline).getTime() - Date.now();
  if (difference <= 0) return "Selesai"; // Jika sudah lewat atau tepat waktu
  const remainingDays = Math.ceil(difference / (1000 * 60 * 60 * 24));
  return remainingDays.toString() + (remainingDays === 1 ? " hari" : " hari");
};

const ProjectCard = ({ project, handleClick }) => {
  if (!project) return null; // Safety check

  const ownerName = project.pemilik?.namaLengkap || 'Pemilik Proyek';
  const ownerInitial = ownerName.substring(0, 1).toUpperCase();
  
  const danaTerkumpul = parseFloat(project.danaTerkumpul) || 0;
  const targetDana = parseFloat(project.targetDana) || 1; // Hindari pembagian dengan nol jika target 0
  
  const danaTerkumpulFormatted = `Rp ${danaTerkumpul.toLocaleString('id-ID')}`;
  const targetDanaFormatted = `Rp ${targetDana.toLocaleString('id-ID')}`;
  const remaining = daysLeft(project.batasWaktu);

  const calculateBarPercentage = (goal, raisedAmount) => {
    if (goal <= 0) return 0;
    const percentage = Math.max(0, Math.min(100, (raisedAmount / goal) * 100));
    return percentage;
  };
  const percentage = calculateBarPercentage(targetDana, danaTerkumpul);

  const statusText = project.status ? project.status.replace(/_/g, ' ') : 'N/A';
  let statusColorClass = 'text-gray-300 bg-gray-600/80'; // Default
  if (project.status === 'AKTIF') statusColorClass = 'text-green-300 bg-green-700/80';
  else if (project.status === 'PENDING_REVIEW') statusColorClass = 'text-yellow-300 bg-yellow-700/80';
  else if (project.status === 'GAGAL') statusColorClass = 'text-red-300 bg-red-700/80';
  else if (project.status === 'SUKSES' || project.status === 'DANA_DICARIKAN_SEMUA' || project.status === 'DANA_DICARIKAN_SEBAGIAN') statusColorClass = 'text-teal-300 bg-teal-700/80';


  return (
    <div 
      className="w-full sm:w-[288px] md:w-[300px] bg-[#1e1e2d] rounded-[15px] shadow-xl overflow-hidden cursor-pointer group transform hover:-translate-y-1.5 hover:shadow-2xl transition-all duration-300 ease-out flex flex-col border border-transparent hover:border-[#4acd8d]/50"
      onClick={() => handleClick(project)}
    >
      {/* Gambar Proyek dengan Rasio Aspek */}
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-[#13131a]"> {/* aspect-[16/10] atau aspect-[4/3] */}
        <img 
          src={project.projectImageUrl || `https://via.placeholder.com/400x250/1c1c24/808191?text=${encodeURIComponent(project.judul || 'IdeaFund')}`} 
          alt={project.judul || "Gambar Proyek"} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className={`absolute top-3 right-3 px-2.5 py-1 text-xs font-semibold rounded-full ${statusColorClass} shadow-md`}>
            {statusText}
        </div>
      </div>

      <div className="flex flex-col p-5 flex-grow"> {/* flex-grow agar konten teks mengambil sisa ruang */}
        <div className="flex flex-row items-center mb-2.5">
          <TagIcon />
          <p className="ml-1.5 font-epilogue font-medium text-[11px] text-[#808191] capitalize group-hover:text-[#4acd8d] transition-colors">
            {project.kategori?.nama_kategori || 'Umum'}
          </p>
        </div>

        <h3 className="font-epilogue font-semibold text-[17px] text-white leading-snug truncate_2_lines mb-2" title={project.judul}>
          {project.judul || "Judul Proyek Tidak Tersedia"}
        </h3>
        <p className="font-epilogue font-normal text-gray-400 text-xs leading-relaxed h-[54px] overflow-hidden truncate_3_lines mb-4">
          {project.deskripsi || "Tidak ada deskripsi untuk proyek ini."}
        </p>

        {/* Progress Bar */}
        <div className="w-full mb-3">
            <div className="flex justify-between text-[11px] font-epilogue text-[#808191] mb-1">
                <span>{danaTerkumpulFormatted}</span>
                <span className="font-semibold text-[#b2b3bd]">{percentage.toFixed(0)}%</span>
            </div>
            <div className="relative w-full h-[5px] bg-[#3a3a43] rounded-full overflow-hidden"> {/* Tambah overflow-hidden */}
                <div 
                    className="absolute h-full bg-gradient-to-r from-[#4acd8d] to-[#1dc071] rounded-full transition-all duration-500 ease-out" 
                    style={{ width: `${percentage}%`}}
                >
                </div>
            </div>
             <p className="text-right mt-1 font-epilogue text-[11px] text-[#808191]">Target: {targetDanaFormatted}</p>
        </div>

        <div className="flex justify-between items-center font-epilogue text-xs text-[#808191] mt-auto pt-3 border-t border-[#2c2f32]"> {/* Border lebih gelap */}
            <div className="flex items-center gap-2">
                <div className="w-[24px] h-[24px] rounded-full flex justify-center items-center bg-[#2c2f32] border border-gray-600">
                    <span className="font-bold text-xs text-white">{ownerInitial}</span>
                </div>
                <p className="truncate max-w-[100px] sm:max-w-[120px]" title={ownerName}>
                    <span className="text-[#b2b3bd]">{ownerName}</span>
                </p>
            </div>
            <div className="text-right">
                <p className="font-semibold text-[#b2b3bd]">{remaining}</p>
                <p className="text-[11px]">Sisa Waktu</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
