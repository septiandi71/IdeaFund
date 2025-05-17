// src/components/Sidebar.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext'; // Impor untuk cek status login

import { logo, sun } from '../assets'; // Pastikan path aset benar
import { navlinks } from '../constants'; // navlinks Anda

const Icon = ({ styles, name, imgUrl, isActive, disabled, handleClick }) => (
  <div 
    className={`w-[48px] h-[48px] rounded-[10px] ${isActive && isActive === name && 'bg-[#2c2f32]'} flex justify-center items-center ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-[#2c2f32] transition-colors'} ${styles}`} 
    onClick={disabled ? null : handleClick}
  >
    <img src={imgUrl} alt={name || "fund_logo"} className={`w-1/2 h-1/2 ${isActive !== name && !disabled ? 'grayscale' : ''}`} />
  </div>
)

const Sidebar = () => {
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState('dashboard'); // Default active link
  const { user, logout } = useAuthContext(); // Ambil user dan fungsi logout

  // Jika user tidak login, Sidebar seharusnya tidak ditampilkan sama sekali (diatur oleh DashboardLayout)
  // Jadi, kita bisa asumsikan user selalu ada di sini.
  // Namun, untuk keamanan, bisa tambahkan pengecekan.
  if (!user) {
    return null; // Atau komponen placeholder jika Sidebar dirender di luar ProtectedRoute
  }

  return (
    <div className="flex justify-between items-center flex-col sticky top-5 h-[93vh]">
      <Link to="/dashboard"> {/* Logo selalu mengarah ke dashboard jika user login */}
        <Icon styles="w-[52px] h-[52px] bg-[#2c2f32]" imgUrl={logo} name="logo-link" />
      </Link>

      <div className="flex-1 flex flex-col justify-between items-center bg-[#1c1c24] rounded-[20px] w-[76px] py-4 mt-12">
        <div className="flex flex-col justify-center items-center gap-3">
          {navlinks.map((link) => {
            // Logika untuk menampilkan link berdasarkan status login dan peran
            // Ini adalah contoh, sesuaikan dengan 'name' dan 'role' di navlinks Anda
            if (link.name.toLowerCase() === 'logout' && !user) return null;
            if (link.name.toLowerCase() === 'create campaign' && (!user || user.role !== 'mahasiswa')) return null;
            if (link.name.toLowerCase() === 'profile' && !user) return null;
            // Jika 'payment' adalah dashboard, dan user ada, maka tampilkan
            // Jika ada link khusus admin, tambahkan:
            // if (link.forAdmin && user.role !== 'admin') return null;

            return (
              <Icon 
                key={link.name}
                name={link.name} // Teruskan nama untuk perbandingan isActive
                imgUrl={link.imgUrl}
                isActive={isActive}
                disabled={link.disabled}
                handleClick={() => {
                  if(!link.disabled) {
                    setIsActive(link.name);
                    if (link.name.toLowerCase() === 'logout') {
                      logout().then(() => navigate('/'));
                    } else {
                      navigate(link.link);
                    }
                  }
                }}
              />
            );
          })}
        </div>

        {/* Tombol Sun/Dark Mode (biarkan jika masih dipakai) */}
        <Icon styles="bg-[#1c1c24] shadow-secondary mt-auto" imgUrl={sun} name="theme-toggle" />
      </div>
    </div>
  )
}

export default Sidebar;
