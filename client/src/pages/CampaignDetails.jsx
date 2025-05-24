import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthContext } from '../context/AuthContext';
import { ethers } from 'ethers';

import { useStateContext } from '../context';
import { CountBox, CustomButton, Loader } from '../components';
import { calculateBarPercentage, daysLeft } from '../utils';
import { thirdweb } from '../assets';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const IMAGE_BASE_URL = import.meta.env.VITE_API_IMAGE_URL;

const CampaignDetails = () => {
  const { user } = useAuthContext();
  const { id } = useParams(); // Ambil ID dari URL
  const navigate = useNavigate();
  const { 
    // Asumsi fungsi ini ada di context dan sudah disesuaikan untuk IdeaFund.sol
    approveUSDT, // Fungsi baru untuk approve
    donateWithUSDT, // Fungsi baru untuk donasi USDT
    getDonations, // Diganti dari getOnChainDonatorsList
    walletAddress: address, 
    publishCampaignToBlockchain,
    claimFundsFromContract,
    getOnChainCampaignData, // Untuk mengambil detail on-chain
    ideaFundContractInstance, // Ganti nama untuk konsistensi
    usdtContractInstance 
  } = useStateContext();

  const [isLoading, setIsLoading] = useState(true);
  const [campaign, setCampaign] = useState(null);
  const [onChainData, setOnChainData] = useState(null);
  const [amount, setAmount] = useState('');
  const [onChainDonators, setOnChainDonators] = useState([]);
  const [isApproving, setIsApproving] = useState(false);
  const [isDonating, setIsDonating] = useState(false);
  const [allowance, setAllowance] = useState(ethers.BigNumber.from(0)); // Simpan allowance

  const USDT_DECIMALS = 6; // Definisikan di sini juga untuk kemudahan

  useEffect(() => {
    const fetchCampaignDetails = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/projects/${id}`);
        const dbCampaignData = response.data;
        setCampaign(dbCampaignData);

        // Jika proyek sudah on-chain, ambil data dari SC
        if (dbCampaignData.isPublishedOnChain && dbCampaignData.onChainProjectId && getOnChainCampaignData) {
          const scData = await getOnChainCampaignData(dbCampaignData.onChainProjectId);
          setOnChainData(scData);
          // Update campaign state dengan dana terkumpul dari SC jika berbeda
          // Ini akan ditangani oleh tampilan yang memprioritaskan onChainData
        }
      } catch (error) {
        console.error('Gagal memuat detail proyek:', error);
        navigate('/explore-campaign'); // Redirect jika gagal
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampaignDetails();
  }, [id, navigate]);

  // Fungsi untuk memeriksa allowance
  const checkAllowance = async () => {
    if (!address || !usdtContractInstance || !ideaFundContractInstance) return;
    try {
      const allowanceAmount = await readContract({
        contract: usdtContractInstance,
        method: "function allowance(address owner, address spender) view returns (uint256)",
        params: [address, ideaFundContractInstance.address]
      });
      setAllowance(ethers.BigNumber.from(allowanceAmount));
      console.log("[CampaignDetails] Allowance check:", ethers.utils.formatUnits(allowanceAmount, USDT_DECIMALS), "USDT");
    } catch (error) {
      console.error("Gagal memeriksa allowance:", error);
    }
  };

  const fetchDonators = async () => {
    if (campaign?.isPublishedOnChain && campaign?.onChainProjectId && getDonations) {
      const data = await getDonations(campaign.onChainProjectId);
      setOnChainDonators(data);
    }
  };

  useEffect(() => {
    if (campaign?.isPublishedOnChain) {
      fetchDonators();
      checkAllowance(); // Cek allowance saat campaign data ada dan on-chain
    }
  }, [campaign, address, usdtContractInstance, ideaFundContractInstance]); // Tambahkan dependency

  const handleApprove = async () => {
    if (!approveUSDT || !amount || parseFloat(amount) <= 0) return;
    setIsApproving(true);
    try {
      await approveUSDT(amount);
      alert(`Approval untuk ${amount} USDT berhasil! Anda sekarang bisa berdonasi.`);
      await checkAllowance(); // Refresh allowance setelah approval
    } catch (error) {
      console.error("Gagal melakukan approval USDT:", error);
      alert(error.message || 'Gagal melakukan approval USDT.');
    }
    setIsApproving(false);
  };

  const handleDonateWithUSDT = async () => {
    if (!campaign?.onChainProjectId || !donateWithUSDT || !amount || parseFloat(amount) <= 0) return;
    
    const amountSmallestUnit = ethers.utils.parseUnits(amount, USDT_DECIMALS);
    if (allowance.lt(amountSmallestUnit)) {
      alert("Jumlah donasi melebihi allowance yang Anda berikan. Silakan approve kembali dengan jumlah yang sesuai atau lebih besar.");
      return;
    }

    setIsDonating(true);
    try {
      const receipt = await donateWithUSDT(campaign.onChainProjectId, amount);
      // Setelah donasi SC sukses, catat ke backend
      await axios.post(`${API_BASE_URL}/transaksi/record-donation`, {
        projectId: campaign.id, // ID Proyek dari DB
        donatorAddress: address, 
        amountUSDT: amount, // Kirim sebagai USDT
        txHash: receipt.transactionHash 
      }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      
      alert('Donasi berhasil!');
      // Refresh data
      const updatedDbCampaign = await axios.get(`${API_BASE_URL}/projects/${id}`);
      setCampaign(updatedDbCampaign.data);
      if (updatedDbCampaign.data.isPublishedOnChain && getOnChainCampaignData) {
        const scData = await getOnChainCampaignData(updatedDbCampaign.data.onChainProjectId);
        setOnChainData(scData);
      }
      fetchDonators(); // Refresh daftar donatur
      await checkAllowance(); // Refresh allowance
      setAmount(''); // Reset input amount
    } catch (error) {
      console.error("Gagal melakukan donasi:", error);
      alert(error.response?.data?.message || error.message || 'Gagal melakukan donasi.');
    }
    setIsDonating(false);
  };

  const handlePublishToBlockchain = async () => {
    if (!campaign) {
      console.error("[handlePublishToBlockchain] Data campaign belum ada.");
      alert("Data kampanye tidak ditemukan. Silakan coba lagi.");
      return;
    }
    if (typeof publishCampaignToBlockchain !== 'function' || !publishCampaignToBlockchain) {
      console.error("[handlePublishToBlockchain] Fungsi publishCampaignToBlockchain dari context tidak tersedia.");
      alert("Fungsi untuk publikasi ke blockchain tidak tersedia.");
      return;
    }
    
    // Jika lolos guard, baru log bahwa fungsi dipanggil dan data campaign
    console.log("[handlePublishToBlockchain] Dipanggil dan guard conditions terpenuhi.");
    console.log("[handlePublishToBlockchain] Data campaign:", campaign);
    console.log("[handlePublishToBlockchain] Fungsi publishCampaignToBlockchain dari context:", typeof publishCampaignToBlockchain);

    // Pastikan campaign memiliki semua field yang dibutuhkan oleh context
    if (!campaign.id || !campaign.judul || campaign.targetDana == null || campaign.durasiHari == null) {
      console.error("[handlePublishToBlockchain] Data campaign tidak lengkap untuk dikirim ke context:", campaign);
      alert("Data kampanye tidak lengkap. Pastikan ID, judul, target dana, dan durasi hari ada.");
      setIsLoading(false); // Pastikan isLoading direset jika ada error sebelum try-catch
      return;
    }

    setIsLoading(true);
    try {
      console.log("[handlePublishToBlockchain] Mencoba memanggil publishCampaignToBlockchain(campaign)...");
      const receipt = await publishCampaignToBlockchain(campaign); // Sekarang mengembalikan receipt
      console.log("[handlePublishToBlockchain] Receipt dari publishCampaignToBlockchain:", receipt);
      
      if (!receipt || !receipt.transactionHash) {
        // Log detail receipt jika tidak valid
        console.error("[handlePublishToBlockchain] Receipt tidak valid atau tidak ada transactionHash. Detail receipt:", receipt);
        throw new Error("Publikasi ke blockchain tidak mengembalikan hash transaksi yang valid.");
      }
      console.log(`[handlePublishToBlockchain] Transaksi berhasil di blockchain dengan hash: ${receipt.transactionHash}`);
      
      // Implementasi Retry untuk getOnChainCampaignData
      let scCampaignDetails = null;
      const maxRetries = 3; // Jumlah maksimal percobaan
      let retries = 0;
      const initialDelay = 3000; // Delay awal sebelum percobaan pertama
      const retryInterval = 5000; // Delay antar percobaan berikutnya

      console.log(`[handlePublishToBlockchain] ID Proyek (dari campaign state) yang akan digunakan untuk fetch: "${campaign.id}"`);
      await new Promise(resolve => setTimeout(resolve, initialDelay));

      while (retries < maxRetries && !scCampaignDetails) {
        const currentProjectId = campaign.id; // Selalu gunakan ID terbaru dari state campaign jika mungkin berubah
        console.log(`[handlePublishToBlockchain] Percobaan ${retries + 1}/${maxRetries} mengambil detail SC untuk projectId: "${currentProjectId}"`);
        
        try {
          scCampaignDetails = await getOnChainCampaignData(currentProjectId);
          if (scCampaignDetails) {
            console.log("[handlePublishToBlockchain] Detail dari Smart Contract (getOnChainCampaignData) BERHASIL diambil:", scCampaignDetails);
            break; // Keluar dari loop jika berhasil
          } else {
            // Ini terjadi jika getOnChainCampaignData mengembalikan null tanpa error eksplisit dari SC
            // (misalnya, jika fungsi di context mengembalikan null saat error)
            console.warn(`[handlePublishToBlockchain] getOnChainCampaignData mengembalikan null pada percobaan ${retries + 1} untuk projectId: ${currentProjectId}`);
          }
        } catch (readError) {
          // Tangkap error spesifik dari getOnChainCampaignData jika ia melempar error
          console.error(`[handlePublishToBlockchain] Error pada percobaan ${retries + 1} getOnChainCampaignData untuk projectId: ${currentProjectId}:`, readError);
          // Jika error bukan "Campaign does not exist", mungkin ada masalah lain yang perlu dihentikan
          if (!readError.message || !readError.message.includes("Campaign does not exist")) {
            throw readError; // Lemparkan kembali error yang tidak terduga
          }
        }
        
        retries++;
        if (retries < maxRetries && !scCampaignDetails) {
          console.log(`[handlePublishToBlockchain] Menunggu ${retryInterval / 1000} detik sebelum percobaan berikutnya...`);
          await new Promise(resolve => setTimeout(resolve, retryInterval));
        }
      }

      console.log("[handlePublishToBlockchain] Detail dari Smart Contract (getOnChainCampaignData):", scCampaignDetails);
      
      if (!scCampaignDetails) {
        console.error(`[handlePublishToBlockchain] Gagal mendapatkan detail kampanye dari smart contract untuk projectId: ${campaign.id} setelah publikasi.`);
        throw new Error("Gagal mendapatkan detail kampanye dari smart contract setelah publikasi.");
      }
      
      const payloadConfirm = {
        txHash: receipt.transactionHash, 
        onChainProjectId: campaign.id, 
        onChainDeadlineTimestamp: Number(scCampaignDetails.deadlineTimestamp) 
      };
      console.log(`[handlePublishToBlockchain] Payload untuk konfirmasi ke backend (/projects/${campaign.id}/confirm-onchain):`, payloadConfirm);
      
      await axios.post(`${API_BASE_URL}/projects/${campaign.id}/confirm-onchain`, {
        ...payloadConfirm
      }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      console.log("[handlePublishToBlockchain] Konfirmasi ke backend berhasil.");
      alert('Proyek berhasil dipublikasikan ke blockchain dan status DB diperbarui!');
      // Refresh data
      const updatedDbCampaign = await axios.get(`${API_BASE_URL}/projects/${id}`);
      setCampaign(updatedDbCampaign.data);
      if (updatedDbCampaign.data.isPublishedOnChain && getOnChainCampaignData) {
        const scData = await getOnChainCampaignData(updatedDbCampaign.data.onChainProjectId);
        setOnChainData(scData);
        console.log("[handlePublishToBlockchain] Data SC baru setelah refresh:", scData);
      }
    } catch (error) {
      console.error("Gagal mempublikasikan proyek atau mengkonfirmasi ke backend:", error);
      let alertMessage = 'Gagal mempublikasikan proyek.';
      if (error.message) {
        alertMessage += ` Penyebab: ${error.message}`;
      } else if (error.response?.data?.message) {
        alertMessage += ` Penyebab: ${error.response.data.message}`;
      }
      alert(alertMessage);
    }
    setIsLoading(false);
  };

  const handleClaimFunds = async () => {
    if (!campaign?.onChainProjectId || !claimFundsFromContract || !onChainData) return;
    setIsLoading(true);
    try {
      const receipt = await claimFundsFromContract(campaign.onChainProjectId);
      // Setelah klaim SC sukses, catat ke backend
      // onChainData.raisedAmount adalah jumlah yang terkumpul di SC (dalam unit standar USDT)
      await axios.post(`${API_BASE_URL}/projects/${campaign.id}/record-claim`, {
        txHash: receipt.transactionHash,
        amountClaimedUSDT: onChainData.raisedAmount 
      }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

      alert('Dana berhasil diklaim!');
      // Refresh data
      const updatedDbCampaign = await axios.get(`${API_BASE_URL}/projects/${id}`);
      setCampaign(updatedDbCampaign.data);
      if (updatedDbCampaign.data.isPublishedOnChain && getOnChainCampaignData) {
        const scData = await getOnChainCampaignData(updatedDbCampaign.data.onChainProjectId);
        setOnChainData(scData); // Ini akan menunjukkan claimed = true
      }
    } catch (error) {
      console.error("Gagal mengklaim dana:", error);
      alert(error.response?.data?.message || error.message || 'Gagal mengklaim dana.');
    }
    setIsLoading(false);
  };

  const handleApproval = async (status) => {
    const action = status === 'AKTIF' ? 'menyetujui' : 'menolak';
    const confirmation = window.confirm(`Apakah Anda yakin ingin ${action} proyek ini?`);

    if (!confirmation) return; // Jika admin membatalkan, hentikan proses

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/projects/update-status`,
        { projectId: campaign.id, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(response.data.message);
      navigate('/dashboard'); // Redirect ke dashboard setelah approval
    } catch (error) {
      console.error('Gagal memperbarui status proyek:', error);
      alert(error.response?.data?.message || 'Gagal memperbarui status proyek.');
    }
  };

  if (isLoading) return <Loader message="Memuat detail proyek..." />;

  if (!campaign) return null;

  // Prioritaskan data on-chain jika ada
  const displayTargetDana = onChainData ? onChainData.targetAmount : campaign.targetDana;
  const displayDanaTerkumpul = onChainData ? onChainData.raisedAmount : campaign.danaTerkumpul;
  const displayDeadline = onChainData ? onChainData.deadlineDate : campaign.batasWaktu;
  const displayIsClaimed = onChainData ? onChainData.claimed : (campaign?.isClaimed || false); 

  const remainingDays = campaign.status === 'AKTIF' && displayDeadline ? daysLeft(displayDeadline) : 'N/A';
  const progressPercentage = calculateBarPercentage(
    parseFloat(displayTargetDana), 
    parseFloat(displayDanaTerkumpul)
  );

  const amountInSmallestUnit = amount ? ethers.utils.parseUnits(amount, USDT_DECIMALS) : ethers.BigNumber.from(0);
  const needsApproval = allowance.lt(amountInSmallestUnit) && parseFloat(amount) > 0;

  // Fungsi untuk tombol debug
  const handleDebugFetchCampaign = async () => {
    const debugProjectId = "ce601405-fbad-45ff-91d6-da57037f5525";
    console.log(`[DEBUG] Mencoba mengambil detail untuk projectId: ${debugProjectId}`);
    setIsLoading(true);
    try {
      const scData = await getOnChainCampaignData(debugProjectId);
      console.log(`[DEBUG] Data dari SC untuk ${debugProjectId}:`, scData);
      alert(`Data untuk ${debugProjectId}:\n${JSON.stringify(scData, null, 2)}`);
    } catch (error) {
      console.error(`[DEBUG] Gagal mengambil data untuk ${debugProjectId}:`, error);
      alert(`Gagal mengambil data untuk ${debugProjectId}: ${error.message}`);
    }
    setIsLoading(false);
  };

  // Logging untuk debug kondisi tombol publish
  console.log("[CampaignDetails] Debug canPublish conditions:");
  console.log("  user:", user);
  console.log("  user?.id:", user?.id);
  console.log("  campaign?.pemilikId:", campaign?.pemilikId);
  console.log("  campaign?.status:", campaign?.status);
  console.log("  campaign?.isPublishedOnChain:", campaign?.isPublishedOnChain);
  console.log("  address (from useStateContext):", address);

  const canPublish = user?.id === campaign.pemilikId &&
                     campaign.status === 'AKTIF' &&
                     !campaign.isPublishedOnChain &&
                     address; // Pastikan wallet terhubung

  const canDonate = user?.role === 'donatur' && campaign.isPublishedOnChain && campaign.status === 'AKTIF' && !displayIsClaimed && remainingDays !== 'N/A' && parseInt(remainingDays) >= 0;
  const canClaim = user?.id === campaign.pemilikId && campaign.isPublishedOnChain && onChainData && !onChainData.claimed && (parseFloat(onChainData.raisedAmount) >= parseFloat(onChainData.targetAmount)); // Sesuaikan logika klaim jika perlu

return (
  <div className="p-6 bg-[#1c1c24] rounded-xl shadow-xl">
    <div className="flex flex-col lg:flex-row gap-10">
      {/* Bagian Kiri: Gambar dan Progress */}
      <div className="flex-1">
        <img
          src={`${IMAGE_BASE_URL}${campaign.projectImageUrl}`}
          alt={campaign.judul}
          className="w-full h-auto rounded-lg object-cover"
        />
        <div className="relative w-full h-[20px] bg-[#3a3a43] mt-4 rounded-lg overflow-hidden">
          <div
            className="absolute h-full bg-[#4acd8d] rounded-lg"
            style={{ width: `${progressPercentage}%`, maxWidth: '100%' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-semibold text-white">{progressPercentage}%</span>
          </div>
        </div>
      </div>

      {/* Bagian Kanan: Detail Proyek */}
      <div className="flex-1 flex flex-col gap-6">
        <h1 className="text-3xl font-bold text-white">{campaign.judul}</h1>
        <p className="text-md text-[#b2b3bd] leading-relaxed">{campaign.deskripsi}</p>

        {/* Statistik Proyek */}
        <div className="grid grid-cols-3 gap-4">

          {/* Duration */}
          <div className="flex flex-col items-center justify-center bg-[#2c2f32] p-4 rounded-lg">
            <h4 className="font-epilogue font-semibold text-lg text-white">Durasi Hari</h4>
            <p className="text-2xl font-bold text-[#4acd8d]">
              {campaign.durasiHari}
            </p>
          </div>

          {/* Days Left */}
          <div className="flex flex-col items-center justify-center bg-[#2c2f32] p-4 rounded-lg">
            <h4 className="font-epilogue font-semibold text-lg text-white">Sisa Hari</h4>
            <p className="text-2xl font-bold text-[#4acd8d]">
              {remainingDays !== 'Not Active' ? `${remainingDays} hari` : 'Not Active'}
            </p>
          </div>

          {/* Total Backers */}
          <div className="flex flex-col items-center justify-center bg-[#2c2f32] p-4 rounded-lg">
            <h4 className="font-epilogue font-semibold text-lg text-white">Total Donatur</h4>
            <p className="text-2xl font-bold text-[#4acd8d]">{onChainDonators.length}</p>
          </div>
        </div>

        {/* Raised of USDT */}
        <div className="mt-4 bg-[#2c2f32] p-4 rounded-lg text-center">
          <h4 className="font-epilogue font-semibold text-lg text-white mb-1">
            Terkumpul Dari {displayTargetDana} USDT
          </h4>
          <p className="text-2xl font-bold text-[#4acd8d]">{displayDanaTerkumpul} USDT</p>
        </div>

        <div className="mt-6">
          <h4 className="font-epilogue font-semibold text-lg text-white">Anggota Tim</h4>
          <div className="flex flex-col gap-4 mt-4">
            {campaign.timProyek ? (
              <>
                {/* Ketua Tim */}
                <div className="flex items-center gap-4 bg-[#2c2f32] p-4 rounded-lg">
                  <div className="w-[52px] h-[52px] rounded-full bg-[#2c2f32] flex items-center justify-center">
                    <img
                      src={thirdweb}
                      alt={campaign.timProyek.ketuaTim.namaLengkap}
                      className="w-[60%] h-[60%] object-contain"
                    />
                  </div>
                  <div>
                    <h4 className="font-epilogue font-semibold text-md text-white">
                      {campaign.timProyek.ketuaTim.namaLengkap} (Ketua Tim)
                    </h4>
                    <p className="text-sm text-[#808191]">{campaign.timProyek.ketuaTim.nim}</p>
                  </div>
                </div>

                {/* Anggota Tim */}
                {campaign.timProyek.anggotaMahasiswa.map((anggota) => (
                  <div
                    key={anggota.id}
                    className="flex items-center gap-4 bg-[#2c2f32] p-4 rounded-lg"
                  >
                    <div className="w-[52px] h-[52px] rounded-full bg-[#2c2f32] flex items-center justify-center">
                      <img
                        src={thirdweb}
                        alt={anggota.namaLengkap}
                        className="w-[60%] h-[60%] object-contain"
                      />
                    </div>
                    <div>
                      <h4 className="font-epilogue font-semibold text-md text-white">
                        {anggota.namaLengkap}
                      </h4>
                      <p className="text-sm text-[#808191]">{anggota.nim}</p>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="flex items-center gap-4">
                <div className="w-[52px] h-[52px] rounded-full bg-[#2c2f32] flex items-center justify-center">
                  <img
                    src={thirdweb}
                    alt="creator"
                    className="w-[60%] h-[60%] object-contain"
                  />
                </div>
                <div>
                  <h4 className="font-epilogue font-semibold text-md text-white">{campaign.pemilik.namaLengkap}</h4>
                  <p className="text-sm text-[#808191]">{campaign.pemilik.nim}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Tombol Publish ke Blockchain untuk Pemilik Proyek */}
        {canPublish && (
          <div className="mt-6">
            <CustomButton
              title="Publikasikan ke Blockchain"
              styles="w-full bg-blue-600 hover:bg-blue-700"
              handleClick={() => {
                console.log("--- Tombol 'Publikasikan ke Blockchain' DIKLIK ---");
                handlePublishToBlockchain();
              }}
              disabled={isLoading || !address} // Disable jika wallet tidak terhubung
            />
          </div>
        )}

        {/* Tombol Klaim Dana untuk Pemilik Proyek */}
        {canClaim && (
          <div className="mt-6">
            <CustomButton
              title="Klaim Dana"
              styles="w-full bg-emerald-500 hover:bg-emerald-600"
              handleClick={handleClaimFunds}
              disabled={isLoading}
            />
          </div>
        )}
        {user?.role === 'admin' && campaign.status === 'PENDING_REVIEW' && (
          <div className="flex gap-4 mt-6">
            <CustomButton
              title="Setujui Proyek"
              styles="bg-green-500 hover:bg-green-600"
              handleClick={() => handleApproval('AKTIF')}
            />
            <CustomButton
              title="Tolak Proyek"
              styles="bg-red-500 hover:bg-red-600"
              handleClick={() => handleApproval('DITOLAK')}
            />
          </div>
        )}
      </div>
    </div>

    {/* Bagian Donasi */}
    {canDonate && (
      <div className="mt-10 bg-[#2c2f32] p-6 rounded-lg">
        <h4 className="font-epilogue font-semibold text-lg text-white">Fund the Campaign</h4>
        <div className="mt-4 flex flex-col sm:flex-row gap-4">
          <input
            type="number"
            placeholder="Jumlah USDT"
            step="0.01" 
            className="flex-1 py-3 px-4 outline-none border border-[#3a3a43] bg-transparent text-white rounded-lg disabled:opacity-50"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isApproving || isDonating}
          />
          {needsApproval ? (
            <CustomButton
              btnType="button"
              title={isApproving ? "Approving..." : `Approve ${amount} USDT`}
              styles="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600"
              handleClick={handleApprove}
              disabled={isApproving || isDonating || !amount || parseFloat(amount) <= 0}
            />
          ) : (
            <CustomButton
              btnType="button"
              title={isDonating ? "Donating..." : "Fund Campaign"}
              styles="w-full sm:w-auto bg-[#8c6dfd] hover:bg-purple-700"
              handleClick={handleDonateWithUSDT}
              disabled={isApproving || isDonating || !amount || parseFloat(amount) <= 0 || allowance.isZero()}
            />
          )}
        </div>
        {!allowance.isZero() && (
          <p className="text-xs text-gray-400 mt-2">
            Allowance saat ini: {ethers.utils.formatUnits(allowance, USDT_DECIMALS)} USDT untuk kontrak IdeaFund.
          </p>
        )}
      </div>
    )}

    {/* Bagian Donator */}
    <div className="mt-10">
      <h4 className="font-epilogue font-semibold text-lg text-white">Donatur</h4>
      <div className="mt-4 flex flex-col gap-4">
        {onChainDonators.length > 0 ? (
          onChainDonators.map((item, index) => (
            <div
              key={`${item.donator}-${index}`}
              className="flex justify-between items-center bg-[#2c2f32] p-4 rounded-lg"
            >
              <p className="text-sm text-[#b2b3bd]">{index + 1}. {item.donator}</p>
              <p className="text-sm text-[#808191]">{item.donation} USDT</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-[#808191]">Belum ada donatur saat ini, jadilah yang pertama!</p>
        )}
      </div>
    </div>
  </div>
);
};

export default CampaignDetails;