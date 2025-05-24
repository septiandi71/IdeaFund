// src/components/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import CustomButton from './CustomButton'; 
import { appLogo, search } from '../constants'; // Pastikan menuIcon diimpor
import { navlinks as allNavlinks } from '../constants';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isActiveLink, setIsActiveLink] = useState(location.pathname);
  const [toggleDrawer, setToggleDrawer] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false); // State untuk dropdown profil
  
  const { user, logout, isLoading: authIsLoading } = useAuthContext();

  useEffect(() => {
    setIsActiveLink(location.pathname);
  }, [location.pathname]);

  const handleLogout = async () => {
    setToggleDrawer(false);
    setIsProfileDropdownOpen(false); // Tutup dropdown saat logout
    await logout();
    navigate('/login'); 
  };

  // Filter navlinks untuk mobile drawer berdasarkan status auth dan role
  const loggedInNavlinksForMobile = allNavlinks.filter(link => 
    link.authRequired && link.allowedRoles && link.allowedRoles.includes(user.role)
  );
  // Jika Anda ingin link khusus guest di mobile drawer saat belum login:
  const guestNavlinksForMobile = allNavlinks.filter(link => 
      !link.authRequired && link.roles && link.roles.includes('guest')
  );


  return (
    <div className="flex md:flex-row flex-col-reverse justify-between mb-[35px] gap-6 py-4 items-center">
      
      {/* Search Bar */}
      <div className="lg:flex-1 flex flex-row max-w-[458px] w-full md:w-auto py-2 pl-4 pr-2 h-[52px] bg-[#1c1c24] rounded-[100px] shadow-md">
        <input type="text" placeholder="Cari proyek..." className="flex w-full font-epilogue font-normal text-[14px] placeholder:text-[#4b5264] text-white bg-transparent outline-none" />
        <div className="w-[72px] h-full rounded-[20px] bg-[#4acd8d] flex justify-center items-center cursor-pointer hover:bg-green-600 transition-colors">
          <img src={search} alt="search" className="w-[15px] h-[15px] object-contain"/>
        </div>
      </div>

      {/* Tombol & Info Pengguna Desktop */}
      <div className="sm:flex hidden flex-row justify-end gap-4 items-center">
        {authIsLoading ? (
          <div className="font-epilogue text-white animate-pulse px-4 py-2 rounded-md bg-[#2c2f32]">Memuat...</div>
        ) : user ? ( 
          <>
            
            {/* Info Pengguna & Dropdown Profil */}
            <div className="flex items-center gap-2 relative"> {/* Tambahkan relative untuk posisi dropdown */}
                <div className="flex flex-col items-end text-right cursor-default">
                    <p className="font-epilogue font-semibold text-sm text-white" title={user.namaLengkap || user.nama}>
                        {user.namaLengkap || user.nama}
                    </p>
                    <p className="font-epilogue font-normal text-xs text-[#4acd8d] capitalize">
                        {user.role}
                    </p>
                </div>
                <div 
                    className="w-[44px] h-[44px] rounded-full bg-[#2c2f32] flex justify-center items-center cursor-pointer border-2 border-transparent hover:border-[#4acd8d] transition-all" 
                    onClick={() => setIsProfileDropdownOpen(prev => !prev)}
                    title="Pengaturan Akun"
                >
                    <img src={appLogo} alt="user" className="w-[60%] h-[60%] object-contain" />
                </div>

                {/* Dropdown untuk Email dan Logout */}
                {isProfileDropdownOpen && (
                    <div 
                        className="absolute right-0 top-full mt-2 w-60 bg-[#1c1c24] rounded-md shadow-lg py-2 z-20 border border-gray-700"
                        onMouseLeave={() => setIsProfileDropdownOpen(false)} // Tutup jika mouse keluar
                    >
                        <div className="px-4 py-3 border-b border-gray-700">
                            <p className="text-sm font-epilogue text-white font-semibold">Login sebagai:</p>
                            <p className="text-xs font-epilogue text-[#b2b3bd] truncate" title={user.email}>{user.email}</p>
                        </div>
                        <Link 
                            to="/profile" 
                            className="block px-4 py-2 text-sm font-epilogue text-[#b2b3bd] hover:bg-[#2c2f32] hover:text-white transition-colors rounded-md mx-1"
                            onClick={() => setIsProfileDropdownOpen(false)}
                        >
                            Profil Saya
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="block w-full text-left px-4 py-2 text-sm font-epilogue text-[#b2b3bd] hover:bg-[#2c2f32] hover:text-red-400 transition-colors rounded-md mx-1"
                        >
                            Logout
                        </button>
                    </div>
                )}
            </div>
          </>
        ) : ( 
          <>
            <CustomButton 
                btnType="button"
                title="Login"
                styles="bg-[#8c6dfd] hover:bg-purple-700 px-6 py-2 rounded-[10px]"
                handleClick={() => navigate('/login')}
            />
            <CustomButton 
                btnType="button"
                title="Registrasi"
                styles="bg-[#1dc071] hover:bg-green-600 px-6 py-2 rounded-[10px]"
                handleClick={() => navigate('/register-options')}
            />
          </>
        )}
      </div>

      {/* Navigasi Mobile */}
        <div className="sm:hidden flex justify-between items-center relative w-full">
            <Link to={user ? "/dashboard" : "/"}>
                <div className="w-[40px] h-[40px] rounded-[10px] bg-[#2c2f32] flex justify-center items-center cursor-pointer">
                    <img src={appLogo} alt="logo" className="w-[60%] h-[60%] object-contain" />
                </div>
            </Link>
            <span className="font-epilogue font-semibold text-white text-lg">IdeaFund IBIK</span>
          <img 
            src={appLogo} 
            alt="menu"
            className="w-[34px] h-[34px] object-contain cursor-pointer"
            onClick={() => setToggleDrawer((prev) => !prev)}
          />

          <div className={`absolute top-[60px] right-0 left-0 bg-[#13131a] z-20 shadow-xl py-4 ${!toggleDrawer ? '-translate-y-[120vh]' : 'translate-y-0'} transition-all duration-500 ease-in-out rounded-b-lg border-t border-gray-700`}>
            {user && (
                <div className="px-4 py-3 border-b border-gray-700 mb-2">
                    <p className="text-sm font-epilogue font-semibold text-white truncate" title={user.namaLengkap || user.nama}>{user.namaLengkap || user.nama}</p>
                    <p className="text-xs font-epilogue text-[#808191] truncate" title={user.email}>{user.email}</p>
                    <p className="text-xs font-epilogue text-[#4acd8d] capitalize">{user.role}</p>
                </div>
            )}
            <ul className="mb-4">
              {(user ? loggedInNavlinksForMobile : guestNavlinksForMobile).map((link) => {
                if (user && link.name.toLowerCase() === 'ajukan proyek' && user.role !== 'mahasiswa') return null;

                return (
                    <li
                    key={link.name}
                    className={`flex p-4 mx-2 rounded-md ${isActiveLink === link.link && !link.isLogout ? 'bg-[#2c2f32]' : ''} hover:bg-[#2c2f32] transition-colors`}
                    onClick={() => {
                        setIsActiveLink(link.link);
                        setToggleDrawer(false);
                        if (link.isLogout) {
                            handleLogout();
                        } else {
                            navigate(link.link);
                        }
                    }}
                    >
                    <img src={link.imgUrl} alt={link.name} className={`w-[24px] h-[24px] object-contain ${isActiveLink === link.link && !link.isLogout ? 'grayscale-0' : 'grayscale'}`} />
                    <p className={`ml-[20px] font-epilogue font-semibold text-[14px] ${isActiveLink === link.link && !link.isLogout ? 'text-[#1dc071]' : 'text-[#808191]'}`}>{link.name}</p>
                    </li>
                );
                })}
            </ul>

            {!user && !authIsLoading && (
                <div className="flex flex-col mx-4 gap-2">
                    <CustomButton 
                        btnType="button"
                        title="Login"
                        styles="w-full bg-[#8c6dfd] hover:bg-purple-700"
                        handleClick={() => {setToggleDrawer(false); navigate('/login');}}
                    />
                    <CustomButton 
                        btnType="button"
                        title="Registrasi"
                        styles="w-full bg-[#1dc071] hover:bg-green-600 mt-2"
                        handleClick={() => {setToggleDrawer(false); navigate('/register-options');}}
                    />
                </div>
            )}
            </div>
        </div>
    </div>
  );
};

export default Navbar;
