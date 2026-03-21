const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/* ── Helper ── */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const res = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || body.error || `Request failed (${res.status})`);
    }

    return res.json();
}

/* ── Auth ── */
export const authApi = {
    login: (email: string, password: string) =>
        request<{ token: string; user: Record<string, unknown> }>('/v1/users/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        }),

    register: (data: Record<string, unknown>) =>
        request<{ token: string; user: Record<string, unknown> }>('/v1/users/register', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
};

/* ── Admin — Doctors ── */
export const doctorApi = {
    getAll: () => request<unknown[]>('/admin/doctors'),
    approve: (id: string) => request<unknown>(`/admin/doctors/${id}/approve`, { method: 'PUT' }),
    reject: (id: string) => request<unknown>(`/admin/doctors/${id}/reject`, { method: 'PUT' }),
};

/* ── Admin — Pharmacies ── */
export const pharmacyApi = {
    getAll: () => request<unknown[]>('/admin/pharmacies'),
    approve: (id: string) => request<unknown>(`/admin/pharmacies/${id}/approve`, { method: 'PUT' }),
    reject: (id: string) => request<unknown>(`/admin/pharmacies/${id}/reject`, { method: 'PUT' }),
};

/* ── Admin — Patients ── */
export const patientApi = {
    getAll: () => request<unknown[]>('/admin/patients'),
    suspend: (id: string) => request<unknown>(`/admin/users/${id}/suspend`, { method: 'PUT' }),
    activate: (id: string) => request<unknown>(`/admin/users/${id}/activate`, { method: 'PUT' }),
    delete: (id: string) => request<unknown>(`/admin/users/${id}`, { method: 'DELETE' }),
};

/* ── Admin — Appointments ── */
export const appointmentApi = {
    getAll: (params?: { status?: string; paymentStatus?: string }) => {
        const query = new URLSearchParams(params as Record<string, string>).toString();
        return request<unknown[]>(`/admin/appointments${query ? `?${query}` : ''}`);
    },
    cancel: (id: string, reason?: string) =>
        request<{
            message: string;
            cancellationFee: number;
            refundAmount: number;
            totalAmount: number;
            appointment: unknown;
        }>(`/admin/appointments/${id}/cancel`, {
            method: 'PUT',
            body: JSON.stringify({ reason }),
        }),
};

/* ── Admin — Channeling Sessions ── */
export const channelingSessionApi = {
    getAll: (params?: { status?: string; date?: string }) => {
        const query = new URLSearchParams(params as Record<string, string>).toString();
        return request<unknown[]>(`/admin/channeling-sessions${query ? `?${query}` : ''}`);
    },
    setHospitalCharge: (id: string, hospitalCharge: number) =>
        request<{
            message: string;
            session: unknown;
            feeBreakdown: { doctorFee: number; hospitalCharge: number; channelingFee: number; totalAmount: number };
        }>(`/admin/channeling-sessions/${id}/hospital-charge`, {
            method: 'PUT',
            body: JSON.stringify({ hospitalCharge }),
        }),
};

/* ── Admin — Orders ── */
export const orderApi = {
    getAll: (params?: { status?: string; paymentStatus?: string }) => {
        const query = new URLSearchParams(params as Record<string, string>).toString();
        return request<unknown[]>(`/admin/orders${query ? `?${query}` : ''}`);
    },
};

/* ── Admin — Analytics ── */
export const analyticsApi = {
    getOverview: () => request<Record<string, unknown>>('/admin/analytics/overview'),
};

/* ── EMR ── */
export const emrApi = {
    getByPatientId: (patientId: string) =>
        request<any[]>(`/emr/patient/${patientId}`),

    upload: (formData: FormData): Promise<any> => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        return fetch(`${BASE_URL}/emr/upload`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
        }).then(async (res) => {
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || body.message || `Upload failed (${res.status})`);
            }
            return res.json();
        });
    },
};

/* ── Admin — Emergency Centers ── */
export const emergencyCenterApi = {
    getAll: () => request<unknown[]>('/emergency-centers'),
    getById: (id: string) => request<unknown>(`/emergency-centers/${id}`),
    create: (data: Record<string, unknown>) =>
        request<unknown>('/admin/emergency-centers', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    update: (id: string, data: Record<string, unknown>) =>
        request<unknown>(`/admin/emergency-centers/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
    delete: (id: string) =>
        request<unknown>(`/admin/emergency-centers/${id}`, { method: 'DELETE' }),
};
