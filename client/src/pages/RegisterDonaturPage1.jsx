// src/pages/RegisterDonaturPage1.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext'; // Pastikan path ini benar
import { FormField, CustomButton, Loader } from '../components'; // Pastikan path ini benar

const RegisterDonaturPage1 = () => {
    const navigate = useNavigate();
    const { 
        registerDonaturRequestOtp, 
        isLoading: authIsLoading, // Menggunakan isLoading dari AuthContext
        authError, 
        clearAuthError 
    } = useAuthContext();

    const [formData, setFormData] = useState({
        namaLengkap: '',
        email: '',
    });
    const [message, setMessage] = useState('');

    useEffect(() => {
        clearAuthError(); // Bersihkan error sebelumnya saat komponen dimuat
    }, [clearAuthError]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        clearAuthError();

        if (!formData.namaLengkap.trim() || !formData.email.trim()) {
            // authError akan di-set oleh context jika validasi backend gagal,
            // tapi validasi frontend dasar bisa set message lokal atau authError juga.
            // Untuk konsistensi, kita bisa panggil setAuthError dari context.
            // Namun, untuk error input form, seringkali lebih baik message lokal.
            setMessage("Nama lengkap dan email tidak boleh kosong.");
            return;
        }
        
        try {
            const response = await registerDonaturRequestOtp({ 
                namaLengkap: formData.namaLengkap, 
                email: formData.email 
            });
            setMessage(response.message || "OTP telah dikirim ke email Anda.");
            // Navigasi ke halaman OTP, kirim email untuk ditampilkan (opsional)
            // Data utama (namaLengkap, email, otp) akan disimpan di session backend
            navigate('/register-donatur-otp', { 
                state: { 
                    emailForDisplay: formData.email,
                } 
            }); 
        } catch (err) {
            // authError sudah di-set oleh context jika error dari API call
            setMessage(err.message || "Gagal meminta OTP registrasi. Periksa kembali data Anda.");
        }
    };

    return (
        <div className="bg-[#1c1c24] flex flex-col items-center rounded-[20px] sm:p-10 p-6 w-full max-w-lg shadow-2xl">
            {authIsLoading && <Loader message="Memproses permintaan OTP..."/>} 
            
            <div className="flex flex-col items-center w-full mb-8">
                <div className="p-3 bg-[#2c2f32] rounded-full inline-block mb-4 shadow-md">
                    {/* Ikon untuk Donatur */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#8c6dfd" className="w-10 h-10">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                    </svg>
                </div>
                <h1 className="font-epilogue font-bold sm:text-2xl text-xl text-center leading-tight text-white">
                    Registrasi Akun Donatur
                </h1>
                <p className="font-epilogue font-normal text-sm text-[#808191] mt-2 text-center">
                    Tahap 1: Masukkan Informasi Anda
                </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
                <FormField 
                    labelName="Nama Lengkap"
                    placeholder="Masukkan nama lengkap Anda"
                    inputType="text"
                    name="namaLengkap"
                    value={formData.namaLengkap}
                    handleChange={handleChange}
                    isRequired={true}
                    styles="text-white"
                    disabled={authIsLoading}
                />
                <FormField 
                    labelName="Alamat Email"
                    placeholder="Masukkan alamat email aktif Anda"
                    inputType="email"
                    name="email"
                    value={formData.email}
                    handleChange={handleChange}
                    isRequired={true}
                    styles="text-white"
                    disabled={authIsLoading}
                />
              
                <CustomButton 
                    btnType="submit"
                    title={authIsLoading ? "Memproses..." : "Lanjut & Kirim OTP"}
                    styles="bg-[#8c6dfd] mt-6 hover:bg-purple-600 transition-colors py-3 text-base"
                    disabled={authIsLoading}
                />
            </form>
            {message && !authError && <p className="mt-5 text-center text-sm text-green-400">{message}</p>}
            {authError && <p className="mt-5 text-center text-sm text-red-400">Error: {authError}</p>}
        </div>
    );
};

export default RegisterDonaturPage1;
