// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { Loader } from '.'; // Asumsi ada komponen Loader

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthContext();
  const location = useLocation();

  if (isLoading) {
    return <Loader message="Memverifikasi sesi..." />; // Tampilkan loader saat status auth belum pasti
  }

  if (!isAuthenticated) {
    // Redirect ke halaman login, simpan lokasi asal agar bisa kembali setelah login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;