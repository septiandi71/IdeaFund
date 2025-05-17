// src/App.jsx
import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { Sidebar, Navbar } from './components'; // Asumsi path ini benar
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout'; 
import LandingPageLayout from './components/layout/LandingPageLayout';

// Halaman-halaman
import { 
  Home, 
  Profile, 
  CreateCampaign, 
  ExploreCampaignPage,
  CampaignDetails,
  LoginPage,
  RegisterOptionsPage,
  RegisterMahasiswaPage1,
  RegisterMahasiswaPage2Otp,
  RegisterDonaturPage1,
  RegisterDonaturPage2Otp,
  DashboardPage
} from './pages'; 

// Terima prop 'client' dari main.jsx
const App = ({ client }) => { 
  if (!client) {
    // Ini seharusnya tidak terjadi jika main.jsx sudah benar
    return <div style={{color: "red", textAlign: "center", paddingTop: "50px"}}>Error: Thirdweb client tidak terinisialisasi.</div>;
  }

  return (
    // Jika Navbar Anda ada di dalam LandingPageLayout atau DashboardLayout,
    // Anda perlu cara untuk melewatkan 'client' ke Navbar tersebut,
    // atau inisialisasi 'client' di level yang bisa diakses Navbar.
    // Atau, jika Navbar tidak langsung pakai ConnectButton, mungkin tidak perlu client di sini.
    // Untuk contoh, kita asumsikan Navbar mungkin butuh client.
    <Routes>
      <Route element={<LandingPageLayout /* client={client} */ />}> {/* Jika LandingPageLayout merender Navbar yg butuh client */}
        <Route path="/" element={<Home />} /> 
        <Route path="/login" element={<LoginPage client={client} />} /> {/* Lewatkan client ke LoginPage */}
        <Route path="/register-options" element={<RegisterOptionsPage />} />
        <Route path="/register-mahasiswa" element={<RegisterMahasiswaPage1 />} />
        <Route path="/register-mahasiswa-otp" element={<RegisterMahasiswaPage2Otp client={client} />} /> {/* Jika ada ConnectButton di sini */}
        <Route path="/register-donatur" element={<RegisterDonaturPage1 />} />
        <Route path="/register-donatur-otp" element={<RegisterDonaturPage2Otp client={client} />} /> {/* Jika ada ConnectButton di sini */}
      </Route>

      {/* Rute Terproteksi */}
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/explore-campaign" element={<ExploreCampaignPage />} /> {/* Home.jsx sekarang menampilkan daftar proyek jika diakses dari /explore */}
        <Route path="/create-campaign" element={<ProtectedRoute allowedRoles={['mahasiswa']}><CreateCampaign /></ProtectedRoute>}/>
        <Route path="/campaign-details/:id" element={<CampaignDetails />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} /> 
    </Routes>
  );
};

export default App;
