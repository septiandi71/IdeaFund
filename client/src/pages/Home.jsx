// src/pages/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { CustomButton } from '../components'; // Asumsi Anda punya komponen ini
// import heroBg from '../assets/hero-background.jpg'; // Ganti dengan gambar Anda
// import iconIdea from '../assets/icon-idea.svg';
// import iconFunding from '../assets/icon-funding.svg';
// import iconBlockchain from '../assets/icon-blockchain.svg';
// import iconCommunity from '../assets/icon-community.svg';

const Home = () => {
  return (
    <div className="text-white bg-[#13131a]"> {/* Warna dasar gelap dari template Anda */}
      
      {/* Hero Section */}
      <section 
        className="min-h-[70vh] md:min-h-[calc(100vh-80px)] flex items-center justify-center text-center px-4 py-12 -mt-[70px] md:-mt-[80px]" // Tarik ke atas untuk mengisi ruang navbar
        // style={{ backgroundImage: `url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }} // Opsional background image
      >
        <div className="bg-black bg-opacity-25 p-8 rounded-lg"> {/* Overlay jika pakai background image */}
          <h1 className="font-epilogue font-bold text-4xl sm:text-5xl md:text-6xl leading-tight mb-4 text-shadow-md">
            IdeaFund IBIK
          </h1>
          <h2 className="font-epilogue font-semibold text-xl sm:text-2xl md:text-3xl text-[#4acd8d] mb-8 text-shadow-sm">
            Wujudkan Inovasi, Raih Pendanaan Proyek Mahasiswa!
          </h2>
          <p className="font-epilogue font-normal text-md sm:text-lg text-[#b2b3bd] mb-10 max-w-2xl mx-auto">
            Platform simulator crowdfunding berbasis blockchain yang dirancang khusus untuk mendukung kreativitas dan merealisasikan proyek-proyek inovatif mahasiswa Institut Bisnis dan Informatika Kesatuan.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link to="/register-options">
              <CustomButton 
                btnType="button"
                title="Mulai Ajukan Proyek"
                styles="bg-[#1dc071] hover:bg-green-600 px-8 py-3 text-lg w-full sm:w-auto"
              />
            </Link>
            <Link to="/login"> 
              <CustomButton 
                btnType="button"
                title="Dukung Proyek"
                styles="bg-[#8c6dfd] hover:bg-purple-700 px-8 py-3 text-lg w-full sm:w-auto"
              />
            </Link>
          </div>
        </div>
      </section>

      {/* Section: Value Proposition */}
      <section className="py-16 md:py-20 bg-[#1c1c24]">
        <div className="container mx-auto px-4">
          <h2 className="font-epilogue font-bold text-3xl text-center text-white mb-4">Mengapa IdeaFund IBIK?</h2>
          <div className="w-20 h-1 bg-[#4acd8d] mx-auto mb-12"></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 bg-[#13131a] rounded-xl shadow-lg hover:shadow-2xl transition-shadow">
              <div className="text-[#4acd8d] text-5xl mb-4">💡</div>
              <h3 className="font-epilogue font-semibold text-xl text-white mb-2">Validasi Ide Inovatif</h3>
              <p className="font-epilogue text-sm text-[#808191] leading-relaxed">
                Tempat terbaik untuk menguji dan mendapatkan dukungan bagi ide-ide brilian mahasiswa IBIK.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-[#13131a] rounded-xl shadow-lg hover:shadow-2xl transition-shadow">
              <div className="text-[#8c6dfd] text-5xl mb-4">💸</div>
              <h3 className="font-epilogue font-semibold text-xl text-white mb-2">Akses Pendanaan Mudah</h3>
              <p className="font-epilogue text-sm text-[#808191] leading-relaxed">
                Proses pengajuan dan penggalangan dana yang disederhanakan dalam lingkungan simulator yang aman.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-[#13131a] rounded-xl shadow-lg hover:shadow-2xl transition-shadow">
               <div className="text-[#1dc071] text-5xl mb-4">🔗</div>
              <h3 className="font-epilogue font-semibold text-xl text-white mb-2">Transparansi Blockchain</h3>
              <p className="font-epilogue text-sm text-[#808191] leading-relaxed">
                Pelajari dan alami bagaimana teknologi blockchain (Testnet) dapat memberikan transparansi dalam proses pendanaan.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-[#1c1c24]">
        <div className="container mx-auto px-4">
          <h2 className="font-epilogue font-bold text-3xl text-center text-white mb-4">Bagaimana Cara Kerjanya?</h2>
          <div className="w-20 h-1 bg-[#4acd8d] mx-auto mb-12"></div>
          <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-10">
            <div className="flex flex-col items-center text-center">
              <div className="bg-[#2c2f32] p-5 rounded-full mb-4 text-3xl text-[#1dc071]">1</div>
              <h3 className="font-epilogue font-semibold text-lg text-white mb-2">Ajukan Proyek</h3>
              <p className="font-epilogue text-sm text-[#808191]">Mahasiswa IBIK yang terdaftar dapat mengajukan proposal proyek inovatif mereka.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-[#2c2f32] p-5 rounded-full mb-4 text-3xl text-[#8c6dfd]">2</div>
              <h3 className="font-epilogue font-semibold text-lg text-white mb-2">Galang Dana</h3>
              <p className="font-epilogue text-sm text-[#808191]">Proyek yang lolos review awal akan ditampilkan untuk mendapatkan dukungan dana dari komunitas.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-[#2c2f32] p-5 rounded-full mb-4 text-3xl text-[#4acd8d]">3</div>
              <h3 className="font-epilogue font-semibold text-lg text-white mb-2">Wujudkan Karyamu!</h3>
              <p className="font-epilogue text-sm text-[#808191]">Dana yang terkumpul (setelah verifikasi) dapat dicairkan untuk merealisasikan proyek.</p>
            </div>
          </div>
        </div>
      </section>

        <section className="py-16 md:py-24 bg-[#13131a] text-center">
            <div className="container mx-auto px-4">
                <h2 className="font-epilogue font-bold text-3xl text-white mb-6">
                    Siap Memberi Dampak?
                </h2>
                <p className="font-epilogue font-normal text-lg text-[#808191] mb-10 max-w-xl mx-auto">
                    Bergabunglah dengan komunitas IdeaFund IBIK sekarang juga dan jadilah bagian dari perubahan dan inovasi di kampus kita.
                </p>
                <Link to="/register-options">
                    <CustomButton 
                        btnType="button"
                        title="Daftar Sekarang & Mulai Berkontribusi"
                        styles="bg-gradient-to-r from-[#1dc071] to-[#4acd8d] hover:from-green-500 hover:to-teal-500 px-10 py-4 text-xl"
                    />
                </Link>
            </div>
        </section>
    </div>
  );
}

export default Home;
