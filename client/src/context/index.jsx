// src/context/StateContext.jsx
import React, { useContext, createContext, useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';

// Impor dari SDK Thirdweb v5+
import { useActiveAccount, useReadContract, useSendTransaction } from "thirdweb/react"; // Ganti useContractWrite dengan useSendTransaction atau prepareTransaction + sendTransaction
import { getContract, readContract, sendTransaction, prepareTransaction } from "thirdweb"; // Untuk interaksi kontrak
import { createThirdwebClient } from 'thirdweb'; // Jika client belum global
import { sepolia } from "thirdweb/chains"; // Impor chain jika perlu

const StateContext = createContext(undefined);

// Anda sebaiknya membuat instance client sekali saja, idealnya di main.jsx dan teruskan jika perlu,
// atau impor dari file konfigurasi terpisah.
// Untuk contoh ini, kita buat lagi di sini, tapi ini bukan praktik terbaik jika sudah ada di main.jsx.
// Idealnya, client dari main.jsx bisa diakses di sini (misal via props atau context lain).
// Untuk sementara, kita definisikan ulang di sini agar contoh berjalan.
const thirdwebClientId = "8c69441790f9fbaabbb795a921abb3f1"; // Pastikan ini benar
const client = createThirdwebClient({ clientId: thirdwebClientId });

const contractAddress = '0xf84bab6f1c2ae4f4cdfba3d921cecb593a765547'; // Alamat kontrak Anda

export const StateContextProvider = ({ children }) => {
  const activeAccount = useActiveAccount();
  const address = activeAccount?.address;
  
  // Mendapatkan instance kontrak (ini tidak lagi berupa hook state, tapi fungsi utilitas)
  const contract = getContract({ 
    client, 
    chain: sepolia, // Pastikan chain ini benar
    address: contractAddress 
  });

  // Untuk write operations, kita akan menggunakan useSendTransaction atau prepare + send
  const { mutateAsync: sendCampaignTransaction, isLoading: isPublishing } = useSendTransaction();

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


  const publishCampaign = async (form) => {
    if (!address || !contract) {
      console.error("Wallet tidak terhubung atau kontrak tidak siap.");
      return;
    }
    try {
      // Dengan SDK v5, Anda membuat transaksi lalu mengirimnya
      const transaction = await prepareTransaction({
        contract,
        method: "createCampaign", // Pastikan nama fungsi dan signature-nya benar
        // method: "function createCampaign(address _owner, string _title, string _description, uint256 _target, uint256 _deadline, string _image)",
        params: [
          address, // owner
          form.title, // title
          form.description, // description
          ethers.utils.parseUnits(form.target, 18), // target (pastikan form.target adalah string angka)
          new Date(form.deadline).getTime(), // deadline,
          form.image,
        ]
      });
      const { transactionHash } = await sendCampaignTransaction(transaction);
      console.log("Panggilan kontrak publishCampaign berhasil, hash:", transactionHash);
      return transactionHash;
    } catch (error) {
      console.error("Panggilan kontrak publishCampaign gagal", error);
      throw error;
    }
  };

  const getCampaigns = useCallback(async () => {
    if (!contract) return [];
    try {
      // Anda perlu signature yang benar untuk getCampaigns atau pastikan ABI ter-resolve
      // Contoh jika getCampaigns() mengembalikan array dari struct Campaign
      const data = await readContract({
          contract,
          // Signature harus SANGAT TEPAT atau gunakan ABI
          method: "function getCampaigns() view returns (tuple(address owner, string title, string description, uint256 target, uint256 deadline, uint256 amountCollected, string image)[])", 
          params: []
      });

      const parsedCampaigns = data.map((campaign, i) => ({
        owner: campaign.owner,
        title: campaign.title,
        description: campaign.description,
        target: ethers.utils.formatEther(campaign.target.toString()),
        deadline: Number(campaign.deadline), // Pastikan konversi benar
        amountCollected: ethers.utils.formatEther(campaign.amountCollected.toString()),
        image: campaign.image,
        pId: i // pId mungkin perlu diambil dari event atau cara lain jika tidak dikembalikan kontrak
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

  const donate = async (pId, amount) => {
    if (!address || !contract) {
      console.error("Wallet tidak terhubung atau kontrak tidak siap untuk donasi.");
      return;
    }
    try {
      const transaction = await prepareTransaction({
        contract,
        method: "donateToCampaign", // Pastikan nama fungsi dan signature benar
        // method: "function donateToCampaign(uint256 _id) payable",
        params: [pId],
        value: ethers.utils.parseEther(amount) // Mengirim ETH bersama transaksi
      });
      const { transactionHash } = await sendCampaignTransaction(transaction); // Menggunakan hook yang sama
      console.log("Donasi berhasil, hash:", transactionHash);
      return transactionHash;
    } catch (error) {
      console.error("Donasi gagal", error);
      throw error;
    }
  };

  const getDonations = useCallback(async (pId) => {
    if (!contract) return [];
    try {
      // Anda perlu signature yang benar untuk getDonators
      const data = await readContract({
          contract,
          method: "function getDonators(uint256 _id) view returns (address[] memory, uint256[] memory)",
          params: [pId]
      });
      
      const donators = data[0];
      const donations = data[1];
      const parsedDonations = [];

      for (let i = 0; i < donators.length; i++) {
        parsedDonations.push({
          donator: donators[i],
          donation: ethers.utils.formatEther(donations[i].toString())
        });
      }
      return parsedDonations;
    } catch (error) {
      console.error("Gagal mengambil donasi:", error);
      return [];
    }
  }, [contract]);

  return (
    <StateContext.Provider
      value={{ 
        walletAddress: address, // Menggunakan walletAddress dari useActiveAccount
        contractInstance: contract, // Instance kontrak yang didapat dari getContract
        connect: null, // connect() dari SDK lama tidak dipakai, gunakan ConnectButton
        createCampaign: publishCampaign,
        getCampaigns,
        getUserCampaigns,
        donate,
        getDonations,
        isPublishingCampaign: isPublishing, // State loading untuk createCampaign
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
