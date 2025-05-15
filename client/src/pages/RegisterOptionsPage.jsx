// src/pages/RegisterOptionsPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { CustomButton } from '../components'; // Asumsi path komponen

const RegisterOptionsPage = () => {
  return (
    <div className="bg-[#13131a] flex flex-col items-center justify-center p-4 min-h-[calc(100vh-150px)]"> {/* Adjust min-height if navbar height changes */}
      <div className="bg-[#1c1c24] p-8 rounded-[10px] shadow-md w-full max-w-md text-center">
        <h1 className="font-epilogue font-bold text-white sm:text-[28px] text-[20px] leading-[38px] mb-6">
          Registrasi Akun Baru
        </h1>
        <p className="font-epilogue font-normal text-[16px] text-[#808191] mb-8">
          Pilih peran Anda untuk melanjutkan proses pendaftaran di platform IBIK IdeaFund.
        </p>
        <div className="flex flex-col gap-4">
          <Link to="/register-mahasiswa" className="w-full">
            <CustomButton
              btnType="button"
              title="Daftar sebagai Mahasiswa"
              styles="w-full bg-[#1dc071] hover:bg-green-600"
            />
          </Link>
          <Link to="/register-donatur" className="w-full">
            <CustomButton
              btnType="button"
              title="Daftar sebagai Donatur"
              styles="w-full bg-[#8c6dfd] hover:bg-purple-700"
            />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterOptionsPage;