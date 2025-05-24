// src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom'; // Tambahkan Link
import { useAuthContext } from '../context/AuthContext'; 

// Impor dari Thirdweb SDK baru
import { ConnectButton, useActiveAccount } from "thirdweb/react"; 
import { supportedWallets } from '../thirdwebClient'; // Impor supportedWallets

import { FormField, CustomButton, Loader } from '../components'; 

// Terima 'client' sebagai prop
const LoginPage = ({ client }) => { 
    const navigate = useNavigate();
    const location = useLocation();
    const { 
        loginRequestOtp, 
        loginVerifyOtp, 
        isLoading: authIsLoading,
        authError, 
        clearAuthError, 
        isAuthenticated,
        user 
    } = useAuthContext();
    
    const activeAccount = useActiveAccount();
    const connectedAddress = activeAccount?.address;

    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [message, setMessage] = useState('');
    // pageLoading sekarang akan dikontrol oleh authIsLoading dari context untuk konsistensi
    // const [pageLoading, setPageLoading] = useState(false); 

    useEffect(() => {
        clearAuthError();
        if (isAuthenticated && user) {
            console.log("LoginPage: User sudah terautentikasi, navigasi ke dashboard.");
            const from = location.state?.from?.pathname || '/dashboard';
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, user, navigate, location.state, clearAuthError]);

    const handleRequestOtp = async () => {
        setMessage('');
        clearAuthError();
        if (!connectedAddress) {
            // setAuthError di AuthContext akan menangani pesan ini jika diperlukan
            // atau bisa set message lokal
            setMessage("Hubungkan wallet Anda terlebih dahulu untuk meminta OTP.");
            return;
        }
        // authIsLoading akan di-set true oleh callApi di AuthContext
        try {
            console.log("LoginPage: Meminta OTP untuk wallet:", connectedAddress);
            const response = await loginRequestOtp(connectedAddress);
            setMessage(response.message || "OTP telah dikirim ke email Anda.");
            setOtpSent(true);
        } catch (err) {
            // authError sudah di-set oleh context
            setMessage(err.message || "Gagal meminta OTP login.");
            console.error("LoginPage: Error saat handleRequestOtp:", err);
        }
        // authIsLoading akan di-set false oleh callApi di AuthContext
    };

    const handleVerifyOtpAndLogin = async (e) => {
        e.preventDefault();
        setMessage('');
        clearAuthError();
        if (!connectedAddress) {
            setAuthError("Wallet tidak terhubung. Silakan hubungkan wallet Anda.");
            return;
        }
        if (!otp.trim()) {
            setAuthError("Kode OTP tidak boleh kosong.");
            return;
        }
        // authIsLoading akan di-set true oleh callApi di AuthContext
        try {
            console.log("LoginPage: Verifikasi OTP untuk wallet:", connectedAddress, "OTP:", otp);
            await loginVerifyOtp(connectedAddress, otp);
            // Navigasi akan dihandle oleh useEffect yang memantau isAuthenticated
            // setMessage("Login berhasil! Mengarahkan..."); // Pesan ini mungkin tidak terlihat lama
        } catch (err) {
            setMessage(err.message || "OTP salah atau login gagal.");
            setOtpSent(false); 
            console.error("LoginPage: Error saat handleVerifyOtpAndLogin:", err);
        }
        // authIsLoading akan di-set false oleh callApi di AuthContext
    };

    // Jika AuthContext masih loading data user awal dan belum ada user/error
    if (authIsLoading && !user && !authError && !isAuthenticated) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-[#13131a]">
                <Loader message="Memuat sesi pengguna..." />
            </div>
        );
    }

    return (
        // Container utama halaman ini, akan ditengahkan oleh LandingPageLayout (jika digunakan)
        <div className="bg-[#1c1c24] flex flex-col items-center rounded-[20px] sm:p-10 p-6 w-full max-w-lg shadow-2xl">
            {authIsLoading && <Loader message="Memproses..."/>}
            
            <div className="flex flex-col items-center w-full mb-8">
                <div className="p-3 bg-[#2c2f32] rounded-full inline-block mb-4 shadow-md">
                    {/* Ikon Login */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#8c6dfd" className="w-10 h-10">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9M7.5 12h6" />
                    </svg>
                </div>
                <h1 className="font-epilogue font-bold sm:text-2xl text-xl text-center leading-tight text-white">
                    Login ke IdeaFund IBIK
                </h1>
                <p className="font-epilogue font-normal text-sm text-[#808191] mt-2 text-center max-w-xs">
                    {!otpSent ? "Hubungkan dompet Anda untuk memulai." : "Masukkan kode OTP yang telah dikirim."}
                </p>
            </div>

            <div className="w-full flex flex-col items-center mb-6">
                <ConnectButton
                    client={client}
                    wallets={supportedWallets}
                    theme={"dark"} 
                    connectModal={{
                        size: "compact",
                        title: "Hubungkan Dompet Anda",
                        welcomeScreen: {
                            title: "Selamat Datang Kembali!",
                            subtitle: "Hubungkan dompet untuk mengakses akun IdeaFund Anda."
                        }
                    }}
                    detailsButton={{ // Kustomisasi tombol setelah terhubung
                        className: "!bg-[#2c2f32] !text-white !font-epilogue !rounded-[10px] !hover:bg-[#3a3a43]",
                        // Anda bisa menambahkan children di sini jika mau
                    }}
                    // onConnect={() => {
                    //     clearAuthError();
                    //     setMessage(''); // Bersihkan pesan saat wallet baru terhubung
                    //     setOtpSent(false); // Reset status OTP sent
                    //     setOtp(''); // Reset input OTP
                    // }}
                />
                {connectedAddress && 
                    <p className="font-epilogue font-normal text-xs sm:text-sm text-green-500 mt-3 break-all text-center">
                        Wallet Terhubung: {connectedAddress}
                    </p>
                }
            </div>

            {connectedAddress && !otpSent && (
                <div className="w-full mt-[10px]">
                    <CustomButton 
                        btnType="button"
                        title={authIsLoading ? "Meminta OTP..." : "Minta Kode OTP"}
                        styles="w-full bg-[#8c6dfd] hover:bg-purple-600 py-3 text-base"
                        handleClick={handleRequestOtp}
                        disabled={authIsLoading}
                    />
                </div>
            )}

            {otpSent && connectedAddress && (
                <form onSubmit={handleVerifyOtpAndLogin} className="w-full mt-[10px] flex flex-col gap-5">
                    <FormField 
                        labelName="Kode OTP"
                        placeholder="Masukkan 6 digit kode OTP"
                        inputType="text"
                        name="otp"
                        value={otp}
                        handleChange={(e) => setOtp(e.target.value)}
                        isRequired={true}
                        styles="text-white" // Pastikan FormField Anda mendukung prop styles
                        disabled={authIsLoading}
                    />
                    <CustomButton 
                        btnType="submit"
                        title={authIsLoading ? "Memproses Login..." : "Login dengan OTP"}
                        styles="w-full bg-[#1dc071] hover:bg-green-600 py-3 text-base"
                        disabled={authIsLoading}
                    />
                </form>
            )}
            {message && !authError && <p className="mt-5 text-center text-sm text-green-400">{message}</p>}
            {authError && <p className="mt-5 text-center text-sm text-red-400">Error: {authError}</p>}
            
            <p className="mt-8 text-center font-epilogue text-xs text-[#808191]">
                Belum punya akun? <Link to="/register-options" className="text-[#4acd8d] hover:underline font-semibold">Registrasi di sini</Link>
            </p>
        </div>
    );
};
export default LoginPage;
