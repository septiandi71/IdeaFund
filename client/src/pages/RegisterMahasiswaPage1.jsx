// src/pages/RegisterMahasiswaPage1.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { FormField, CustomButton, Loader } from '../components';
import axios from 'axios'; 

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const RegisterMahasiswaPage1 = () => {
    const navigate = useNavigate();
    const { registerMahasiswaRequestOtp, isLoading: authIsLoading, authError, setAuthError, clearAuthError } = useAuthContext(); 
    
    const [fakultasList, setFakultasList] = useState([]);
    const [prodiList, setProdiList] = useState([]);
    const [selectedFakultas, setSelectedFakultas] = useState('');
    const [formData, setFormData] = useState({
        nim: '',
        id_prodi: '',
    });
    const [message, setMessage] = useState('');
    const [isDropdownLoading, setIsDropdownLoading] = useState(false);

    const fetchFakultas = useCallback(async () => {
        setIsDropdownLoading(true);
        clearAuthError();
        try {
            const response = await axios.get(`${API_BASE_URL}/data/fakultas`); 
            setFakultasList(response.data || []);
        } catch (error) {
            console.error("Gagal mengambil data fakultas:", error);
            setAuthError("Gagal mengambil data fakultas. Pastikan API backend berjalan dan endpoint /data/fakultas tersedia.");
        } finally {
            setIsDropdownLoading(false);
        }
    }, [setAuthError, clearAuthError]);

    useEffect(() => {
        fetchFakultas();
    }, [fetchFakultas]);

    const fetchProdi = useCallback(async () => {
        if (selectedFakultas) {
            setIsDropdownLoading(true);
            clearAuthError();
            try {
                const response = await axios.get(`${API_BASE_URL}/data/prodi?fakultasId=${selectedFakultas}`);
                setProdiList(response.data || []);
                setFormData(prev => ({ ...prev, id_prodi: '' })); 
            } catch (error) {
                console.error("Gagal mengambil data prodi:", error);
                setAuthError("Gagal mengambil data prodi.");
            } finally {
                setIsDropdownLoading(false);
            }
        } else {
            setProdiList([]);
            setFormData(prev => ({ ...prev, id_prodi: '' }));
        }
    }, [selectedFakultas, setAuthError, clearAuthError]);

    useEffect(() => {
        fetchProdi();
    }, [fetchProdi]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevFormData => ({
            ...prevFormData,
            [name]: value
        }));
    };
    
    const handleFakultasChange = (e) => {
        setSelectedFakultas(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        clearAuthError();
        if (!selectedFakultas) {
            setAuthError("Fakultas harus dipilih.");
            return;
        }
        if (!formData.id_prodi) {
            setAuthError("Program Studi harus dipilih.");
            return;
        }
        if (!formData.nim.trim()) {
            setAuthError("NIM tidak boleh kosong.");
            return;
        }

        try {
            const dataToSend = { 
                nim: formData.nim, 
                id_prodi: formData.id_prodi,
                id_fakultas: selectedFakultas 
            };
            const response = await registerMahasiswaRequestOtp(dataToSend);
            setMessage(response.message);
            navigate('/register-mahasiswa-otp', { 
                state: { 
                    nimForDisplay: formData.nim, 
                } 
            }); 
        } catch (err) {
            setMessage(err.message || "Gagal meminta OTP registrasi. Periksa kembali data Anda.");
        }
    };

    const combinedIsLoading = authIsLoading || isDropdownLoading;

    return (
        <div className="bg-[#1c1c24] flex flex-col items-center rounded-[20px] sm:p-10 p-6 w-full max-w-lg shadow-2xl transition-all duration-300 ease-in-out">
            {authIsLoading && <Loader message="Memproses permintaan OTP..."/>} 
            {/* Loader untuk dropdown loading bisa dibuat terpisah jika ingin lebih spesifik */}
            
            <div className="flex flex-col items-center w-full mb-8">
                <div className="p-3 bg-[#2c2f32] rounded-full inline-block mb-4 shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#4acd8d" className="w-10 h-10">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                </div>
                <h1 className="font-epilogue font-bold sm:text-2xl text-xl text-center leading-tight text-white">
                    Registrasi Akun Mahasiswa
                </h1>
                <p className="font-epilogue font-normal text-sm text-[#808191] mt-2 text-center">
                    Tahap 1: Verifikasi Data Akademik
                </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
                <div>
                    <label htmlFor="fakultas" className="font-epilogue font-medium text-[14px] leading-[22px] text-[#808191] mb-[10px] block">
                        Fakultas <span className="text-red-400">*</span>
                    </label>
                    <select 
                        name="fakultas" 
                        id="fakultas"
                        value={selectedFakultas} 
                        onChange={handleFakultasChange}
                        required
                        disabled={isDropdownLoading || authIsLoading}
                        className="py-3 sm:px-5 px-4 outline-none border-[1px] border-[#3a3a43] bg-transparent font-epilogue text-white text-[14px] placeholder:text-[#4b5264] rounded-[10px] w-full focus:border-[#4acd8d] transition-colors duration-200 ease-in-out disabled:opacity-60"
                    >
                        <option value="" disabled>Pilih Fakultas Anda</option>
                        {isDropdownLoading && fakultasList.length === 0 && <option value="" disabled>Memuat fakultas...</option>}
                        {fakultasList.map(fak => (
                            <option key={fak.id_fakultas} value={fak.id_fakultas}>{fak.nama_fakultas}</option>
                        ))}
                    </select>
                </div>

                <div>
                     <label htmlFor="id_prodi" className="font-epilogue font-medium text-[14px] leading-[22px] text-[#808191] mb-[10px] block">
                        Program Studi <span className="text-red-400">*</span>
                    </label>
                    <select 
                        name="id_prodi" 
                        id="id_prodi"
                        value={formData.id_prodi} 
                        onChange={handleChange} 
                        required
                        disabled={!selectedFakultas || prodiList.length === 0 || isDropdownLoading || authIsLoading}
                        className="py-3 sm:px-5 px-4 outline-none border-[1px] border-[#3a3a43] bg-transparent font-epilogue text-white text-[14px] placeholder:text-[#4b5264] rounded-[10px] w-full focus:border-[#4acd8d] transition-colors duration-200 ease-in-out disabled:opacity-60"
                    >
                        <option value="" disabled>
                            {selectedFakultas ? (prodiList.length > 0 ? "Pilih Program Studi Anda" : (isDropdownLoading ? "Memuat prodi..." : "Tidak ada prodi")) : "Pilih fakultas terlebih dahulu"}
                        </option>
                        {prodiList.map(prod => (
                            <option key={prod.id_prodi} value={prod.id_prodi}>{prod.nama_prodi}</option>
                        ))}
                    </select>
                </div>

                <FormField 
                    labelName="Nomor Induk Mahasiswa (NIM)" // Tidak perlu * jika isRequired dihandle FormField
                    placeholder="Masukkan NIM Anda"
                    inputType="text"
                    name="nim" // Sangat penting agar handleChange bisa update formData.nim
                    value={formData.nim}
                    handleChange={handleChange}
                    isRequired={true} // Prop untuk menampilkan * dan validasi internal FormField
                    disabled={authIsLoading} // Hanya disable saat proses submit OTP
                    styles="text-white" 
                />
              
                <CustomButton 
                    btnType="submit"
                    title={authIsLoading ? "Memproses..." : "Lanjut & Kirim OTP"}
                    styles="bg-[#1dc071] mt-6 hover:bg-green-600 transition-colors py-3 text-base"
                    disabled={combinedIsLoading}
                />
            </form>
            {message && <p className="mt-5 text-center text-sm text-[#b2b3bd]">{message}</p>}
            {/* {authError && <p className="mt-5 text-center text-sm text-red-400">Error: {authError}</p>} */}
        </div>
    );
};
export default RegisterMahasiswaPage1;
