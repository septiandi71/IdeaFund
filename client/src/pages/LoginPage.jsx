// src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext'; // Pastikan path ini benar

// Impor dari Thirdweb SDK baru
import { createThirdwebClient } from "thirdweb";
import { ConnectButton, useActiveAccount } from "thirdweb/react"; // useActiveAccount untuk mendapatkan info wallet
import { createWallet, injectedProvider } from "thirdweb/wallets"; // createWallet untuk daftar wallet

import { FormField, CustomButton, Loader } from '../components'; // Komponen UI Anda

// 1. Definisikan Thirdweb Client di luar komponen jika tidak berubah, atau di dalam jika props diperlukan
// Pastikan VITE_THIRDWEB_CLIENT_ID sudah ada di file .env.local atau .env Anda
const thirdwebClientId = "8c69441790f9fbaabbb795a921abb3f1"; // Ganti dengan Client ID Anda jika perlu

if (!thirdwebClientId) {
  console.error("KRITIS: VITE_THIRDWEB_CLIENT_ID tidak ditemukan atau tidak valid!");
}

const client = createThirdwebClient({
  clientId: thirdwebClientId,
});

// 2. Definisikan daftar wallet yang didukung
const supportedWallets = [
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
  // Tambahkan wallet lain jika perlu, misalnya:
  // createWallet("org.uniswap"),
  // createWallet("io.zerion.wallet"),
  // Jika ingin mendukung semua wallet yang terdeteksi di browser:
  // {
  //   id: "injected",
  //   title: "Browser Wallet",
  //   isInstalled: () => !!injectedProvider("ethereum"),
  //   getConnector: async () => {
  //     const { InjectedConnector } = await import("@thirdweb-dev/wallets");
  //     return new InjectedConnector({ options: { shimDisconnect: true } });
  //   }
  // }
];


