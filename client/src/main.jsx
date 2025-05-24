// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';

// Impor dari SDK Thirdweb yang baru
import { ThirdwebProvider } from 'thirdweb/react'; 
import { Sepolia } from "@thirdweb-dev/chains"; // Impor chain object
import { client } from './thirdwebClient'; // Impor client yang sudah terpusat

// Asumsi StateContextProvider diekspor dari src/context/index.jsx atau src/context.jsx
// Untuk tes isolasi, kita bisa komentari ini dulu jika masalah berlanjut
import { StateContextProvider } from './context'; 
import { AuthContextProvider } from './context/AuthContext'; 
import App from './App';
import './index.css'; // Pastikan Tailwind CSS setup ada di sini

const root = ReactDOM.createRoot(document.getElementById('root'));

// 1. Dapatkan Client ID dari environment variable (pengecekan utama ada di thirdwebClient.js)
const thirdwebClientId = import.meta.env.VITE_THIRDWEB_CLIENT_ID;

// Pengecekan di main.jsx untuk menampilkan pesan error UI jika client ID bermasalah
if (!thirdwebClientId || thirdwebClientId === "YOUR_CLIENT_ID_PLACEHOLDER" || !client) { // Tambahkan pengecekan !client
  const errorMessage = "KRITIS: Harap ganti dengan Client ID Thirdweb Anda yang valid";
  console.error(errorMessage);
  // Menampilkan pesan error langsung di halaman jika clientId tidak ada/salah
  document.getElementById('root').innerHTML = 
    `<div style="color:red; text-align:center; padding-top: 50px; font-family: sans-serif;">
       <h1>Error Konfigurasi Aplikasi</h1>
       <p>${errorMessage}</p>
       <p>Silakan periksa file <code>src/main.jsx</code> Anda.</p>
     </div>`;
  // Hentikan eksekusi lebih lanjut jika clientId tidak ada
  // Ini akan mencegah error "No QueryClient set" jika masalahnya adalah clientId kosong.
} else {
  // 2. Gunakan client yang sudah diimpor
  root.render(
    <React.StrictMode>
      <ThirdwebProvider 
        client={client} // Tambahkan prop client di sini
        activeChain={Sepolia} // Atau chain string seperti "sepolia"
        // Tidak perlu clientId di sini jika sudah menggunakan prop client
        // supportedWallets akan diambil dari client jika sudah dikonfigurasi di sana,
        // atau bisa didefinisikan di sini juga jika perlu.
        // Untuk ConnectButton baru, daftar wallet biasanya dilewatkan langsung ke komponennya.
      >
        <Router>
          <AuthContextProvider>
            <StateContextProvider>
              <App client={client} /> {/* Lewatkan client ke App jika ConnectButton ada di App */}
            </StateContextProvider>
          </AuthContextProvider>
        </Router>
      </ThirdwebProvider> 
    </React.StrictMode>
  );
}
