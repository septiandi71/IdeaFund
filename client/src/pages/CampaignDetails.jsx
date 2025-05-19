import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ethers } from 'ethers';

import { useStateContext } from '../context';
import { CountBox, CustomButton, Loader } from '../components';
import { calculateBarPercentage, daysLeft } from '../utils';
import { thirdweb } from '../assets';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const IMAGE_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/';

const CampaignDetails = () => {
  const { id } = useParams(); // Ambil ID dari URL
  const navigate = useNavigate();
  const { donate, getDonations, contract, address } = useStateContext();

  const [isLoading, setIsLoading] = useState(true);
  const [campaign, setCampaign] = useState(null);
  const [amount, setAmount] = useState('');
  const [donators, setDonators] = useState([]);

  useEffect(() => {
    const fetchCampaignDetails = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/projects/${id}`);
        setCampaign(response.data);
      } catch (error) {
        console.error('Gagal memuat detail proyek:', error);
        navigate('/explore-campaign'); // Redirect jika gagal
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampaignDetails();
  }, [id, navigate]);

  const fetchDonators = async () => {
    const data = await getDonations(id);
    setDonators(data);
  };

  useEffect(() => {
    if (contract) fetchDonators();
  }, [contract, address]);

  const handleDonate = async () => {
    setIsLoading(true);
    await donate(id, amount);
    navigate('/');
    setIsLoading(false);
  };

  if (isLoading) return <Loader message="Memuat detail proyek..." />;

  if (!campaign) return null;

  const remainingDays = daysLeft(campaign.batasWaktu);
  const progressPercentage = calculateBarPercentage(campaign.targetDana, campaign.danaTerkumpul);

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
        <div className="grid grid-cols-2 gap-4">
          {/* Days Left */}
          <div className="flex flex-col items-center justify-center bg-[#2c2f32] p-4 rounded-lg">
            <h4 className="font-epilogue font-semibold text-lg text-white">Days Left</h4>
            <p className="text-2xl font-bold text-[#4acd8d]">{remainingDays}</p>
          </div>

          {/* Total Backers */}
          <div className="flex flex-col items-center justify-center bg-[#2c2f32] p-4 rounded-lg">
            <h4 className="font-epilogue font-semibold text-lg text-white">Total Backers</h4>
            <p className="text-2xl font-bold text-[#4acd8d]">{donators.length}</p>
          </div>
        </div>

        {/* Raised of USDT */}
        <div className="mt-4 bg-[#2c2f32] p-4 rounded-lg text-center">
          <h4 className="font-epilogue font-semibold text-lg text-white">
            Raised of {campaign.targetDana} USDT
          </h4>
          <p className="text-2xl font-bold text-[#4acd8d]">{campaign.danaTerkumpul} USDT</p>
        </div>

        <div className="mt-6">
          <h4 className="font-epilogue font-semibold text-lg text-white">Team Members</h4>
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
                {campaign.timProyek.anggotaList.map((anggota) => (
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
      </div>
    </div>

    {/* Bagian Donasi */}
    <div className="mt-10 bg-[#2c2f32] p-6 rounded-lg">
      <h4 className="font-epilogue font-semibold text-lg text-white">Fund the Campaign</h4>
      <div className="mt-4 flex flex-col sm:flex-row gap-4">
        <input
          type="number"
          placeholder="USDT 10"
          step="1"
          className="flex-1 py-3 px-4 outline-none border border-[#3a3a43] bg-transparent text-white rounded-lg"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <CustomButton
          btnType="button"
          title="Fund Campaign"
          styles="w-full sm:w-auto bg-[#8c6dfd]"
          handleClick={handleDonate}
        />
      </div>
    </div>

    {/* Bagian Donator */}
    <div className="mt-10">
      <h4 className="font-epilogue font-semibold text-lg text-white">Donators</h4>
      <div className="mt-4 flex flex-col gap-4">
        {donators.length > 0 ? (
          donators.map((item, index) => (
            <div
              key={`${item.donator}-${index}`}
              className="flex justify-between items-center bg-[#2c2f32] p-4 rounded-lg"
            >
              <p className="text-sm text-[#b2b3bd]">{index + 1}. {item.donator}</p>
              <p className="text-sm text-[#808191]">{item.donation} USDT</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-[#808191]">No donators yet. Be the first one!</p>
        )}
      </div>
    </div>
  </div>
);
};

export default CampaignDetails;