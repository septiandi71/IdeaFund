// src/components/ToggleSwitch.jsx
import React from 'react';

const ToggleSwitch = ({ label, name, checked, onChange, disabled, styles }) => {
  return (
    <label htmlFor={name} className={`flex items-center cursor-pointer select-none ${styles} ${disabled ? 'opacity-70' : ''}`}>
      <div className="relative">
        <input 
          type="checkbox" 
          id={name} 
          name={name}
          className="sr-only" // Sembunyikan checkbox asli
          checked={checked}
          onChange={onChange}
          disabled={disabled}
        />
        {/* Latar Belakang Toggle */}
        <div className={`block w-14 h-8 rounded-full transition-colors duration-300 ease-in-out ${checked ? 'bg-gradient-to-r from-[#1dc071] to-[#4acd8d]' : 'bg-gray-600'}`}></div>
        {/* Tombol Geser */}
        <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-300 ease-in-out ${checked ? 'transform translate-x-6' : ''}`}></div>
      </div>
      {label && <span className="ml-3 font-epilogue font-semibold text-[16px] text-white">{label}</span>}
    </label>
  );
};

export default ToggleSwitch;
