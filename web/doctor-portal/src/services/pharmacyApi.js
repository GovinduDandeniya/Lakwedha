import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'https://lakwedha.onrender.com/api/v1';

const pharmacyApi = axios.create({
    baseURL: BASE,
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000,
});

pharmacyApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('pharmacy_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

pharmacyApi.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem('pharmacy_token');
            localStorage.removeItem('pharmacy_user');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

export default pharmacyApi;
