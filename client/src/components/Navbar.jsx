// src/components/Navbar.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import CustomButton from './CustomButton'; // <-- PERBAIKAN DI SINI: Impor default
import { logo, menu, search, thirdweb as userIcon } from '../assets';
import { navlinks } from '../constants'; 

// Impor dari SDK Thirdweb v5+
import { ConnectButton } from "thirdweb/react";
import { createThirdwebClient } from 'thirdweb';
import { createWallet } from 'thirdweb/wallets'; 

const thirdwebClientId = import.meta.env.VITE_THIRDWEB_CLIENT_ID || "YOUR_FALLBACK_CLIENT_ID"; 
const client = createThirdwebClient({ clientId: thirdwebClientId });

const supportedWallets = [
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
];

const Navbar = () => {
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState('dashboard'); 
  const [toggleDrawer, setToggleDrawer] = useState(false);
  
  const { user, logout, isLoading: authIsLoading } = useAuthContext();

  const handleLogout = async () => {
    await logout();
    navigate('/login'); 
  };

  return (
    <div className="flex md:flex-row flex-col-reverse justify-between mb-[35px] gap-6 py-4">
      {/* Search Bar */}
      <div className="lg:flex-1 flex flex-row max-w-[458px] py-2 pl-4 pr-2 h-[52px] bg-[#1c1c24] rounded-[100px]">
        <input type="text" placeholder="Cari proyek..." className="flex w-full font-epilogue font-normal text-[14px] placeholder:text-[#4b5264] text-white bg-transparent outline-none" />
        <div className="w-[72px] h-full rounded-[20px] bg-[#4acd8d] flex justify-center items-center cursor-pointer">
          <img src={search} alt="search" className="w-[15px] h-[15px] object-contain"/>
        </div>
      </div>

      {/* Tombol Desktop */}
      <div className="sm:flex hidden flex-row justify-end gap-4 items-center">
        {authIsLoading ? (
          <p className="font-epilogue text-white animate-pulse">Memuat...</p>
        ) : user ? ( 
          <>
            {user.role === 'mahasiswa' && (
                 <CustomButton 
                    btnType="button"
                    title="Ajukan Proyek"
                    styles="bg-[#1dc071] hover:bg-green-600"
                    handleClick={() => navigate('/create-campaign')}
                />
            )}
            <CustomButton 
                btnType="button"
                title="Dashboard"
                styles="bg-blue-500 hover:bg-blue-600"
                handleClick={() => navigate('/dashboard')}
            />
            <CustomButton 
                btnType="button"
                title="Logout"
                styles="bg-[#8c6dfd] hover:bg-purple-700"
                handleClick={handleLogout}
            />
            <Link to="/profile">
              <div className="w-[52px] h-[52px] rounded-full bg-[#2c2f32] flex justify-center items-center cursor-pointer hover:ring-2 hover:ring-[#4acd8d] transition-all">
                <img src={userIcon} alt="user" className="w-[60%] h-[60%] object-contain" />
              </div>
            </Link>
          </>
        ) : ( 
          <>
            <CustomButton 
                btnType="button"
                title="Login"
                styles="bg-[#8c6dfd] hover:bg-purple-700"
                handleClick={() => navigate('/login')}
            />
            <CustomButton 
                btnType="button"
                title="Registrasi"
                styles="bg-[#2c2f32] hover:bg-gray-700"
                handleClick={() => navigate('/register-options')}
            />
            {/* Anda bisa uncomment ConnectButton jika ingin tombol connect wallet global di navbar */}
            {/* <ConnectButton client={client} wallets={supportedWallets} theme={"light"} /> */}
          </>
        )}
      </div>

      {/* Navigasi Mobile */}
        <div className="sm:hidden flex justify-between items-center relative">
            <Link to={user ? "/dashboard" : "/"}>
                <div className="w-[40px] h-[40px] rounded-[10px] bg-[#2c2f32] flex justify-center items-center cursor-pointer">
                    <img src={logo} alt="logo" className="w-[60%] h-[60%] object-contain" />
                </div>
            </Link>

          <img 
            src={menu}
            alt="menu"
            className="w-[34px] h-[34px] object-contain cursor-pointer"
            onClick={() => setToggleDrawer((prev) => !prev)}
          />

          <div className={`absolute top-[60px] right-0 left-0 bg-[#1c1c24] z-20 shadow-secondary py-4 ${!toggleDrawer ? '-translate-y-[120vh]' : 'translate-y-0'} transition-all duration-700 rounded-b-lg`}>
            <ul className="mb-4">
              {navlinks.map((link) => {
                if (link.disabled) return null;
                if (link.name.toLowerCase() === 'logout' && !user) return null;
                if (link.name.toLowerCase() === 'create campaign' && (!user || user.role !== 'mahasiswa')) return null;
                if (link.name.toLowerCase() === 'profile' && !user) return null;
                if (link.name.toLowerCase() === 'dashboard' && !user) return null;

                return (
                    <li
                    key={link.name}
                    className={`flex p-4 ${isActive === link.name && 'bg-[#3a3a43]'} hover:bg-[#3a3a43] rounded-md mx-2 transition-colors`}
                    onClick={() => {
                        setIsActive(link.name);
                        setToggleDrawer(false);
                        if (link.name.toLowerCase() === 'logout') {
                            handleLogout();
                        } else {
                            navigate(link.link);
                        }
                    }}
                    >
                    <img src={link.imgUrl} alt={link.name} className={`w-[24px] h-[24px] object-contain ${isActive === link.name ? 'grayscale-0' : 'grayscale'}`} />
                    <p className={`ml-[20px] font-epilogue font-semibold text-[14px] ${isActive === link.name ? 'text-[#1dc071]' : 'text-[#808191]'}`}>{link.name}</p>
                    </li>
                );
                })}
            </ul>

            <div className="flex flex-col mx-4 gap-2">
            {authIsLoading ? (
                <p className="text-white text-center py-2">Memuat...</p>
            ) : user ? (
                <>
                  {/* Tombol Create Campaign sudah ditangani oleh navlinks jika user mahasiswa */}
                </>
            ) : (
                <>
                    {/* Di mobile, ConnectButton mungkin lebih baik untuk menghemat ruang, atau tombol Login/Reg biasa */}
                    <CustomButton 
                        btnType="button"
                        title="Login"
                        styles="w-full bg-[#8c6dfd] hover:bg-purple-700"
                        handleClick={() => {setToggleDrawer(false); navigate('/login');}}
                    />
                    <CustomButton 
                        btnType="button"
                        title="Registrasi"
                        styles="w-full bg-[#2c2f32] hover:bg-gray-700 mt-2"
                        handleClick={() => {setToggleDrawer(false); navigate('/register-options');}}
                    />
                </>
            )}
            </div>
          </div>
        </div>
    </div>
  );
};

export default Navbar;
