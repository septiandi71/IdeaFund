// src/pages/CreateCampaign.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
// import { ethers } from 'ethers'; // Hanya jika masih berinteraksi dengan SC yang butuh ethers di frontend
import { useAuthContext } from '../context/AuthContext';
// import { useStateContext } from '../context/StateContext'; // Jika interaksi SC dipindah ke backend
import { FormField, CustomButton, Loader, ToggleSwitch } from '../components';
import axios from 'axios'; 

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const CreateCampaign = () => {
  const navigate = useNavigate();
  const { user, isLoading: authIsLoading } = useAuthContext();
  // const { createCampaign, isLoading: isSCCreating } = useStateContext(); // Jika SC call dari frontend

  const [kategoriList, setKategoriList] = useState([]);
  const [isLoadingKategori, setIsLoadingKategori] = useState(false);
  
  const [form, setForm] = useState({
    judul: '',
    deskripsi: '',
    targetDana: '', 
    durasiHari: '14', 
    kategoriId: '',
    projectImageFile: null, // Menyimpan objek File untuk gambar utama
    projectImageUrlPreview: null, // Untuk menampilkan preview gambar
    isNftReward: false,
    // namaNft dan deskripsiNft dihilangkan
    isProyekTim: false,
    anggotaTim: [], 
  });

  const [currentAnggotaNim, setCurrentAnggotaNim] = useState('');
  const [currentAnggotaInfo, setCurrentAnggotaInfo] = useState({
    nama: '',
    error: null,
    isLoading: false,
  });

  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const debounceTimeoutRef = useRef(null);

  useEffect(() => {
    const fetchKategori = async () => {
      setIsLoadingKategori(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/data/kategori`);
        setKategoriList(response.data || []);
      } catch (error) {
        console.error("Gagal mengambil data kategori:", error);
        setFormError("Gagal memuat kategori proyek.");
      } finally {
        setIsLoadingKategori(false);
      }
    };
    fetchKategori();
  }, []);

  const handleInputChange = (fieldName, e) => {
    setForm({ ...form, [fieldName]: e.target.value });
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        if (!file.type.startsWith('image/')) {
            setFormError('Hanya file gambar (JPG, PNG, GIF) yang diizinkan.');
            setForm(prev => ({...prev, projectImageFile: null, projectImageUrlPreview: null}));
            e.target.value = null; // Reset input file
            return;
        }
        if (file.size > 2 * 1024 * 1024) { // Maks 2MB
            setFormError('Ukuran file gambar maksimal 2MB.');
            setForm(prev => ({...prev, projectImageFile: null, projectImageUrlPreview: null}));
            e.target.value = null; // Reset input file
            return;
        }
        setFormError('');
        setForm(prev => ({...prev, projectImageFile: file, projectImageUrlPreview: URL.createObjectURL(file)}));
    } else {
        setForm(prev => ({...prev, projectImageFile: null, projectImageUrlPreview: null}));
    }
  };

  const handleToggleChange = (fieldName) => {
    const newVal = !form[fieldName];
    setForm(prevForm => ({ 
        ...prevForm, 
        [fieldName]: newVal,
        anggotaTim: fieldName === 'isProyekTim' && !newVal ? [] : prevForm.anggotaTim,
    }));
    if (fieldName === 'isProyekTim' && !newVal) {
        setCurrentAnggotaNim('');
        setCurrentAnggotaInfo({ nama: '', error: null, isLoading: false });
    }
  };

  // ... (fetchMahasiswaInfoForAnggota, handleCurrentAnggotaNimChange, handleAddAnggotaKeTim, removeAnggotaTim tetap sama seperti di ) ...
  const fetchMahasiswaInfoForAnggota = useCallback(async (nimToFetch) => {
    if (!nimToFetch || nimToFetch.length < 3) {
        setCurrentAnggotaInfo({ nama: '', error: nimToFetch ? 'NIM terlalu pendek' : null, isLoading: false });
        return;
    }
    if (nimToFetch === user?.nim) {
        setCurrentAnggotaInfo({ nama: '', error: 'Anda sudah menjadi ketua tim.', isLoading: false });
        return;
    }
    if (form.anggotaTim.some(anggota => anggota.nim === nimToFetch)) {
        setCurrentAnggotaInfo({ nama: '', error: 'NIM sudah ada dalam daftar anggota.', isLoading: false });
        return;
    }
    setCurrentAnggotaInfo({ nama: '', isLoading: true, error: null });
    try {
        const response = await axios.get(`${API_BASE_URL}/data/mahasiswa-info?nim=${nimToFetch}`);
        if (response.data && response.data.namaLengkap) {
            setCurrentAnggotaInfo({ nama: response.data.namaLengkap, nim: response.data.nim, error: null, isLoading: false });
        } else {
            setCurrentAnggotaInfo({ nama: '', error: 'NIM tidak ditemukan', isLoading: false });
        }
    } catch (error) {
        setCurrentAnggotaInfo({ nama: '', error: error.response?.data?.message || 'Error mengambil data', isLoading: false });
    }
  }, [user?.nim, form.anggotaTim]);

  const handleCurrentAnggotaNimChange = (e) => {
    const newNim = e.target.value;
    setCurrentAnggotaNim(newNim);
    setCurrentAnggotaInfo({ nama: '', error: null, isLoading: false }); 
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    if (newNim.trim() !== '') {
        debounceTimeoutRef.current = setTimeout(() => fetchMahasiswaInfoForAnggota(newNim.trim()), 800);
    }
  };

  const handleAddAnggotaKeTim = () => {
    if (currentAnggotaInfo.nama && !currentAnggotaInfo.error && currentAnggotaNim.trim() !== '') {
        if (form.anggotaTim.length >= 3) {
            setFormError("Maksimal 3 anggota tim tambahan."); setTimeout(() => setFormError(''), 3000); return;
        }
        setForm(prevForm => ({
            ...prevForm,
            anggotaTim: [...prevForm.anggotaTim, { nim: currentAnggotaNim.trim(), namaLengkap: currentAnggotaInfo.nama }]
        }));
        setCurrentAnggotaNim(''); 
        setCurrentAnggotaInfo({ nama: '', error: null, isLoading: false }); 
    } else {
        setFormError("NIM anggota tidak valid, tidak terdaftar, atau nama belum muncul."); setTimeout(() => setFormError(''), 4000);
    }
  };

  const removeAnggotaTim = (nimToRemove) => {
    setForm(prevForm => ({ ...prevForm, anggotaTim: prevForm.anggotaTim.filter(anggota => anggota.nim !== nimToRemove) }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setFormError('');

    if (!user) {
      setFormError("Anda harus login.");
      return;
    }

    if (!form.judul || !form.deskripsi || !form.targetDana || !form.durasiHari || !form.kategoriId || !form.projectImageFile) {
      setFormError("Mohon lengkapi semua field yang wajib diisi (*), termasuk gambar proyek.");
      return;
    }

    // Validasi jika proyek tim diaktifkan
    if (form.isProyekTim) {
      const validAnggotaNimsOnly = form.anggotaTim.map((a) => a.nim.trim()).filter((nim) => nim !== '');
      if (validAnggotaNimsOnly.length === 0) {
        setFormError("Proyek tim tidak dapat tediri dari 1 orang.");
        return;
      }
    }

    const formDataPayload = new FormData();
    formDataPayload.append('judul', form.judul);
    formDataPayload.append('deskripsi', form.deskripsi);
    formDataPayload.append('targetDana', form.targetDana);
    formDataPayload.append('durasiHari', form.durasiHari);
    formDataPayload.append('kategoriId', form.kategoriId);
    formDataPayload.append('isNftReward', form.isNftReward.toString());
    formDataPayload.append('isProyekTim', form.isProyekTim.toString());
    if (form.projectImageFile) {
      formDataPayload.append('projectImageFile', form.projectImageFile);
    }
    if (form.isProyekTim) {
      const validAnggotaNimsOnly = form.anggotaTim.map((a) => a.nim.trim()).filter((nim) => nim !== '');
      formDataPayload.append('anggotaTambahanNims', JSON.stringify(validAnggotaNimsOnly));
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/projects/create`, formDataPayload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage(response.data.message || "Proyek berhasil diajukan.");
      setTimeout(() => navigate('/dashboard'), 3000);
    } catch (err) {
      console.error("Gagal mengajukan proyek:", err);
      const apiError = err.response?.data?.message || err.message;
      setFormError(apiError || "Terjadi kesalahan saat mengajukan proyek.");
    }
  };
  
  // isLoading utama untuk tombol submit dan beberapa field
  const mainIsLoading = authIsLoading || (typeof isSCCreating !== 'undefined' ? isSCCreating : false) || isLoadingKategori;

  useEffect(() => {
    if (user && user.role !== 'mahasiswa') {
      // Jika bukan mahasiswa, arahkan ke dashboard
      navigate('/dashboard');
    }
  }, [user, navigate]);

  if (!user || user.role !== 'mahasiswa') {
    return null; // Jangan render apa pun jika pengguna tidak diizinkan
  }

  return (
    <div className="bg-[#13131a] flex justify-center items-center py-10 px-4 min-h-screen">
        <div className="bg-[#1c1c24] flex flex-col items-center rounded-[20px] sm:p-10 p-6 w-full mx-auto shadow-2xl">
        {mainIsLoading && <Loader message={isLoadingKategori ? "Memuat data..." : ( (typeof isSCCreating !== 'undefined' && isSCCreating) || authIsLoading ? "Mengajukan proyek..." : "Memproses...")} />}
        <div className="flex flex-col items-center w-full mb-10">
            <div className="p-4 bg-gradient-to-tr from-[#1dc071] to-[#4acd8d] rounded-full inline-block mb-5 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-10 h-10">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                </svg>
            </div>
            <h1 className="font-epilogue font-bold sm:text-3xl text-2xl leading-tight text-white text-center">
            Mulai Proyek Pendanaan Baru
            </h1>
            <p className="font-epilogue font-normal text-sm text-[#808191] mt-2 text-center max-w-md">
            Isi detail proyek Anda di bawah ini untuk memulai penggalangan dana. Berikan gambar dengan rasio 4:3 (minimal 800x600 piksel) dan ukuran file maksimal 2MB.
            </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
            {/* ... Field Judul, Target Dana, Deskripsi, Kategori, Durasi (Sama) ... */}
            <div className="grid md:grid-cols-2 gap-6">
                <FormField labelName="Judul Proyek" placeholder="Tulis judul yang menarik" inputType="text" name="judul" value={form.judul} handleChange={(e) => handleInputChange('judul', e)} isRequired={true} styles="text-white" disabled={mainIsLoading}/>
                <FormField labelName="Target Dana (USDT)" placeholder="Contoh: 100" inputType="number" name="targetDana" value={form.targetDana} handleChange={(e) => handleInputChange('targetDana', e)} isRequired={true} styles="text-white" disabled={mainIsLoading}/>
            </div>
            <FormField labelName="Deskripsi Proyek" placeholder="Ceritakan detail tentang proyek Anda" isTextArea name="deskripsi" value={form.deskripsi} handleChange={(e) => handleInputChange('deskripsi', e)} isRequired={true} styles="text-white" disabled={mainIsLoading}/>
            <div className="grid md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="kategoriId" className="font-epilogue font-medium text-[14px] leading-[22px] text-[#808191] mb-[10px] block">Kategori Proyek <span className="text-red-400">*</span></label>
                <select name="kategoriId" id="kategoriId" value={form.kategoriId} onChange={(e) => handleInputChange('kategoriId', e)} required disabled={isLoadingKategori || mainIsLoading} className="py-3 sm:px-5 px-4 outline-none border-[1px] border-[#3a3a43] bg-transparent font-epilogue text-white text-[14px] placeholder:text-[#4b5264] rounded-[10px] w-full focus:border-[#4acd8d] transition-colors">
                    <option value="" disabled>Pilih Kategori</option>
                    {isLoadingKategori && <option value="" disabled>Memuat kategori...</option>}
                    {kategoriList.map(kat => (<option key={kat.id_kategori} value={kat.id_kategori}>{kat.nama_kategori}</option>))}
                </select>
            </div>
            <div>
                <label htmlFor="durasiHari" className="font-epilogue font-medium text-[14px] leading-[22px] text-[#808191] mb-[10px] block">Durasi Penggalangan Dana <span className="text-red-400">*</span></label>
                <select name="durasiHari" id="durasiHari" value={form.durasiHari} onChange={(e) => handleInputChange('durasiHari', e)} required disabled={mainIsLoading} className="py-3 sm:px-5 px-4 outline-none border-[1px] border-[#3a3a43] bg-transparent font-epilogue text-white text-[14px] placeholder:text-[#4b5264] rounded-[10px] w-full focus:border-[#4acd8d] transition-colors">
                    {[7, 14, 21, 30].map(hari => ( <option key={hari} value={hari}>{hari} hari</option> ))}
                </select>
            </div>
            </div>
            
            {/* Input File untuk Gambar Utama Proyek */}
            <div>
                <label htmlFor="projectImageFile" className="font-epilogue font-medium text-[14px] leading-[22px] text-[#808191] mb-[10px] block">
                    Gambar Utama Proyek <span className="text-red-400">*</span> 
                    <span className="text-xs block text-gray-400 mt-1">Rasio 4:3 direkomendasikan (min. 800x600px). Maks 2MB (JPG/PNG/GIF).</span>
                </label>
                <input 
                    type="file" 
                    id="projectImageFile"
                    name="projectImageFile"
                    accept="image/png, image/jpeg, image/jpg, image/gif"
                    onChange={handleFileChange}
                    required
                    className="block w-full text-sm text-slate-400 file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#4acd8d] file:text-black hover:file:bg-green-400 disabled:opacity-50 cursor-pointer"
                    disabled={mainIsLoading}
                />
                {form.projectImageUrlPreview && (
                    <div className="mt-4 p-2 border border-dashed border-gray-600 rounded-lg inline-block bg-[#13131a]">
                        <p className="text-xs text-[#808191] mb-1 text-center">Preview Gambar Proyek:</p>
                        <img src={form.projectImageUrlPreview} alt="Preview Gambar Proyek" className="max-w-xs h-auto max-h-48 rounded-md object-contain" />
                    </div>
                )}
            </div>

            {/* Opsi Tim Proyek (Sama seperti sebelumnya) */}
            <div className="mt-4 p-6 bg-[#13131a] rounded-[10px] border border-gray-700 shadow-md">
                <div className="flex items-center justify-between mb-4">
                    <ToggleSwitch 
                        label="Libatkan Tim dalam Proyek Ini?"
                        name="isProyekTim"
                        checked={form.isProyekTim}
                        onChange={() => handleToggleChange('isProyekTim')}
                        disabled={mainIsLoading}
                    />
                </div>
                {form.isProyekTim && (
                    <div className="space-y-6 pl-2 animate-fadeIn border-t border-gray-700 pt-4 mt-4">
                         <div className="p-4 bg-[#1c1c24] rounded-lg shadow-md">
                            <label className="font-epilogue font-medium text-[14px] leading-[22px] text-[#808191] mb-[8px] block">Ketua Tim (Anda)</label>
                            <div className="flex items-center gap-4 p-3 bg-[#13131a] rounded-md cursor-not-allowed opacity-90">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#4acd8d] to-[#1dc071] flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                    {(user?.namaLengkap || user?.nama || "U").substring(0,1).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <p className="font-epilogue text-sm text-white font-semibold truncate" title={user?.namaLengkap || 'Nama Anda'}>{user?.namaLengkap || 'Nama Anda'}</p>
                                    <p className="font-epilogue text-xs text-gray-400 truncate" title={user?.nim || 'NIM Anda'}>{user?.nim || 'NIM Anda'}</p>
                                </div>
                            </div>
                        </div>
                        {form.anggotaTim.length > 0 && (
                            <div className="mt-4 space-y-3">
                                <p className="font-epilogue text-sm text-[#b2b3bd]">Anggota Ditambahkan:</p>
                                {form.anggotaTim.map((anggota, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-[#1c1c24] rounded-lg shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[#3a3a43] flex items-center justify-center text-white font-semibold text-lg">
                                                {(anggota.namaLengkap || "A").substring(0,1).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-epilogue text-sm text-white font-medium">{anggota.namaLengkap}</p>
                                                <p className="font-epilogue text-xs text-gray-400">{anggota.nim}</p>
                                            </div>
                                        </div>
                                        <CustomButton btnType="button" title="Hapus" styles="bg-red-600 hover:bg-red-700 text-xs px-3 py-1.5 rounded-md" handleClick={() => removeAnggotaTim(anggota.nim)} disabled={mainIsLoading}/>
                                    </div>
                                ))}
                            </div>
                        )}
                        {form.anggotaTim.length < 3 && (
                            <div className="mt-5">
                                <label htmlFor="currentAnggotaNim" className="font-epilogue font-medium text-[14px] leading-[22px] text-[#808191] mb-[10px] block">
                                    Tambah Anggota (Masukkan NIM):
                                </label>
                                <div className="flex items-start gap-3">
                                    <FormField placeholder="Ketik NIM Anggota" inputType="text" value={currentAnggotaNim} handleChange={handleCurrentAnggotaNimChange} styles="text-white text-sm !py-2.5 bg-[#1c1c24] border-[#3a3a43] flex-1" disabled={mainIsLoading} noLabel={true}/>
                                    <CustomButton btnType="button" title="Tambahkan" styles={`bg-blue-600 hover:bg-blue-700 text-xs px-4 py-2.5 rounded-md self-stretch ${(!currentAnggotaInfo.nama || currentAnggotaInfo.error || currentAnggotaInfo.isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`} handleClick={handleAddAnggotaKeTim} disabled={!currentAnggotaInfo.nama || currentAnggotaInfo.error || currentAnggotaInfo.isLoading || mainIsLoading}/>
                                </div>
                                {currentAnggotaInfo.isLoading && <p className="text-xs text-yellow-400 animate-pulse mt-2 ml-1">Mencari NIM...</p>}
                                {currentAnggotaInfo.error && <p className="text-xs text-red-400 mt-2 ml-1">{currentAnggotaInfo.error}</p>}
                                {currentAnggotaInfo.nama && !currentAnggotaInfo.error && <div className="mt-2 ml-1 p-2 bg-[#1c1c24] rounded-md text-xs text-green-400 border border-green-700">✓ Ditemukan: <span className="font-semibold">{currentAnggotaInfo.nama}</span>. Klik "Tambahkan".</div> }
                            </div>
                        )}
                         {form.anggotaTim.length >= 3 && (<p className="text-xs text-yellow-500 mt-2 text-center">Batas maksimal 3 anggota tambahan telah tercapai.</p>)}
                    </div>
                )}
            </div>

            {/* Opsi NFT Reward - Disederhanakan */}
            <div className="mt-4 p-6 bg-[#13131a] rounded-[10px] border border-gray-700 shadow-md">
                <div className="flex items-center justify-between">
                     <ToggleSwitch 
                        label="Tawarkan NFT Reward untuk Donatur?"
                        name="isNftReward"
                        checked={form.isNftReward}
                        onChange={() => handleToggleChange('isNftReward')}
                        disabled={mainIsLoading}
                    />
                </div>
                {form.isNftReward && (
                    <div className="space-y-3 pl-2 animate-fadeIn border-t border-gray-700 pt-4 mt-4">
                        <p className="font-epilogue text-sm text-[#b2b3bd]">
                            Jika diaktifkan, gambar utama proyek yang Anda unggah akan digunakan sebagai gambar untuk NFT reward.
                        </p>
                        {form.projectImageUrlPreview && (
                             <div className="mt-2">
                                <p className="text-xs text-[#808191] mb-1">Preview Gambar (akan digunakan untuk NFT):</p>
                                <img src={form.projectImageUrlPreview} alt="Preview Gambar NFT" className="w-32 h-32 rounded-lg object-cover border border-[#3a3a43]" />
                            </div>
                        )}
                         {!form.projectImageUrlPreview && (
                            <p className="text-xs text-yellow-500">Unggah gambar utama proyek terlebih dahulu untuk melihat preview NFT.</p>
                         )}
                    </div>
                )}
            </div>
            
            <div className="flex justify-center items-center mt-10">
            <CustomButton 
                btnType="submit"
                title={mainIsLoading ? "Mengajukan..." : "Ajukan Proyek Sekarang"}
                styles="bg-gradient-to-r from-[#1dc071] to-[#4acd8d] hover:from-green-500 hover:to-teal-500 px-10 py-3 text-lg rounded-[10px] shadow-lg"
                disabled={mainIsLoading}
            />
            </div>
        </form>
        {message && !formError && <p className="mt-6 text-center text-sm text-green-400">{message}</p>}
        {formError && <p className="mt-6 text-center text-sm text-red-400">Error: {formError}</p>}
        </div>
    </div>
  );
};

export default CreateCampaign;
