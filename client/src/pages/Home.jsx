// src/pages/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { CustomButton } from '../components'; // Pastikan path ini benar

// Contoh komponen untuk kartu fitur agar lebih mudah dikelola
const FeatureCard = ({ icon, title, description, iconBgColor = "bg-purple-600", iconColor = "text-white", hoverShadowColor = "hover:shadow-purple-500/40" }) => (
  <div className={`flex flex-col items-center text-center p-6 md:p-8 bg-[#1c1c24] rounded-xl shadow-xl ${hoverShadowColor} transition-all duration-300 ease-in-out transform hover:-translate-y-2`}>
    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${iconBgColor} shadow-lg`}>
      {/* Ganti dengan komponen ikon SVG Anda */}
      <span className={`text-4xl ${iconColor}`}>{icon}</span>
    </div>
    <h3 className="font-epilogue font-semibold text-xl lg:text-2xl text-white mb-3">{title}</h3>
    <p className="font-epilogue text-sm text-[#b2b3bd] leading-relaxed">
      {description}
    </p>
  </div>
);

// Contoh komponen untuk langkah "Cara Kerja"
const HowItWorksStep = ({ number, title, description, icon, numberBgColor = "bg-green-500", iconColor = "text-green-400" }) => (
  <div className="flex flex-col items-center text-center p-6 bg-[#1c1c24] rounded-xl shadow-lg hover:shadow-lg-dark transition-shadow duration-300">
    <div className="relative mb-6">
      <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 border-[#2c2f32] bg-[#13131a] shadow-inner`}>
        {/* Ganti dengan komponen ikon SVG Anda */}
        <span className={`text-5xl ${iconColor}`}>{icon}</span>
      </div>
      <div className={`absolute -top-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center ${numberBgColor} text-white font-bold text-xl shadow-md border-2 border-[#13131a]`}>
          {number}
      </div>
    </div>
    <h3 className="font-epilogue font-semibold text-lg lg:text-xl text-white mb-2">{title}</h3>
    <p className="font-epilogue text-sm text-[#808191] leading-relaxed">{description}</p>
  </div>
);


