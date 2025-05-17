// src/pages/RegisterDonaturPage2Otp.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext'; 
import { ConnectButton, useActiveAccount } from "thirdweb/react"; 
import { createThirdwebClient } from "thirdweb";
import { createWallet } from "thirdweb/wallets"; 
import { FormField, CustomButton, Loader } from '../components'; 

// Inisialisasi Thirdweb Client (jika belum global)
const thirdwebClientId = import.meta.env.VITE_THIRDWEB_CLIENT_ID || "YOUR_FALLBACK_CLIENT_ID";
const client = createThirdwebClient({ clientId: thirdwebClientId });
const supportedWallets = [createWallet("io.metamask"), createWallet("com.coinbase.wallet")];

const RegisterDonaturPage2Otp = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { 
        registerDonaturFinalize, 
        isLoading: authIsLoading, 
        authError, 
        clearAuthError,
        isAuthenticated, // Untuk redirect jika sudah login
        user 
    } = useAuthContext();
    
    const activeAccount = useActiveAccount(); 
    const connectedAddress = activeAccount?.address;

    const [otp, setOtp] = useState('');
    const [message, setMessage] = useState('');
    
    const emailForDisplay = location.state?.emailForDisplay; // Ambil dari navigasi

    useEffect(() => {
        clearAuthError();
    }, [clearAuthError]);

    useEffect(() => {
        if (isAuthenticated && user) {
            // Jika sudah terautentikasi (misalnya setelah registrasi sukses)
            setMessage("Registrasi berhasil! Mengarahkan ke dashboard...");
            const timer = setTimeout(() => {
                navigate('/dashboard', { replace: true }); 
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [isAuthenticated, user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        clearAuthError();

        if (!connectedAddress) {
            // setAuthError dari context akan menangani ini
            setMessage("Silakan hubungkan dompet Metamask Anda terlebih dahulu.");
            return;
        }
        if (!otp.trim()) {
            setMessage("Kode OTP tidak boleh kosong.");
            return;
        }
        
        try {
            // Backend akan mengambil namaLengkap dan email dari session
            const response = await registerDonaturFinalize({ otp, walletAddress: connectedAddress });
            // Pesan sukses akan ditampilkan, dan useEffect di atas akan menangani navigasi
            setMessage(response.message || "Registrasi Donatur sedang diproses...");
        } catch (err) {
            setMessage(err.message || "Gagal finalisasi registrasi. Periksa kembali OTP Anda.");
        }
    };

    return (
        <div className="bg-[#1c1c24] flex flex-col items-center rounded-[20px] sm:p-10 p-6 w-full max-w-lg shadow-2xl">
            {authIsLoading && <Loader message="Memfinalisasi registrasi..."/>} 
            
            <div className="flex flex-col items-center w-full mb-8">
                <div className="p-3 bg-[#2c2f32] rounded-full inline-block mb-4 shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#8c6dfd" className="w-10 h-10">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0H9.375m3.375 0A2.625 2.625 0 1 0 14.625 7.5M12 10.875v-3.375m0 0h3.375M12 10.875H9.375m1.5-3.375A2.625 2.625 0 1 1 12 4.875v0Z" />
                    </svg>
                </div>
                <h1 className="font-epilogue font-bold sm:text-2xl text-xl text-center leading-tight text-white">
                    Verifikasi Akun Donatur
                </h1>
                <p className="font-epilogue font-normal text-sm text-[#808191] mt-2 text-center max-w-xs">
                    Tahap 2: Hubungkan Wallet & Masukkan OTP
                    {emailForDisplay ? ` (untuk ${emailForDisplay})` : ''}.
                </p>
            </div>

            <div className="w-full flex flex-col items-center mb-6">
                <p className="font-epilogue font-normal text-[14px] text-[#b2b3bd] mb-3 text-center">
                    Langkah 1: Hubungkan Dompet Metamask Anda
                </p>
                <ConnectButton
                    client={client}
                    wallets={supportedWallets}
                    theme={"dark"} 
                    connectModal={{
                        size: "compact",
                        title: "Pilih Dompet Anda",
                        welcomeScreen: {
                            title: "Selamat Datang di IBIK IdeaFund",
                            subtitle: "Hubungkan dompet untuk menyelesaikan registrasi donatur Anda."
                        }
                    }}
                />
                {connectedAddress && 
                    <p className="font-epilogue font-normal text-xs sm:text-sm text-green-500 mt-3 break-all text-center">
                        Wallet Terhubung: {connectedAddress}
                    </p>
                }
            </div>

            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
                <FormField 
                    labelName="Kode OTP"
                    placeholder="Masukkan 6 digit kode OTP"
                    inputType="text"
                    name="otp"
                    value={otp}
                    handleChange={(e) => setOtp(e.target.value)}
                    isRequired={true}
                    styles="text-white" 
                    disabled={authIsLoading}
                />
              
                <CustomButton 
                    btnType="submit"
                    title={authIsLoading ? "Memfinalisasi..." : "Verifikasi & Finalisasi Registrasi"}
                    styles="bg-[#8c6dfd] mt-4 hover:bg-purple-600 transition-colors py-3 text-base"
                    disabled={authIsLoading || !connectedAddress}
                />
            </form>
            {message && !authError && <p className="mt-5 text-center text-sm text-green-400">{message}</p>}
            {authError && <p className="mt-5 text-center text-sm text-red-400">Error: {authError}</p>}
             {!authError && message.includes("berhasil") && !authIsLoading && (
                 <p className="mt-2 text-center text-sm text-green-400">Mengarahkan ke Dashboard...</p>
            )}
        </div>
    );
};

export default RegisterDonaturPage2Otp;
