// src/components/FormField.jsx
import React from 'react';

const FormField = ({ labelName, placeholder, inputType, isTextArea, value, handleChange, name, isRequired, styles, disabled }) => { // Tambahkan prop 'name', 'isRequired', 'styles', 'disabled'
  return (
    <label className="flex-1 w-full flex flex-col">
      {labelName && (
        <span className={`font-epilogue font-medium text-[14px] leading-[22px] text-[#808191] mb-[10px]`}>
          {labelName} {isRequired && <span className="text-red-500">*</span>}
        </span>
      )}
      {isTextArea ? (
        <textarea 
          required={isRequired} // Gunakan prop isRequired
          value={value}
          onChange={handleChange}
          name={name} // <<< TAMBAHKAN INI
          rows={10}
          placeholder={placeholder}
          disabled={disabled} // Tambahkan prop disabled
          className={`py-[15px] sm:px-[25px] px-[15px] outline-none border-[1px] border-[#3a3a43] bg-transparent font-epilogue text-white text-[14px] placeholder:text-[#4b5264] rounded-[10px] sm:min-w-[300px] focus:border-[#4acd8d] transition-colors duration-200 ease-in-out ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${styles}`}
        />
      ) : (
        <input 
          required={isRequired} // Gunakan prop isRequired
          value={value}
          onChange={handleChange}
          type={inputType}
          name={name} // <<< TAMBAHKAN INI
          step={inputType === 'number' ? "0.01" : undefined} // step hanya relevan untuk type number
          placeholder={placeholder}
          disabled={disabled} // Tambahkan prop disabled
          className={`py-[15px] sm:px-[25px] px-[15px] outline-none border-[1px] border-[#3a3a43] bg-transparent font-epilogue text-white text-[14px] placeholder:text-[#4b5264] rounded-[10px] sm:min-w-[300px] focus:border-[#4acd8d] transition-colors duration-200 ease-in-out ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${styles}`}
        />
      )}
    </label>
  )
}

export default FormField;
