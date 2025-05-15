// src/pages/RegisterMahasiswaPage2Otp.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext'; 
import { ConnectButton, useActiveAccount } from "thirdweb/react"; 
import { createThirdwebClient } from "thirdweb";
import { createWallet } from "thirdweb/wallets"; 
import { FormField, CustomButton, Loader } from '../components'; 

const thirdwebClientId = "8c69441790f9fbaabbb795a921abb3f1"; // Pastikan ini benar
const client = createThirdwebClient({ clientId: thirdwebClientId });
const supportedWallets = [createWallet("io.metamask"), createWallet("com.coinbase.wallet")];

const RegisterMahasiswaPage2Otp = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { 
        registerMahasiswaFinalize, 
        isLoading: authIsLoading, // Ini adalah isLoading dari AuthContext
        authError, 
        setAuthError, 
        clearAuthError,
        isAuthenticated, 
        user 
    } = useAuthContext();
    
    const activeAccount = useActiveAccount(); 
    const connectedAddress = activeAccount?.address;

    const [otp, setOtp] = useState('');
    const [message, setMessage] = useState('');
    // Hapus pageLoading lokal jika authIsLoading dari context sudah cukup
    // const [pageLoading, setPageLoading] = useState(false); 
    
    const nimForDisplay = location.state?.nimForDisplay;

    useEffect(() => {
        clearAuthError();
    }, [clearAuthError]);

    // useEffect untuk navigasi setelah user state di AuthContext terupdate
    useEffect(() => {
        if (isAuthenticated && user && user.role === 'mahasiswa') { // Pastikan role juga sesuai jika perlu
            console.log("RegisterMahasiswaPage2Otp: Registrasi sukses & user terautentikasi, navigasi ke dashboard...");
            setMessage("Registrasi berhasil! Mengarahkan ke dashboard..."); // Pesan ini mungkin tidak terlihat lama
            const timer = setTimeout(() => {
                navigate('/dashboard', { replace: true }); 
            }, 1500); // Kurangi jeda agar lebih cepat
            return () => clearTimeout(timer);
        }
    }, [isAuthenticated, user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        clearAuthError();

        if (!connectedAddress) {
            setAuthError("Silakan hubungkan dompet Metamask Anda terlebih dahulu.");
            return;
        }
        if (!otp.trim()) {
            setAuthError("Kode OTP tidak boleh kosong.");
            return;
        }
        
        // authIsLoading akan di-set true oleh fungsi di AuthContext
        try {
            const response = await registerMahasiswaFinalize({ otp, walletAddress: connectedAddress });
            // Jika sukses, AuthContext akan update user & isAuthenticated,
            // lalu useEffect di atas akan menangani navigasi.
            // Kita bisa set pesan sukses sementara di sini sebelum navigasi.
            setMessage(response.message || "Registrasi Mahasiswa sedang diproses...");
        } catch (err) {
            // authError sudah di-set oleh context
            setMessage(err.message || "Gagal finalisasi registrasi. Periksa kembali OTP Anda.");
        }
        // Tidak perlu setPageLoading(false) jika pakai authIsLoading dari context
    };

    return (
        <div className="bg-[#1c1c24] flex flex-col items-center rounded-[20px] sm:p-10 p-6 w-full max-w-lg shadow-2xl">
            {authIsLoading && <Loader message="Memfinalisasi registrasi..."/>} 
            
            <div className="flex flex-col items-center w-full mb-8">
                <div className="p-3 bg-[#2c2f32] rounded-full inline-block mb-4 shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#4acd8d" className="w-10 h-10">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                </div>
                <h1 className="font-epilogue font-bold sm:text-2xl text-xl text-center leading-tight text-white">
                    Verifikasi Akun Mahasiswa
                </h1>
                <p className="font-epilogue font-normal text-sm text-[#808191] mt-2 text-center max-w-xs">
                    Tahap 2: Hubungkan Wallet & Masukkan OTP
                    {nimForDisplay ? ` (NIM: ${nimForDisplay})` : ''}.
                </p>
            </div>

            <div className="w-full flex flex-col items-center mb-6">
                <p className="font-epilogue font-normal text-[14px] text-[#b2b3bd] mb-3 text-center">
                    Langkah 1: Hubungkan Dompet Metamask Anda
                </p>
                <ConnectButton
                    client={client}
                    wallets={supportedWallets}
                    theme={"light"} 
                    connectModal={{
                        size: "wide",
                        title: "Pilih Dompet Anda",
                        welcomeScreen: {
                            title: "Selamat Datang di IBIK IdeaFund",
                            subtitle: "Hubungkan dompet untuk melanjutkan registrasi mahasiswa Anda."
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
                    disabled={authIsLoading} // Menggunakan authIsLoading dari context
                />
              
                <CustomButton 
                    btnType="submit"
                    title={authIsLoading ? "Memfinalisasi..." : "Verifikasi & Finalisasi Registrasi"}
                    styles="bg-[#1dc071] mt-4 hover:bg-green-600 transition-colors py-3 text-base"
                    disabled={authIsLoading || !connectedAddress}
                />
            </form>
            {/* Pesan sukses/error akan ditampilkan oleh AuthContext atau message lokal */}
            {message && !authError && <p className="mt-5 text-center text-sm text-green-400">{message}</p>}
            {authError && <p className="mt-5 text-center text-sm text-red-400">Error: {authError}</p>}
            {!authError && message.includes("berhasil") && !authIsLoading && ( // Pesan tambahan jika sukses sebelum redirect
                 <p className="mt-2 text-center text-sm text-green-400">Mengarahkan ke Dashboard...</p>
            )}
        </div>
    );
};

export default RegisterMahasiswaPage2Otp;
