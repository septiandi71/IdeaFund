// src/components/layout/LandingPageLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
// import Footer from '../Footer'; // Jika Anda punya komponen Footer

const LandingPageLayout = () => {
  return (
    // Div terluar mengambil tinggi layar penuh dan mengatur layout kolom
    <div className="relative bg-[#13131a] min-h-screen flex flex-col">
      {/* Navbar bisa diletakkan di sini jika ada versi publik, atau di dalam App.jsx di atas semua Routes */}
      {/* Untuk contoh ini, Navbar yang ada mungkin sudah bisa dikondisikan */}
      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8"> {/* Kontainer untuk Navbar jika ingin ada padding */}
      </div>
      
      {/* Main content akan mengambil sisa ruang dan menengahkan isinya */}
      <main className="flex-1 flex flex-col justify-center items-center w-full px-4 py-8 sm:py-12">
        <Outlet /> {/* Konten Halaman akan dirender di sini dan ditengahkan */}
      </main>
      
      {/* <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <Footer /> 
      </div>
      */}
    </div>
  );
};

export default LandingPageLayout;