const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { 
        loginRequestOtp, 
        loginVerifyOtp, 
        isLoading: authIsLoading, // Mengganti nama agar tidak konflik
        authError, 
        clearAuthError, 
        isAuthenticated,
        user 
    } = useAuthContext();
    
    // Menggunakan hook useActiveAccount dari "thirdweb/react" untuk mendapatkan akun yang aktif
    const activeAccount = useActiveAccount();
    const connectedAddress = activeAccount?.address; // Alamat wallet yang terhubung

    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [message, setMessage] = useState('');
    const [pageLoading, setPageLoading] = useState(false); // State loading lokal

    console.log("LoginPage Rendered. isAuthenticated:", isAuthenticated, "User:", user, "AuthLoading:", authIsLoading, "Connected Wallet:", connectedAddress);

    useEffect(() => {
        clearAuthError();
        if (isAuthenticated && user) {
            console.log("LoginPage: User sudah terautentikasi, navigasi ke dashboard.");
            const from = location.state?.from?.pathname || '/dashboard';
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, user, navigate, location.state, clearAuthError]);

    // Efek untuk otomatis meminta OTP jika wallet sudah terhubung dan OTP belum diminta
    // Ini bisa diaktifkan jika Anda ingin alur yang lebih otomatis
    // useEffect(() => {
    //     if (connectedAddress && !otpSent && !authIsLoading && !pageLoading) {
    //         handleRequestOtp();
    //     }
    // }, [connectedAddress, otpSent, authIsLoading, pageLoading]);


    const handleRequestOtp = async () => {
        setMessage('');
        clearAuthError();
        if (!connectedAddress) {
            setAuthError("Hubungkan wallet Anda terlebih dahulu untuk meminta OTP.");
            return;
        }
        setPageLoading(true);
        try {
            console.log("LoginPage: Meminta OTP untuk wallet:", connectedAddress);
            const response = await loginRequestOtp(connectedAddress);
            setMessage(response.message || "OTP telah dikirim ke email Anda.");
            setOtpSent(true);
        } catch (err) {
            setMessage(err.message || "Gagal meminta OTP login. Periksa konsol untuk detail.");
            console.error("LoginPage: Error saat handleRequestOtp:", err);
        } finally {
            setPageLoading(false);
        }
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
        setPageLoading(true);
        try {
            console.log("LoginPage: Verifikasi OTP untuk wallet:", connectedAddress, "OTP:", otp);
            const response = await loginVerifyOtp(connectedAddress, otp);
            setMessage(response.message || "Login berhasil!");
            // Navigasi akan dihandle oleh useEffect yang memantau isAuthenticated
        } catch (err) {
            setMessage(err.message || "OTP salah atau login gagal.");
            setOtpSent(false); 
            console.error("LoginPage: Error saat handleVerifyOtpAndLogin:", err);
        } finally {
            setPageLoading(false);
        }
    };

    if (authIsLoading && !user && !authError) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-[#13131a]">
                <Loader message="Memuat sesi pengguna..." />
            </div>
        );
    }

    return (
        <div className="bg-[#13131a] flex justify-center items-center flex-col min-h-[calc(100vh-150px)] p-4">
            <div className="bg-[#1c1c24] p-6 sm:p-8 rounded-[10px] shadow-md w-full max-w-md">
                {(pageLoading) && <Loader message="Memproses..."/>}
                <div className="flex justify-center items-center p-[16px] bg-[#3a3a43] rounded-[10px] mb-8">
                    <h1 className="font-epilogue font-bold sm:text-[25px] text-[18px] leading-[38px] text-white">Login Pengguna</h1>
                </div>
                
                <div className="w-full flex flex-col items-center">
                    <p className="font-epilogue font-normal text-[16px] text-[#808191] mb-4 text-center">
                        {!otpSent ? "Hubungkan dompet Anda untuk melanjutkan." : "Kode OTP telah dikirim ke email terdaftar untuk wallet ini."}
                    </p>
                    <div className="mb-6 flex justify-center">
                        <ConnectButton
                          client={client}
                          wallets={supportedWallets}
                          theme={"light"} // atau "dark"
                          connectModal={{
                            size: "wide", // atau "compact"
                          }}
                          // Anda bisa menambahkan onConnect, onDisconnect, dll. jika perlu
                          // onConnect={(wallet) => console.log("Wallet connected:", wallet.getAddress())}
                        />
                    </div>
                    {connectedAddress && 
                        <p className="font-epilogue font-normal text-[14px] text-green-500 mb-4 break-all text-center">
                            Wallet Terhubung: {connectedAddress}
                        </p>
                    }
                </div>

                {connectedAddress && !otpSent && (
                    <div className="w-full mt-[10px]">
                        <CustomButton 
                            btnType="button"
                            title={pageLoading ? "Meminta OTP..." : "Minta Kode OTP"}
                            styles="w-full bg-[#8c6dfd] hover:bg-purple-600"
                            handleClick={handleRequestOtp}
                            disabled={pageLoading}
                        />
                    </div>
                )}

                {otpSent && connectedAddress && (
                    <form onSubmit={handleVerifyOtpAndLogin} className="w-full mt-[10px] flex flex-col gap-[20px]">
                        <FormField 
                            labelName="Kode OTP"
                            placeholder="Masukkan kode OTP 6 digit"
                            inputType="text"
                            name="otp"
                            value={otp}
                            handleChange={(e) => setOtp(e.target.value)}
                            isRequired={true}
                            styles="text-white"
                            disabled={pageLoading}
                        />
                        <CustomButton 
                            btnType="submit"
                            title={pageLoading ? "Memproses Login..." : "Login dengan OTP"}
                            styles="w-full bg-[#1dc071] hover:bg-green-600"
                            disabled={pageLoading}
                        />
                    </form>
                )}
                {message && <p className="mt-4 text-center text-sm text-[#b2b3bd]">{message}</p>}
                {authError && <p className="mt-4 text-center text-sm text-red-400">Error: {authError}</p>}
                
                <p className="mt-6 text-center font-epilogue text-xs text-[#808191]">
                    Belum punya akun? <a href="/register-options" className="text-[#4acd8d] hover:underline">Registrasi di sini</a>
                </p>
            </div>
        </div>
    );
};
export default LoginPage;
