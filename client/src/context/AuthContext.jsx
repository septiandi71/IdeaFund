// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(undefined);
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
axios.defaults.withCredentials = true;

export const AuthContextProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [authError, setAuthError] = useState(null);

    const clearAuthError = useCallback(() => setAuthError(null), []);

    const fetchCurrentUser = useCallback(async () => {
        console.log("AuthContext: Attempting to fetch current user...");
        setIsLoading(true); // Set loading true di awal fetch sesi
        clearAuthError();
        try {
            const response = await axios.get(`${API_BASE_URL}/auth/me`);
            if (response.data && response.data.user) {
                setUser(response.data.user);
                console.log("AuthContext: Current user fetched:", response.data.user);
            } else {
                setUser(null);
                console.log("AuthContext: No user data in /me response, setting user to null.");
            }
        } catch (err) {
            setUser(null);
            const status = err.response?.status;
            if (status !== 401) {
                setAuthError(err.response?.data?.message || 'Gagal mengambil data sesi.');
                console.error("AuthContext: Error fetching current user (status !== 401):", err.response?.data?.message);
            } else {
                console.log("AuthContext: fetchCurrentUser - Not authenticated (401) or network error.");
            }
        } finally {
            setIsLoading(false);
        }
    }, [clearAuthError]);

    useEffect(() => {
        fetchCurrentUser();
    }, [fetchCurrentUser]); // Jalankan fetchCurrentUser saat context dimuat

    const callApi = async (method, endpoint, data = null, config = {}) => {
        // Tidak set isLoading true di sini, biarkan fungsi pemanggil yang mengelola state loading spesifik mereka
        clearAuthError();
        try {
            const response = await axios({ method, url: `${API_BASE_URL}${endpoint}`, data, ...config });
            return response.data;
        } catch (err) {
            const message = err.response?.data?.message || err.message || `API call failed: ${method} ${endpoint}`;
            setAuthError(message);
            console.error("AuthContext: API Call Error:", message, err.response?.data || err);
            throw new Error(message);
        }
    };

    // --- REGISTRASI MAHASISWA ---
    const registerMahasiswaRequestOtp = (data) => callApi('post', '/auth/register/mahasiswa/request-otp', data);
    const registerMahasiswaFinalize = async (data) => { // data = { otp, walletAddress }
        setIsLoading(true); // Set loading spesifik untuk operasi ini
        try {
            const response = await callApi('post', '/auth/register/mahasiswa/finalize', data);
            if (response.user) { // Backend mengembalikan user jika sukses
                setUser(response.user); // Update user state di context
                console.log("Registrasi & Login Mahasiswa Sukses via Context:", response.user);
            }
            return response; // Kembalikan seluruh respons agar komponen bisa ambil message
        } catch (error) {
            throw error; // Lemparkan error agar bisa ditangkap komponen
        } finally {
            setIsLoading(false);
        }
    };

    // --- REGISTRASI DONATUR ---
    const registerDonaturRequestOtp = (data) => callApi('post', '/auth/register/donatur/request-otp', data);
    const registerDonaturFinalize = async (data) => { // data = { otp, walletAddress }
        setIsLoading(true);
        try {
            const response = await callApi('post', '/auth/register/donatur/finalize', data);
            if (response.user) {
                setUser(response.user);
                console.log("Registrasi & Login Donatur Sukses via Context:", response.user);
            }
            return response;
        } catch (error) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // --- LOGIN ---
    const loginRequestOtp = (walletAddress) => callApi('post', '/auth/login/request-otp', { walletAddress });
    const loginVerifyOtp = async (walletAddress, otp) => {
        setIsLoading(true);
        try {
            const response = await callApi('post', '/auth/login/verify-otp', { walletAddress, otp });
            if (response.user) {
                setUser(response.user);
            }
            return response;
        } catch (error) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    };
    
    const logout = async () => {
        setIsLoading(true);
        clearAuthError();
        try {
            await callApi('post', '/auth/logout');
        } catch (err) {
            console.warn("AuthContext: Error during server-side logout (ignoring for client state):", err.message);
        } finally {
            setUser(null);
            setIsLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            isAuthenticated: !!user,
            isLoading, 
            authError,
            setAuthError, 
            clearAuthError,
            registerMahasiswaRequestOtp,
            registerMahasiswaFinalize,
            registerDonaturRequestOtp,
            registerDonaturFinalize,
            loginRequestOtp, 
            loginVerifyOtp,
            logout,
            fetchCurrentUser 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthContextProvider');
    }
    return context;
};
