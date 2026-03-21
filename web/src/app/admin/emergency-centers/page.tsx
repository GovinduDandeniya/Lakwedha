'use client';

import { useEffect, useState, FormEvent } from 'react';
import { emergencyCenterApi } from '@/lib/api';
import { MapPin, Plus, Trash2, Pencil, X, Phone } from 'lucide-react';

interface Center {
    _id: string;
    name: string;
    type: string;
    address: string;
    phone: string;
    emergencyPhone?: string;
    operatingHours?: string;
    isOpen24Hours: boolean;
    services: string[];
    isActive: boolean;
    location: { coordinates: [number, number] };
    createdAt: string;
}

const emptyForm = {
    name: '',
    type: 'clinic',
    address: '',
    phone: '',
    emergencyPhone: '',
    operatingHours: '',
    isOpen24Hours: false,
    services: '',
    lng: '',
    lat: '',
};

export default function EmergencyCentersPage() {
    const [centers, setCenters] = useState<Center[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    const fetchCenters = () => {
        emergencyCenterApi
            .getAll()
            .then((res) => setCenters(res as Center[]))
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchCenters(); }, []);

    const openNew = () => {
        setEditId(null);
        setForm(emptyForm);
        setShowForm(true);
    };

    const openEdit = (c: Center) => {
        setEditId(c._id);
        setForm({
            name: c.name,
            type: c.type,
            address: c.address,
            phone: c.phone,
            emergencyPhone: c.emergencyPhone || '',
            operatingHours: c.operatingHours || '',
            isOpen24Hours: c.isOpen24Hours,
            services: c.services.join(', '),
            lng: String(c.location.coordinates[0]),
            lat: String(c.location.coordinates[1]),
        });
        setShowForm(true);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const payload = {
            name: form.name,
            type: form.type,
            address: form.address,
            phone: form.phone,
            emergencyPhone: form.emergencyPhone || undefined,
            operatingHours: form.operatingHours || undefined,
            isOpen24Hours: form.isOpen24Hours,
            services: form.services.split(',').map((s) => s.trim()).filter(Boolean),
            location: {
                type: 'Point',
                coordinates: [parseFloat(form.lng) || 0, parseFloat(form.lat) || 0],
            },
        };
        try {
            if (editId) {
                await emergencyCenterApi.update(editId, payload);
            } else {
                await emergencyCenterApi.create(payload);
            }
            setShowForm(false);
            setForm(emptyForm);
            setEditId(null);
            fetchCenters();
        } catch { /* */ }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this center?')) return;
        try { await emergencyCenterApi.delete(id); fetchCenters(); } catch { /* */ }
    };

    const typeBadge = (type: string) => {
        const map: Record<string, string> = {
            hospital: 'bg-red-100 text-red-700',
            clinic: 'bg-blue-100 text-blue-700',
            wellness_center: 'bg-purple-100 text-purple-700',
            pharmacy: 'bg-green-100 text-green-700',
        };
        return (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${map[type] || 'bg-gray-100 text-gray-600'}`}>
                {type.replace('_', ' ')}
            </span>
        );
    };

    if (loading) return <p className="text-gray-500">Loading emergency centers…</p>;

    return (
        <div className="space-y-8">
            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-green-800">Emergency Centers</h1>
                    <p className="text-sm text-gray-500">Manage health centers shown in the mobile emergency finder</p>
                </div>
                <button
                    onClick={openNew}
                    className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition"
                >
                    <Plus className="h-4 w-4" /> Add Center
                </button>
            </div>

            {/* STATS */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    { title: 'Total Centers', value: centers.length },
                    { title: 'Hospitals', value: centers.filter((c) => c.type === 'hospital').length },
                    { title: 'Clinics', value: centers.filter((c) => c.type === 'clinic').length },
                    { title: '24h Open', value: centers.filter((c) => c.isOpen24Hours).length },
                ].map((s) => (
                    <div key={s.title} className="rounded-xl bg-white p-5 shadow-sm">
                        <p className="text-sm text-gray-500">{s.title}</p>
                        <p className="mt-2 text-2xl font-bold text-green-800">{s.value}</p>
                    </div>
                ))}
            </div>

            {/* FORM MODAL */}
            {showForm && (
                <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">
                            {editId ? 'Edit Center' : 'Add New Center'}
                        </h3>
                        <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
                        <input required placeholder="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
                        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="rounded-lg border px-3 py-2 text-sm">
                            <option value="hospital">Hospital</option>
                            <option value="clinic">Clinic</option>
                            <option value="wellness_center">Wellness Center</option>
                            <option value="pharmacy">Pharmacy</option>
                        </select>
                        <input required placeholder="Address *" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="rounded-lg border px-3 py-2 text-sm sm:col-span-2" />
                        <input required placeholder="Phone *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
                        <input placeholder="Emergency Phone" value={form.emergencyPhone} onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
                        <input placeholder="Latitude *" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
                        <input placeholder="Longitude *" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
                        <input placeholder="Operating Hours (e.g. 8am-6pm)" value={form.operatingHours} onChange={(e) => setForm({ ...form, operatingHours: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input type="checkbox" checked={form.isOpen24Hours} onChange={(e) => setForm({ ...form, isOpen24Hours: e.target.checked })} className="rounded" />
                            Open 24 Hours
                        </label>
                        <input placeholder="Services (comma separated)" value={form.services} onChange={(e) => setForm({ ...form, services: e.target.value })} className="rounded-lg border px-3 py-2 text-sm sm:col-span-2" />
                        <div className="sm:col-span-2 flex justify-end gap-3">
                            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                            <button type="submit" disabled={saving} className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50">
                                {saving ? 'Saving…' : editId ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* TABLE */}
            <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-6 py-3">Center</th>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3">Phone</th>
                            <th className="px-6 py-3">Hours</th>
                            <th className="px-6 py-3">Services</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {centers.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                                    No emergency centers yet. Click &quot;Add Center&quot; to create one.
                                </td>
                            </tr>
                        )}
                        {centers.map((c) => (
                            <tr key={c._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100">
                                            <MapPin className="h-4 w-4 text-red-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-800">{c.name}</p>
                                            <p className="text-xs text-gray-400 max-w-[200px] truncate">{c.address}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">{typeBadge(c.type)}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1 text-gray-600">
                                        <Phone className="h-3.5 w-3.5" /> {c.phone}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-600">
                                    {c.isOpen24Hours ? <span className="text-green-600 font-medium">24h</span> : c.operatingHours || '—'}
                                </td>
                                <td className="px-6 py-4 text-gray-500 text-xs max-w-[150px] truncate">
                                    {c.services.length > 0 ? c.services.join(', ') : '—'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => openEdit(c)}
                                            className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(c._id)}
                                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
