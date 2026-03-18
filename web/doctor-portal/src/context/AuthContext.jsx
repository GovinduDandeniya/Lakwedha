import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { STORAGE_KEYS } from '../utils/constants';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
            const savedUser = localStorage.getItem(STORAGE_KEYS.USER);

            if (token && savedUser) {
                setUser(JSON.parse(savedUser));
                // Verify token with backend
                const response = await api.get('/auth/verify');
                if (response.data.valid) {
                    setUser(response.data.user);
                } else {
                    logout();
                }
            }
        } catch (error) {
            console.error('Auth check failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password, role: 'doctor' });
            const { token, user } = response.data;

            localStorage.setItem(STORAGE_KEYS.TOKEN, token);
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
            setUser(user);

            navigate('/dashboard');
            return { success: true };
        } catch (error) {
            if (error.response?.status === 403) {
                const { status, reason } = error.response.data;
                const pendingUser = { email };
                localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(pendingUser));
                setUser(pendingUser);
                if (status === 'PENDING') {
                    navigate('/pending');
                } else if (status === 'DECLINED') {
                    navigate('/declined', { state: { reason } });
                }
                return { success: true };
            }
            return {
                success: false,
                error: error.response?.data?.message || 'Login failed',
            };
        }
    };

    const logout = () => {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        setUser(null);
        navigate('/login');
    };

    const value = {
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};