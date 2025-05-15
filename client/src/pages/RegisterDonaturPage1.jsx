// src/pages/RegisterDonaturPage1.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { FormField, CustomButton, Loader } from '../components';

const RegisterDonaturPage1 = () => {
    const navigate = useNavigate();
    const { registerDonaturRequestOtp, isLoading, authError, setAuthError, clearAuthError } = useAuthContext();
    const [formData, setFormData] = useState({
        namaLengkap: '',
        email: '',
    });
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        clearAuthError();
        try {
            const response = await registerDonaturRequestOtp(formData); // Mengirim namaLengkap dan email
            setMessage(response.message);
            // Simpan email dan namaLengkap untuk tahap berikutnya via state navigasi
            navigate('/register-donatur-otp', { 
                state: { 
                    emailForDisplay: formData.email,
                    // namaLengkap akan ada di session backend
                } 
            }); 
        } catch (err) {
            setMessage(err.message || "Gagal meminta OTP registrasi.");
        }
    };

    return (
        <div className="bg-[#1c1c24] flex justify-center items-center flex-col rounded-[10px] sm:p-10 p-4">
            {isLoading && <Loader />}
             <div className="flex justify-center items-center p-[16px] sm:min-w-[380px] bg-[#3a3a43] rounded-[10px] mb-8">
                <h1 className="font-epilogue font-bold sm:text-[25px] text-[18px] leading-[38px] text-white">Registrasi Donatur (1/2)</h1>
            </div>
            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-[30px] max-w-md">
                <FormField 
                    labelName="Nama Lengkap *"
                    placeholder="Masukkan nama lengkap Anda"
                    inputType="text"
                    name="namaLengkap"
                    value={formData.namaLengkap}
                    handleChange={handleChange}
                    isRequired={true}
                />
                <FormField 
                    labelName="Email *"
                    placeholder="Masukkan alamat email Anda"
                    inputType="email"
                    name="email"
                    value={formData.email}
                    handleChange={handleChange}
                    isRequired={true}
                />
                <CustomButton 
                    btnType="submit"
                    title="Lanjut & Kirim OTP"
                    styles="bg-[#8c6dfd] mt-4"
                    disabled={isLoading}
                />
            </form>
            {message && <p className="mt-4 text-center text-[#808191]">{message}</p>}
            {authError && <p className="mt-4 text-center text-red-500">Error: {authError}</p>}
        </div>
    );
};
export default RegisterDonaturPage1;