import axios from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from '../utils/constants';
import { getMockResponse, MOCK_TOKEN, MOCK_DOCTOR } from './mockData';

// ── Dev-only: seed mock auth so the app opens directly on the dashboard ───────
if (process.env.NODE_ENV === 'development') {
    if (!localStorage.getItem(STORAGE_KEYS.TOKEN)) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, MOCK_TOKEN);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(MOCK_DOCTOR));
    }
}

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    // Short timeout so the mock fallback kicks in quickly when the backend is offline
    timeout: 3000,
});

// ── Request: attach auth token ────────────────────────────────────────────────
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

// ── Response: real data when backend is up; mock data when it is offline ──────
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isNetworkDown =
            !error.response ||
            error.code === 'ERR_NETWORK' ||
            error.code === 'ECONNREFUSED' ||
            error.code === 'ERR_CONNECTION_REFUSED' ||
            error.message?.toLowerCase().includes('network');

        if (isNetworkDown && process.env.NODE_ENV === 'development') {
            const mock = getMockResponse(error.config?.url, error.config?.method);
            if (mock !== null) {
                console.info('[Mock API]', error.config?.method?.toUpperCase(), error.config?.url);
                return Promise.resolve({
                    data: mock, status: 200, statusText: 'OK (mock)',
                    headers: {}, config: error.config,
                });
            }
        }

        // Real 401 → clear token and go to login
        if (error.response?.status === 401) {
            localStorage.removeItem(STORAGE_KEYS.TOKEN);
            localStorage.removeItem(STORAGE_KEYS.USER);
            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

export default api;
