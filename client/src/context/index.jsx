// src/context/StateContext.jsx
import React, { useContext, createContext, useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';

// Impor dari SDK Thirdweb v5+
import { useActiveAccount, useReadContract, useSendTransaction } from "thirdweb/react"; // Ganti useContractWrite dengan useSendTransaction atau prepareTransaction + sendTransaction
import { getContract, readContract, sendTransaction, prepareContractCall } from "thirdweb"; // Ganti prepareTransaction dengan prepareContractCall
import { sepolia } from "thirdweb/chains"; // Impor chain jika perlu
import { client } from '../thirdwebClient'; // Impor client yang sudah terpusat

const StateContext = createContext(undefined);

const ideaFundContractAddress = import.meta.env.VITE_IDEA_FUND_CONTRACT_ADDRESS; // Alamat kontrak IdeaFund Anda
const usdtTokenAddress = "0x7169D38820dfd117C3FA1f22a697dBA58d90BA06"; // Alamat kontrak USDT Sepolia
const USDT_DECIMALS = 6;

export const StateContextProvider = ({ children }) => {
  const activeAccount = useActiveAccount();
  const address = activeAccount?.address;
  
  // This useEffect will run on mount and whenever activeAccount reference changes.
  useEffect(() => {
    console.log("[StateContext] activeAccount from useActiveAccount() HAS (RE)COMPUTED:", activeAccount);
    console.log("[StateContext] Derived address for context:", address);
  }, [activeAccount, address]); // address is derived, so activeAccount is the primary dependency.

  if (!ideaFundContractAddress) {
    console.error("KRITIS: VITE_IDEA_FUND_CONTRACT_ADDRESS tidak ditemukan di environment variables.");
    // Anda bisa melempar error di sini untuk menghentikan aplikasi atau menampilkan pesan error UI
    throw new Error("KRITIS: Alamat kontrak IdeaFund tidak dikonfigurasi. Periksa file .env Anda.");
  }

  // Mendapatkan instance kontrak (ini tidak lagi berupa hook state, tapi fungsi utilitas)
  const contract = getContract({ 
    client, 
    chain: sepolia, // Pastikan chain ini benar
    address: ideaFundContractAddress
  });

  const usdtContract = getContract({
    client,
    chain: sepolia,
    address: usdtTokenAddress
  });

  const { 
    mutateAsync: sendCampaignTransaction, 
    isLoading: isPublishing, 
    error: sendTransactionError // Tangkap state error dari hook
  } = useSendTransaction();

  // Log sendTransactionError ketika berubah
  useEffect(() => {
    if (sendTransactionError) {
      console.error("[StateContext] Error dari hook useSendTransaction:", sendTransactionError);
    }
  }, [sendTransactionError]);

  // Untuk write operations, kita akan menggunakan useSendTransaction atau prepare + send

  // Fungsi untuk memanggil fungsi read di kontrak (contoh, bisa juga pakai useReadContract hook)
  const callReadFunction = useCallback(async (functionName, params = []) => {
    if (!contract) {
      console.error("Kontrak belum terinisialisasi");
      return undefined;
    }
    try {
      const data = await readContract({
        contract,
        method: `function ${functionName}(${params.map((_,i) => `arg${i}`).join(',')}) view returns (bytes)`, // Perlu ABI atau signature yang lebih spesifik
        // Atau jika Anda punya ABI: method: "getCampaigns", params
        // Untuk getCampaigns, Anda perlu signature yang benar atau ABI
        // Contoh generik:
        // method: "function getCampaigns() view returns (tuple(address owner, string title, string description, uint256 target, uint256 deadline, uint256 amountCollected, string image, uint256 pId)[])",
        // params: [],
        // Karena getCampaigns mengembalikan array struct, signaturenya perlu tepat
        // Untuk sementara, kita akan coba dengan signature yang lebih umum dan Anda perlu sesuaikan
        params: params,
        // Baris di atas adalah duplikat dan telah dihapus/dikomentari untuk memperbaiki error.
      });
      return data;
    } catch (error) {
      console.error(`Gagal memanggil ${functionName}:`, error);
      return undefined;
    }
  }, [contract]);


  const publishCampaign = async (campaignDataFromDB) => { // Renamed 'form' to 'campaignDataFromDB' for clarity
    console.log("[Context:publishCampaign] Dipanggil dengan data:", campaignDataFromDB);
    if (!address || !contract) {
      console.error("Wallet tidak terhubung atau kontrak tidak siap.");
      // Melempar error agar bisa ditangkap oleh UI
      throw new Error("Wallet tidak terhubung atau kontrak tidak siap. Pastikan Anda terhubung dengan MetaMask.");
    }
    if (!campaignDataFromDB || !campaignDataFromDB.id || !campaignDataFromDB.judul || campaignDataFromDB.targetDana == null || campaignDataFromDB.durasiHari == null) {
      console.error("[Context:publishCampaign] Data kampanye tidak lengkap:", campaignDataFromDB);
      throw new Error("Data kampanye tidak lengkap untuk publikasi.");
    }

    try {
      // Menggunakan data dari campaignDataFromDB yang sesuai dengan IdeaFund.sol
      // Target dana sekarang dalam USDT, konversi ke unit terkecil USDT (6 desimal)
      const targetAmountSmallestUnit = ethers.utils.parseUnits(String(campaignDataFromDB.targetDana), USDT_DECIMALS);
      const durasiHariInt = parseInt(campaignDataFromDB.durasiHari, 10);

      console.log(`[Context:publishCampaign] Mempersiapkan transaksi untuk SC.createCampaign dengan:
        ID Proyek (UUID) untuk CREATE: "${campaignDataFromDB.id}"
        Judul untuk CREATE: "${campaignDataFromDB.judul}"
        Target (USDT Smallest Unit) untuk CREATE: ${targetAmountSmallestUnit.toString()}
        Durasi Hari untuk CREATE: ${durasiHariInt}`);

      // Dengan SDK v5, Anda membuat transaksi lalu mengirimnya
      const transaction = prepareContractCall({ // Ganti menjadi prepareContractCall
        contract,
        // Signature harus SANGAT TEPAT sesuai dengan IdeaFund.sol
        method: "function createCampaign(string _projectId, string _title, uint256 _targetAmount, uint256 _durationDays)",
        params: [
          campaignDataFromDB.id,         // _projectId
          campaignDataFromDB.judul,      // _title
          targetAmountSmallestUnit,      // _targetAmount (dalam unit terkecil token)
          durasiHariInt                  // _durationDays
        ]
      });
      console.log("[Context:publishCampaign] prepareContractCall selesai. Objek transaksi yang disiapkan:", transaction);

      console.log("[Context:publishCampaign] Mencoba mengirim transaksi dengan sendCampaignTransaction...");
      const receipt = await sendCampaignTransaction(transaction); 
      console.log("[Context:publishCampaign] Panggilan kontrak publishCampaign berhasil, receipt:", receipt);
      return receipt; // Mengembalikan seluruh objek receipt yang berisi transactionHash dll.
    } catch (error) {
      console.error("[Context:publishCampaign] Panggilan kontrak publishCampaign gagal. Error object:", error);
      // Periksa apakah error juga terdeteksi di state useSendTransaction
      if (sendTransactionError) {
         console.error("[Context:publishCampaign] Error juga terdeteksi di state useSendTransaction:", sendTransactionError);
      }
      if (error instanceof Error) {
        throw new Error(`Gagal mempublikasikan kampanye: ${error.message}`);
      } else {
        throw new Error("Gagal mempublikasikan kampanye karena kesalahan yang tidak diketahui.");
      }
    }
  };

  const getCampaigns = useCallback(async () => {
    if (!contract) return [];
    try {
      // Anda perlu signature yang benar untuk getCampaigns atau pastikan ABI ter-resolve
      // Contoh jika getCampaigns() mengembalikan array dari struct Campaign
      const data = await readContract({
          contract,
          // Ganti dengan signature yang benar dari IdeaFund.sol jika ada fungsi getCampaigns
          method: "function getCampaigns() view returns (tuple(address payable owner, string projectId, string title, uint256 targetAmount, uint256 raisedAmount, uint256 deadline, bool exists, bool claimed, address[] donators, mapping(address => uint256) donations)[])", // CONTOH, SESUAIKAN DENGAN STRUCT ANDA
          params: []
      });

      const parsedCampaigns = data.map((campaign, i) => ({
        owner: campaign.owner,
        title: campaign.title,
        description: campaign.description, // Asumsi description ada di DB, bukan di SC struct ini
        target: ethers.utils.formatUnits(campaign.targetAmount.toString(), USDT_DECIMALS),
        deadline: Number(campaign.deadline),
        amountCollected: ethers.utils.formatUnits(campaign.raisedAmount.toString(), USDT_DECIMALS),
        // image: campaign.image, // IdeaFund.sol tidak punya image di struct Campaign
        projectId: campaign.projectId, // atau pId: campaign.projectId
        pId: i // Jika Anda masih memerlukan index
      }));
      return parsedCampaigns;
    } catch (error) {
      console.error("Gagal mengambil campaigns:", error);
      return [];
    }
  }, [contract]);

  const getUserCampaigns = useCallback(async () => {
    if (!address) return [];
    const allCampaigns = await getCampaigns();
    return allCampaigns.filter((campaign) => campaign.owner.toLowerCase() === address.toLowerCase());
  }, [address, getCampaigns]);

  // Fungsi untuk approve token USDT
  const approveUSDT = async (amountToApprove) => {
    if (!address || !usdtContract || !contract) { // contract di sini adalah ideaFundContract
      console.error("Wallet tidak terhubung atau kontrak USDT/IdeaFund tidak siap.");
      throw new Error("Wallet tidak terhubung atau kontrak tidak siap.");
    }
    try {
      const amountSmallestUnit = ethers.utils.parseUnits(String(amountToApprove), USDT_DECIMALS);
      const transaction = prepareContractCall({
        contract: usdtContract,
        method: "function approve(address spender, uint256 amount)",
        params: [contract.address, amountSmallestUnit] // spender adalah alamat kontrak IdeaFund
      });
      console.log(`[Context:approveUSDT] Menyiapkan approval untuk ${amountToApprove} USDT ke ${contract.address}`);
      const receipt = await sendCampaignTransaction(transaction); // Menggunakan hook yang sama
      console.log("[Context:approveUSDT] Approval USDT berhasil, receipt:", receipt);
      return receipt;
    } catch (error) {
      console.error("[Context:approveUSDT] Gagal melakukan approval USDT:", error);
      throw error;
    }
  };

  const donateWithUSDT = async (projectId, amountUSDT) => {
    if (!address || !contract) {
      console.error("Wallet tidak terhubung atau kontrak IdeaFund tidak siap untuk donasi.");
      throw new Error("Wallet tidak terhubung atau kontrak IdeaFund tidak siap.");
    }
    try {
      const amountSmallestUnit = ethers.utils.parseUnits(String(amountUSDT), USDT_DECIMALS);
      const transaction = prepareContractCall({
        contract: contract, // Ini adalah ideaFundContract
        method: "function donateToCampaign(string _projectId, uint256 _amount)",
        params: [projectId, amountSmallestUnit]
      });
      console.log(`[Context:donateWithUSDT] Menyiapkan donasi ${amountUSDT} USDT untuk proyek ${projectId}`);
      const receipt = await sendCampaignTransaction(transaction); // Menggunakan hook yang sama
      console.log("[Context:donateWithUSDT] Donasi USDT berhasil, receipt:", receipt);
      return receipt; // Mengembalikan receipt agar bisa dapat txHash
    } catch (error) {
      console.error("[Context:donateWithUSDT] Donasi USDT gagal:", error);
      throw error;
    }
  };

  const getDonations = useCallback(async (projectId) => {
    if (!contract) return [];
    try {
      // Ambil daftar alamat donatur
      const data = await readContract({
          contract,
          method: "function getDonators(string _projectId) view returns (address[] memory)",
          params: [projectId]
      });
      
      const donators = data; // Ini adalah array alamat donatur
      const parsedDonations = [];

      for (let i = 0; i < donators.length; i++) {
        // Untuk setiap donatur, ambil jumlah donasinya
        const donationAmountSmallestUnit = await readContract({
            contract,
            method: "function getDonationAmountByDonator(string _projectId, address _donator) view returns (uint256)",
            params: [projectId, donators[i]]
        });
        parsedDonations.push({
          donator: donators[i],
          donation: ethers.utils.formatUnits(donationAmountSmallestUnit.toString(), USDT_DECIMALS)
        });
      }
      return parsedDonations;
    } catch (error) {
      console.error("Gagal mengambil donasi:", error);
      return [];
    }
  }, [contract]);

  // Implementasi getOnChainCampaignData
  const getOnChainCampaignData = useCallback(async (projectId) => {
    if (!contract || !projectId) {
      console.error("Kontrak belum terinisialisasi atau projectId tidak ada untuk getOnChainCampaignData");
      return null;
    }
    console.log(`[StateContext:getOnChainCampaignData] Memanggil getCampaignDetails untuk projectId (PARAM): "${projectId}"`);
    try {
      const details = await readContract({
        contract,
        method: "function getCampaignDetails(string _projectId) view returns (address owner, string title, uint256 targetAmount, uint256 raisedAmount, uint256 deadline, bool claimed)",
        params: [projectId] // Pastikan projectId ini adalah string yang benar
      });
      // 'details' akan menjadi array sesuai urutan return values
      return {
        owner: details[0],
        title: details[1],
        targetAmount: ethers.utils.formatUnits(details[2].toString(), USDT_DECIMALS),
        raisedAmount: ethers.utils.formatUnits(details[3].toString(), USDT_DECIMALS),
        deadlineTimestamp: Number(details[4]),
        deadlineDate: new Date(Number(details[4]) * 1000),
        claimed: details[5],
      };
    } catch (error) {
      console.error(`Gagal mengambil detail on-chain untuk proyek ${projectId}:`, error);
      // Pertimbangkan untuk melempar error agar UI bisa menanganinya
      // throw error; 
      return null;
    }
  }, [contract]);

  return (
    <StateContext.Provider
      value={{ 
        walletAddress: address, // Menggunakan walletAddress dari useActiveAccount
        address: address, // Tambahkan 'address' agar konsisten dengan penggunaan di CampaignDetails
        ideaFundContractInstance: contract, // Ganti nama agar lebih jelas ini adalah IdeaFund
        usdtContractInstance: usdtContract, // Tambahkan instance kontrak USDT
        connect: null, // connect() dari SDK lama tidak dipakai, gunakan ConnectButton dari Thirdweb
        publishCampaignToBlockchain: publishCampaign, // Mengganti nama 'createCampaign' menjadi 'publishCampaignToBlockchain'
        getCampaigns,
        getUserCampaigns,
        approveUSDT, // Tambahkan fungsi approve
        donateWithUSDT, // Ganti nama fungsi donasi
        getDonations,
        getOnChainCampaignData, // Tambahkan ini
        isPublishingCampaign: isPublishing, 
      }}
    >
      {children}
    </StateContext.Provider>
  );
}

export const useStateContext = () => {
    const context = useContext(StateContext);
    if (context === undefined) {
        throw new Error('useStateContext must be used within a StateContextProvider');
    }
    return context;
};
