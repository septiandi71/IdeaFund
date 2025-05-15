// src/pages/RegisterDonaturPage2Otp.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { ConnectWallet, useAddress } from '@thirdweb-dev/react';
import { FormField, CustomButton, Loader } from '../components';

const RegisterDonaturPage2Otp = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { registerDonaturFinalize, isLoading, authError, setAuthError, clearAuthError } = useAuthContext();
    const connectedAddress = useAddress();

    const [otp, setOtp] = useState('');
    const [message, setMessage] = useState('');
    const emailForDisplay = location.state?.emailForDisplay;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        clearAuthError();
        if (!connectedAddress) {
            setAuthError("Silakan hubungkan wallet Anda terlebih dahulu.");
            return;
        }
        try {
            // Backend akan mengambil namaLengkap dan email dari session
            await registerDonaturFinalize({ otp, walletAddress: connectedAddress });
            setMessage("Registrasi Donatur berhasil! Anda akan diarahkan ke halaman login.");
            setTimeout(() => navigate('/login'), 3000); 
        } catch (err) {
            setMessage(err.message || "Gagal finalisasi registrasi.");
        }
    };

    return (
        <div className="bg-[#1c1c24] flex justify-center items-center flex-col rounded-[10px] sm:p-10 p-4">
            {isLoading && <Loader />}
            <div className="flex justify-center items-center p-[16px] sm:min-w-[380px] bg-[#3a3a43] rounded-[10px] mb-6">
                <h1 className="font-epilogue font-bold sm:text-[25px] text-[18px] leading-[38px] text-white">Registrasi Donatur (2/2)</h1>
            </div>
            {emailForDisplay && <p className="mt-2 text-center text-[#808191] mb-4">Verifikasi untuk Email: {emailForDisplay}</p>}
            
            <div className="w-full flex flex-col items-center max-w-md">
                 <p className="font-epilogue font-normal text-[16px] text-[#808191] mb-4 text-center">
                    Hubungkan dompet Metamask Anda, lalu masukkan kode OTP yang telah dikirim ke email Anda.
                </p>
                <div className="mb-6">
                    <ConnectWallet 
                        theme="light"
                        btnTitle={connectedAddress ? "Ganti Wallet" : "Hubungkan Wallet"}
                        modalSize="wide"
                    />
                </div>
                {connectedAddress && 
                    <p className="font-epilogue font-normal text-[14px] text-green-500 mb-4 break-all">
                        Wallet terhubung: {connectedAddress}
                    </p>
                }
            </div>

            <form onSubmit={handleSubmit} className="w-full mt-[30px] flex flex-col gap-[30px] max-w-md">
                <FormField 
                    labelName="Kode OTP *"
                    placeholder="Masukkan kode OTP 6 digit"
                    inputType="text"
                    name="otp"
                    value={otp}
                    handleChange={(e) => setOtp(e.target.value)}
                    isRequired={true}
                />
              
                <CustomButton 
                    btnType="submit"
                    title="Finalisasi Registrasi"
                    styles="bg-[#8c6dfd] mt-4"
                    disabled={isLoading || !connectedAddress}
                />
            </form>
            {message && <p className="mt-4 text-center text-[#808191]">{message}</p>}
            {authError && <p className="mt-4 text-center text-red-500">Error: {authError}</p>}
        </div>
    );
};
export default RegisterDonaturPage2Otp;