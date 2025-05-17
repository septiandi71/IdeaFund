// src/pages/CreateCampaign.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers'; 
import { useAuthContext } from '../context/AuthContext';
import { useStateContext } from '../context/'; 
import { FormField, CustomButton, Loader, ToggleSwitch } from '../components';
import axios from 'axios'; 

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const CreateCampaign = () => {
  const navigate = useNavigate();
  const { user, isLoading: authIsLoading } = useAuthContext();
  const { createCampaign, isLoading: isSCCreating } = useStateContext(); 

  const [kategoriList, setKategoriList] = useState([]);
  const [isLoadingKategori, setIsLoadingKategori] = useState(false);
  
  const [form, setForm] = useState({
    judul: '',
    deskripsi: '',
    targetDana: '', 
    durasiHari: '14', 
    kategoriId: '',
    projectImageUrl: '', // Untuk gambar utama proyek
    isNftReward: false,
    // namaNft dan deskripsiNft tetap ada jika Anda ingin menyimpannya di backend
    // atau jika smart contract Anda membutuhkannya (meskipun tidak ada input field terpisah lagi)
    // Untuk contoh ini, kita asumsikan nama NFT bisa sama dengan judul proyek atau dikelola backend
    // dan deskripsi NFT bisa diambil dari deskripsi proyek atau dikelola backend.
    // Jika Anda ingin input terpisah untuk nama/deskripsi NFT, tambahkan kembali FormField-nya.
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

  const handleFormFieldChange = (fieldName, e) => {
    setForm({ ...form, [fieldName]: e.target.value });
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
        setFormError("NIM anggota tidak valid atau nama belum muncul."); setTimeout(() => setFormError(''), 4000);
    }
  };

  const removeAnggotaTim = (nimToRemove) => {
    setForm(prevForm => ({ ...prevForm, anggotaTim: prevForm.anggotaTim.filter(anggota => anggota.nim !== nimToRemove) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); setFormError('');
    if (!user) { setFormError("Anda harus login."); return; }
    if (!form.judul || !form.deskripsi || !form.targetDana || !form.durasiHari || !form.kategoriId || !form.projectImageUrl) {
        setFormError("Mohon lengkapi semua field yang wajib diisi (*)."); return;
    }
    // Validasi untuk namaNft dan deskripsiNft dihilangkan karena input fieldnya dihilangkan
    // if (form.isNftReward && !form.namaNft) { 
    //     setFormError("Nama NFT Reward wajib diisi."); return; 
    // }
    if (parseInt(form.durasiHari) < 7 || parseInt(form.durasiHari) > 30) { setFormError("Durasi harus 7-30 hari."); return; }
    const validAnggotaNimsOnly = form.anggotaTim.map(a => a.nim.trim()).filter(nim => nim !== '');
    if (form.isProyekTim && validAnggotaNimsOnly.some(nim => nim === user.nim)) {
        setFormError("Anda sudah ketua, jangan input NIM Anda sebagai anggota."); return;
    }
    if (form.isProyekTim && currentAnggotaNim.trim() !== '' && (currentAnggotaInfo.error || !currentAnggotaInfo.nama)) {
        setFormError("NIM anggota yang diinput belum valid. Tambahkan atau kosongkan."); return;
    }

    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + parseInt(form.durasiHari));
    const formattedDeadlineForDB = deadlineDate.toISOString().split('T')[0]; 
    const deadlineForSC = Math.floor(deadlineDate.getTime() / 1000); 

    try {
        const backendData = {
            judul: form.judul, deskripsi: form.deskripsi,
            targetDana: parseFloat(form.targetDana), batasWaktu: formattedDeadlineForDB, 
            kategoriId: parseInt(form.kategoriId), pemilikId: user.id, 
            projectImageUrl: form.projectImageUrl, // Gambar utama proyek
            isNftReward: form.isNftReward,
            // Jika isNftReward true, nftImageUrl di backend akan diisi dengan projectImageUrl
            // Tidak perlu mengirim nftRewardImageUrl terpisah dari frontend jika gambarnya sama
            // namaNft dan deskripsiNft juga tidak lagi dikirim dari form ini
            isProyekTim: form.isProyekTim,
            ...(form.isProyekTim && { ketuaId: user.id, anggotaTambahanNims: validAnggotaNimsOnly })
        };
        
        const response = await axios.post(`${API_BASE_URL}/projects/create`, backendData); 
        setMessage(response.data.message || "Proyek berhasil diajukan dan menunggu review admin.");
        
        // Interaksi Smart Contract (jika masih relevan dan createCampaign ada di context)
        if (createCampaign && response.data.success && response.data.proyekId) { // Asumsi backend mengembalikan proyekId
            console.log("Mencoba memanggil Smart Contract untuk proyek ID:", response.data.proyekId);
            await createCampaign({ 
                // Sesuaikan parameter ini dengan yang diharapkan oleh fungsi createCampaign di StateContext/SC Anda
                // Biasanya SC butuh ID proyek dari backend, atau data proyek untuk dibuat on-chain
                // _projectId: response.data.proyekId, // Contoh jika SC butuh ID dari backend
                _title: form.judul, 
                _description: form.deskripsi,
                _target: ethers.utils.parseUnits(form.targetDana.toString(), 18), 
                _deadline: deadlineForSC, 
                _imageURL: form.projectImageUrl,
                // Jika SC menangani NFT, Anda mungkin perlu mengirim info isNftReward
                // _isNftReward: form.isNftReward,
                // _nftImageURL: form.isNftReward ? form.projectImageUrl : "", // Gunakan projectImageUrl untuk NFT
            });
            console.log("Panggilan Smart Contract selesai (atau sedang diproses).");
        }
        
        setTimeout(() => navigate('/dashboard'), 3000);

    } catch (err) {
        console.error("Gagal mengajukan proyek:", err);
        const apiError = err.response?.data?.message || err.message;
        setFormError(apiError || "Terjadi kesalahan saat mengajukan proyek.");
    }
  };
  
  const isLoading = authIsLoading || isSCCreating || isLoadingKategori;

  return (
    <div className="bg-[#13131a] flex justify-center items-center py-10 px-4 min-h-screen">
        <div className="bg-[#1c1c24] flex flex-col items-center rounded-[20px] sm:p-10 p-6 w-full max-w-3xl mx-auto shadow-2xl">
        {isLoading && <Loader message={isLoadingKategori ? "Memuat data..." : (isSCCreating || authIsLoading ? "Mengajukan proyek..." : "Memproses...")} />}
        {/* ... Header Form (sama) ... */}
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
            Isi detail proyek Anda di bawah ini untuk memulai penggalangan dana.
            </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
            {/* ... Field Judul, Target Dana, Deskripsi, Kategori, Durasi (Sama) ... */}
            <div className="grid md:grid-cols-2 gap-6">
                <FormField labelName="Judul Proyek *" placeholder="Tulis judul yang menarik" inputType="text" name="judul" value={form.judul} handleChange={(e) => handleFormFieldChange('judul', e)} isRequired={true} styles="text-white" disabled={isLoading}/>
                <FormField labelName="Target Dana (USDT)" placeholder="Contoh: 100" inputType="number" name="targetDana" value={form.targetDana} handleChange={(e) => handleFormFieldChange('targetDana', e)} isRequired={true} styles="text-white" disabled={isLoading}/>
            </div>
            <FormField labelName="Deskripsi Proyek *" placeholder="Ceritakan detail tentang proyek Anda" isTextArea name="deskripsi" value={form.deskripsi} handleChange={(e) => handleFormFieldChange('deskripsi', e)} isRequired={true} styles="text-white" disabled={isLoading}/>
            <div className="grid md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="kategoriId" className="font-epilogue font-medium text-[14px] leading-[22px] text-[#808191] mb-[10px] block">Kategori Proyek <span className="text-red-400">*</span></label>
                <select name="kategoriId" id="kategoriId" value={form.kategoriId} onChange={(e) => handleFormFieldChange('kategoriId', e)} required disabled={isLoadingKategori || isLoading} className="py-3 sm:px-5 px-4 outline-none border-[1px] border-[#3a3a43] bg-transparent font-epilogue text-white text-[14px] placeholder:text-[#4b5264] rounded-[10px] w-full focus:border-[#4acd8d] transition-colors">
                    <option value="" disabled>Pilih Kategori</option>
                    {isLoadingKategori && <option value="" disabled>Memuat kategori...</option>}
                    {kategoriList.map(kat => (<option key={kat.id_kategori} value={kat.id_kategori}>{kat.nama_kategori}</option>))}
                </select>
            </div>
            <div>
                <label htmlFor="durasiHari" className="font-epilogue font-medium text-[14px] leading-[22px] text-[#808191] mb-[10px] block">Durasi Penggalangan Dana <span className="text-red-400">*</span></label>
                <select name="durasiHari" id="durasiHari" value={form.durasiHari} onChange={(e) => handleFormFieldChange('durasiHari', e)} required disabled={isLoading} className="py-3 sm:px-5 px-4 outline-none border-[1px] border-[#3a3a43] bg-transparent font-epilogue text-white text-[14px] placeholder:text-[#4b5264] rounded-[10px] w-full focus:border-[#4acd8d] transition-colors">
                    {[7, 14, 21, 30].map(hari => ( <option key={hari} value={hari}>{hari} hari</option> ))}
                </select>
            </div>
            </div>
            <FormField 
                labelName="URL Gambar Utama Proyek *" 
                placeholder="https://urlgambarproyek.com/gambar.jpg" 
                inputType="url" 
                name="projectImageUrl" 
                value={form.projectImageUrl} 
                handleChange={(e) => handleFormFieldChange('projectImageUrl', e)} 
                isRequired={true} 
                styles="text-white" 
                disabled={isLoading}
            />

            {/* Opsi Tim Proyek (Sama seperti sebelumnya) */}
            <div className="mt-4 p-6 bg-[#13131a] rounded-[10px] border border-gray-700 shadow-md">
                <div className="flex items-center justify-between mb-4">
                    <ToggleSwitch 
                        label="Libatkan Tim dalam Proyek Ini?"
                        name="isProyekTim"
                        checked={form.isProyekTim}
                        onChange={() => handleToggleChange('isProyekTim')}
                        disabled={isLoading}
                    />
                </div>
                {form.isProyekTim && (
                    <div className="space-y-6 pl-2 animate-fadeIn border-t border-gray-700 pt-4 mt-4">
                        {/* ... (Tampilan Ketua Tim dan Anggota Tim sama seperti sebelumnya) ... */}
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
                                        <CustomButton btnType="button" title="Hapus" styles="bg-red-600 hover:bg-red-700 text-xs px-3 py-1.5 rounded-md" handleClick={() => removeAnggotaTim(anggota.nim)} disabled={isLoading}/>
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
                                    <FormField placeholder="Ketik NIM Anggota" inputType="text" value={currentAnggotaNim} handleChange={handleCurrentAnggotaNimChange} styles="text-white text-sm !py-2.5 bg-[#1c1c24] border-[#3a3a43] flex-1" disabled={isLoading} noLabel={true}/>
                                    <CustomButton btnType="button" title="Tambahkan" styles={`bg-blue-600 hover:bg-blue-700 text-xs px-4 py-2.5 rounded-md self-stretch ${(!currentAnggotaInfo.nama || currentAnggotaInfo.error || currentAnggotaInfo.isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`} handleClick={handleAddAnggotaKeTim} disabled={!currentAnggotaInfo.nama || currentAnggotaInfo.error || currentAnggotaInfo.isLoading || isLoading}/>
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
                <div className="flex items-center justify-between mb-0"> {/* mb-0 jika tidak ada konten di bawahnya saat tidak aktif */}
                     <ToggleSwitch 
                        label="Tawarkan NFT Reward untuk Donatur?"
                        name="isNftReward"
                        checked={form.isNftReward}
                        onChange={() => handleToggleChange('isNftReward')}
                        disabled={isLoading}
                    />
                </div>
                {form.isNftReward && (
                    <div className="space-y-4 pl-2 animate-fadeIn border-t border-gray-700 pt-4 mt-4">
                        <p className="font-epilogue text-sm text-[#b2b3bd]">
                            Jika diaktifkan, gambar utama proyek (<span className="font-semibold text-white">{form.projectImageUrl || "belum diisi"}</span>) akan digunakan sebagai gambar untuk NFT reward.
                        </p>
                        {/* Tidak ada input field lagi untuk URL gambar NFT terpisah */}
                        {/* Input Nama NFT dan Deskripsi NFT juga dihilangkan dari UI */}
                    </div>
                )}
            </div>
            
            <div className="flex justify-center items-center mt-10">
            <CustomButton 
                btnType="submit"
                title={isLoading ? "Mengajukan..." : "Ajukan Proyek Sekarang"}
                styles="bg-gradient-to-r from-[#1dc071] to-[#4acd8d] hover:from-green-500 hover:to-teal-500 px-10 py-3 text-lg rounded-[10px] shadow-lg"
                disabled={isLoading}
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
