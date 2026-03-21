import { STORAGE_KEYS } from '../utils/constants';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL
    || (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace('/api/v1', '').replace('/api', '');

const EMR_BASE = `${BACKEND_URL}/api/emr`;

const getToken = () => localStorage.getItem(STORAGE_KEYS.TOKEN);

const authHeaders = () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
};

async function emrRequest(path, options = {}) {
    const res = await fetch(`${EMR_BASE}${path}`, {
        ...options,
        headers: { ...authHeaders(), ...options.headers },
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || body.message || `EMR request failed (${res.status})`);
    }
    return res.json();
}

const emrApi = {
    getByPatientId: (patientId) =>
        emrRequest(`/patient/${patientId}`),

    upload: (formData) =>
        fetch(`${EMR_BASE}/upload`, {
            method: 'POST',
            headers: authHeaders(),
            body: formData,
        }).then(async (res) => {
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || body.message || `Upload failed (${res.status})`);
            }
            return res.json();
        }),

    getFileUrl: (fileUrl) => {
        if (!fileUrl) return null;
        if (fileUrl.startsWith('/api/emr/files/')) {
            return `${BACKEND_URL}${fileUrl}`;
        }
        return fileUrl;
    },

    fetchSecureFile: async (fileUrl) => {
        const url = emrApi.getFileUrl(fileUrl);
        if (!url) return null;
        const res = await fetch(url, { headers: authHeaders() });
        if (!res.ok) throw new Error('Failed to fetch secure file');
        const blob = await res.blob();
        return URL.createObjectURL(blob);
    },
};

export default emrApi;