const Home = () => {
  return (
    // Div terluar untuk background utama dan mencegah overflow horizontal
    <div className="text-white bg-[#13131a] overflow-x-hidden">
      
      {/* Hero Section */}
      <section 
        className="min-h-[80vh] md:min-h-screen flex items-center justify-center text-center px-4 py-16 bg-cover bg-center bg-no-repeat relative"
        // Ganti URL placeholder dengan gambar hero berkualitas tinggi Anda
        style={{ background: 'linear-gradient(to bottom, rgba(19,19,26,0.3), rgba(28,28,36,0.6)), url("https://images.unsplash.com/photo-1584450402195-ff360cf81f30?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D") center center / cover no-repeat' }}
      >
        {/* Overlay gradasi halus di atas background image (opsional) */}
        {/* <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#13131a]/50"></div> */}
        
        <div className="relative z-10 bg-black bg-opacity-30 backdrop-blur-sm p-8 sm:p-12 rounded-xl shadow-2xl max-w-3xl mx-auto">
          <div className="p-4 bg-gradient-to-br from-[#4acd8d] to-[#1dc071] rounded-full inline-block mb-6 shadow-lg animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-10 h-10 sm:w-12 sm:h-12">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 0-11.25m0 11.25a6.01 6.01 0 0 1 0-11.25m0 11.25v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
            </svg>
          </div>
          <h1 className="font-epilogue font-extrabold text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight mb-6 text-shadow-lg">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4acd8d] to-[#93f0c8]">IdeaFund</span> IBIK
          </h1>
          <p className="font-epilogue font-medium text-md sm:text-lg text-[#c7cce0] mb-10 max-w-2xl mx-auto">
            Platform simulator crowdfunding berbasis blockchain pertama untuk mendukung, mewujudkan, dan meluncurkan proyek inovatif mahasiswa Institut Bisnis dan Informatika Kesatuan.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-5">
            <Link to="/register-options">
              <CustomButton 
                btnType="button"
                title="Mulai Proyek Anda"
                styles="bg-gradient-to-r from-[#1dc071] to-[#4acd8d] hover:from-green-500 hover:to-teal-500 px-8 py-3 text-lg rounded-[10px] shadow-lg transform hover:scale-105 transition-all duration-300 ease-out"
              />
            </Link>
            <Link to="/explore"> 
              <CustomButton 
                btnType="button"
                title="Dukung Inovasi"
                styles="bg-transparent border-2 border-[#8c6dfd] text-[#8c6dfd] hover:bg-[#8c6dfd] hover:text-white px-8 py-3 text-lg rounded-[10px] shadow-lg transform hover:scale-105 transition-all duration-300 ease-out"
              />
            </Link>
          </div>
        </div>
      </section>

      {/* Section: Mengapa IdeaFund IBIK? (Value Proposition) */}
      <section className="py-16 md:py-24 bg-[#1c1c24] w-full"> {/* w-full untuk background section */}
        <div className="container mx-auto px-4"> {/* Konten tetap di dalam container */}
          <h2 className="font-epilogue font-bold text-3xl sm:text-4xl text-center text-white mb-5">Mengapa Memilih IdeaFund IBIK?</h2>
          <p className="font-epilogue text-center text-md text-[#808191] mb-16 max-w-2xl mx-auto">
            Kami menyediakan ekosistem yang aman, transparan, dan mendukung bagi mahasiswa IBIK untuk mengubah ide menjadi kenyataan.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon="💡" 
              title="Validasi Ide & Inovasi" 
              description="Platform ideal untuk menguji konsep, mendapatkan feedback, dan membangun portofolio proyek inovatif Anda sebagai mahasiswa IBIK."
              iconBgColor="bg-gradient-to-br from-yellow-500 to-orange-500"
              hoverShadowColor="hover:shadow-yellow-500/40"
            />
            <FeatureCard 
              icon="💸" 
              title="Akses Pendanaan Terstruktur" 
              description="Proses penggalangan dana yang disederhanakan melalui simulasi crowdfunding, memberikan pengalaman nyata dalam mencari dukungan."
              iconBgColor="bg-gradient-to-br from-green-500 to-emerald-500"
              hoverShadowColor="hover:shadow-green-500/40"
            />
            <FeatureCard 
              icon="🔗" 
              title="Belajar Teknologi Blockchain" 
              description="Alami secara langsung bagaimana transparansi dan keamanan teknologi blockchain (Testnet) diterapkan dalam pendanaan proyek."
              iconBgColor="bg-gradient-to-br from-blue-500 to-sky-500"
              hoverShadowColor="hover:shadow-blue-500/40"
            />
            <FeatureCard 
              icon="🤝" 
              title="Dukungan Komunitas Internal" 
              description="Dibangun khusus untuk civitas akademika IBIK, mendorong kolaborasi, dan memperkuat jaringan antar mahasiswa dan donatur internal."
              iconBgColor="bg-gradient-to-br from-purple-500 to-indigo-500"
              hoverShadowColor="hover:shadow-purple-500/40"
            />
             <FeatureCard 
              icon="🎁" 
              title="Reward NFT Inovatif" 
              description="Proyek dapat menawarkan Non-Fungible Token (NFT) sebagai bentuk apresiasi unik dan kenang-kenangan digital bagi para donatur."
              iconBgColor="bg-gradient-to-br from-pink-500 to-rose-500"
              hoverShadowColor="hover:shadow-pink-500/40"
            />
             <FeatureCard 
              icon="🚀" 
              title="Peluncuran & Portofolio" 
              description="Jadikan IdeaFund sebagai langkah awal untuk meluncurkan proyek Anda dan membangun rekam jejak inovasi yang mengesankan."
              iconBgColor="bg-gradient-to-br from-teal-500 to-cyan-500"
              hoverShadowColor="hover:shadow-teal-500/40"
            />
          </div>
        </div>
      </section>

      {/* Section: Cara Kerja (How It Works) */}
      <section className="py-16 md:py-24 bg-[#13131a] w-full"> {/* w-full untuk background section */}
        <div className="container mx-auto px-4">
          <h2 className="font-epilogue font-bold text-3xl sm:text-4xl text-center text-white mb-5">Alur Pendanaan yang Mudah</h2>
          <div className="w-24 h-1.5 bg-gradient-to-r from-[#8c6dfd] to-[#4acd8d] mx-auto mb-20 rounded-full"></div>
          <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-16 items-start">
            <HowItWorksStep 
              number="1" 
              icon="✍️" // Ganti dengan SVG: <PencilSquareIcon className="w-10 h-10"/>
              title="Ajukan Ide Proyek" 
              description="Mahasiswa IBIK yang terdaftar dapat dengan mudah mengajukan proposal proyek kreatif dan inovatif mereka melalui formulir yang disediakan."
              numberBgColor="bg-gradient-to-br from-[#1dc071] to-[#4acd8d]"
              iconColor="text-[#4acd8d]"
            />
            <HowItWorksStep 
              number="2" 
              icon="📢" // Ganti dengan SVG: <MegaphoneIcon className="w-10 h-10"/>
              title="Galang Dukungan Dana" 
              description="Setelah review awal oleh Admin, proyek akan ditampilkan di platform untuk mendapatkan dukungan pendanaan dari komunitas dan donatur."
              numberBgColor="bg-gradient-to-br from-[#8c6dfd] to-[#5c40bd]"
              iconColor="text-[#8c6dfd]"
            />
            <HowItWorksStep 
              number="3" 
              icon="🎉" // Ganti dengan SVG: <SparklesIcon className="w-10 h-10"/>
              title="Wujudkan & Laporkan!" 
              description="Dana yang berhasil terkumpul (setelah verifikasi Admin) dicairkan untuk realisasi proyek. Laporkan progres milestone Anda."
              numberBgColor="bg-gradient-to-br from-[#4acd8d] to-[#1dc071]"
              iconColor="text-[#1dc071]"
            />
          </div>
        </div>
      </section>

      {/* Section: Call to Action Akhir */}
      <section className="py-16 md:py-24 bg-[#1c1c24] text-center w-full"> {/* w-full untuk background section */}
          <div className="container mx-auto px-4">
              <h2 className="font-epilogue font-bold text-3xl sm:text-4xl text-white mb-6">
                  Sudah Punya Ide Brilian?
              </h2>
              <p className="font-epilogue font-normal text-lg text-[#b2b3bd] mb-10 max-w-xl mx-auto">
                  Jangan biarkan ide Anda hanya menjadi catatan. Bergabunglah dengan IdeaFund IBIK sekarang, ajukan proyek Anda, atau dukung inovasi dari rekan mahasiswa!
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-5">
                <Link to="/register-options">
                    <CustomButton 
                        btnType="button"
                        title="Daftar & Mulai Sekarang"
                        styles="bg-gradient-to-r from-[#1dc071] to-[#4acd8d] hover:from-green-500 hover:to-teal-500 px-10 py-4 text-lg rounded-[10px] shadow-lg transform hover:scale-105 transition-all duration-300 ease-out"
                    />
                </Link>
                 <Link to="/login">
                    <CustomButton 
                        btnType="button"
                        title="Sudah Punya Akun? Login"
                        styles="bg-transparent border-2 border-[#8c6dfd] text-[#8c6dfd] hover:bg-[#8c6dfd] hover:text-white px-10 py-4 text-lg rounded-[10px] shadow-lg transform hover:scale-105 transition-all duration-300 ease-out"
                    />
                </Link>
              </div>
          </div>
      </section>
      
       <footer className="text-center p-8 bg-[#13131a] border-t border-gray-800 w-full">
            <p className="font-epilogue text-sm text-[#808191]">
                &copy; {new Date().getFullYear()} IdeaFund IBIK. Platform Simulator Pendanaan Proyek Mahasiswa.
            </p>
            <p className="text-xs text-gray-600 mt-1">Institut Bisnis dan Informatika Kesatuan</p>
        </footer>
    </div>
  );
}

export default Home;
