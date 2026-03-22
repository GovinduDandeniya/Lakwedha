'use client';

import { useEffect, useState, FormEvent } from 'react';
import { emergencyCenterApi } from '@/lib/api';
import { EmergencyCentersSkeleton } from '@/components/admin/LoadingSkeleton';
import { MapPin, Plus, Trash2, Pencil, X, Phone, Clock, ShieldCheck } from 'lucide-react';

interface Center {
    _id: string;
    name: string;
    type: string;
    address: string;
    phone: string;
    emergencyPhone?: string;
    operatingHours?: string;
    is24Hours: boolean;
    emergencyTypes: string[];
    isActive: boolean;
    location: { coordinates: [number, number] };
    createdAt: string;
}

const CENTER_TYPES = [
    { value: 'ayurvedic_hospital',  label: 'Ayurvedic Hospital' },
    { value: 'ayurvedic_clinic',    label: 'Ayurvedic Clinic' },
    { value: 'panchakarma_center',  label: 'Panchakarma Center' },
    { value: 'herbal_pharmacy',     label: 'Herbal Pharmacy' },
    { value: 'wellness_center',     label: 'Wellness Center' },
];

const EMERGENCY_TYPES = [
    'Snake Bite',
    'Fractures (Hand / Leg Broken)',
    'Joint Dislocation',
    'Burn Injuries',
    'Wounds & Cuts',
    'Poisoning (Herbal First Aid)',
    'Fever & Infection',
    'Allergic Reactions',
    'Insect Bites & Stings',
    'Muscle Sprain / Ligament Injury',
    'Paralysis (Initial Care)',
    'Head Injury (Mild)',
    'Skin Diseases (Severe)',
    'Digestive Emergencies',
    'Respiratory Distress (Asthma)',
];

const TYPE_STYLES: Record<string, string> = {
    ayurvedic_hospital: 'bg-red-100 text-red-700',
    ayurvedic_clinic:   'bg-blue-100 text-blue-700',
    panchakarma_center: 'bg-purple-100 text-purple-700',
    herbal_pharmacy:    'bg-green-100 text-green-700',
    wellness_center:    'bg-amber-100 text-amber-700',
};

const emptyForm = {
    name: '',
    type: 'ayurvedic_hospital',
    address: '',
    phone: '',
    emergencyPhone: '',
    operatingHours: '',
    is24Hours: false,
    emergencyTypes: [] as string[],
    isActive: true,
    lat: '',
    lng: '',
};

export default function EmergencyCentersPage() {
    const [centers, setCenters]     = useState<Center[]>([]);
    const [loading, setLoading]     = useState(true);
    const [showForm, setShowForm]   = useState(false);
    const [editId, setEditId]       = useState<string | null>(null);
    const [form, setForm]           = useState(emptyForm);
    const [saving, setSaving]       = useState(false);
    const [filterType, setFilterType] = useState('all');

    const fetchCenters = () => {
        emergencyCenterApi
            .getAll()
            .then((res) => {
                const list = Array.isArray(res) ? res : (res as { data?: Center[] }).data ?? [];
                setCenters(list as Center[]);
            })
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
            name:           c.name,
            type:           c.type,
            address:        c.address,
            phone:          c.phone,
            emergencyPhone: c.emergencyPhone || '',
            operatingHours: c.operatingHours || '',
            is24Hours:      c.is24Hours,
            emergencyTypes: c.emergencyTypes || [],
            isActive:       c.isActive,
            lat:            String(c.location.coordinates[1]),
            lng:            String(c.location.coordinates[0]),
        });
        setShowForm(true);
    };

    const toggleEmergencyType = (type: string) => {
        setForm((f) => ({
            ...f,
            emergencyTypes: f.emergencyTypes.includes(type)
                ? f.emergencyTypes.filter((t) => t !== type)
                : [...f.emergencyTypes, type],
        }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const payload = {
            name:           form.name,
            type:           form.type,
            address:        form.address,
            phone:          form.phone,
            emergencyPhone: form.emergencyPhone || undefined,
            operatingHours: form.operatingHours || undefined,
            is24Hours:      form.is24Hours,
            emergencyTypes: form.emergencyTypes,
            isActive:       form.isActive,
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

    const typeBadge = (type: string) => (
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_STYLES[type] || 'bg-gray-100 text-gray-600'}`}>
            {CENTER_TYPES.find((t) => t.value === type)?.label || type.replaceAll('_', ' ')}
        </span>
    );

    const displayed = filterType === 'all' ? centers : centers.filter((c) => c.type === filterType);

    if (loading) return <EmergencyCentersSkeleton />;

    return (
        <div className="space-y-8">
            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-green-800">Emergency Centers</h1>
                    <p className="text-sm text-gray-500">Manage Ayurveda centers shown in the mobile emergency finder</p>
                </div>
                <button
                    onClick={openNew}
                    className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition"
                >
                    <Plus className="h-4 w-4" /> Add Center
                </button>
            </div>

            {/* STATS */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
                {[
                    { title: 'Total Centers',       value: centers.length },
                    { title: 'Ayurvedic Hospitals', value: centers.filter((c) => c.type === 'ayurvedic_hospital').length },
                    { title: 'Ayurvedic Clinics',   value: centers.filter((c) => c.type === 'ayurvedic_clinic').length },
                    { title: 'Panchakarma Centers', value: centers.filter((c) => c.type === 'panchakarma_center').length },
                    { title: '24h Open',            value: centers.filter((c) => c.is24Hours).length },
                ].map((s) => (
                    <div key={s.title} className="rounded-xl bg-white p-5 shadow-sm">
                        <p className="text-sm text-gray-500">{s.title}</p>
                        <p className="mt-2 text-2xl font-bold text-green-800">{s.value}</p>
                    </div>
                ))}
            </div>

            {/* FILTER */}
            <div className="flex flex-wrap gap-2">
                {[{ value: 'all', label: 'All' }, ...CENTER_TYPES].map((t) => (
                    <button
                        key={t.value}
                        onClick={() => setFilterType(t.value)}
                        className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                            filterType === t.value
                                ? 'bg-green-600 text-white'
                                : 'bg-white text-gray-600 border hover:bg-gray-50'
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* FORM */}
            {showForm && (
                <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-800">
                            {editId ? 'Edit Center' : 'Add New Center'}
                        </h3>
                        <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Basic info */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Center Name *</label>
                                <input required placeholder="e.g. Government Ayurveda Hospital" value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full rounded-lg border px-3 py-2 text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Center Type *</label>
                                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                                    className="w-full rounded-lg border px-3 py-2 text-sm">
                                    {CENTER_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                                <input required placeholder="+94XXXXXXXXX" value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    className="w-full rounded-lg border px-3 py-2 text-sm" />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                                <input required placeholder="Full address" value={form.address}
                                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                                    className="w-full rounded-lg border px-3 py-2 text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Phone</label>
                                <input placeholder="+94XXXXXXXXX" value={form.emergencyPhone}
                                    onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })}
                                    className="w-full rounded-lg border px-3 py-2 text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Operating Hours</label>
                                <input placeholder="e.g. 8:00 AM – 6:00 PM" value={form.operatingHours}
                                    onChange={(e) => setForm({ ...form, operatingHours: e.target.value })}
                                    className="w-full rounded-lg border px-3 py-2 text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude *</label>
                                <input required placeholder="e.g. 6.9271" value={form.lat}
                                    onChange={(e) => setForm({ ...form, lat: e.target.value })}
                                    className="w-full rounded-lg border px-3 py-2 text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude *</label>
                                <input required placeholder="e.g. 79.8612" value={form.lng}
                                    onChange={(e) => setForm({ ...form, lng: e.target.value })}
                                    className="w-full rounded-lg border px-3 py-2 text-sm" />
                            </div>
                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                    <input type="checkbox" checked={form.is24Hours}
                                        onChange={(e) => setForm({ ...form, is24Hours: e.target.checked })}
                                        className="rounded" />
                                    Open 24 Hours
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                    <input type="checkbox" checked={form.isActive}
                                        onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                                        className="rounded" />
                                    Active (visible in app)
                                </label>
                            </div>
                        </div>

                        {/* Emergency Types */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Emergency Types Handled
                                <span className="ml-2 text-xs font-normal text-gray-400">
                                    ({form.emergencyTypes.length} selected — matches mobile app emergency types)
                                </span>
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 rounded-xl border bg-gray-50 p-4">
                                {EMERGENCY_TYPES.map((type) => (
                                    <label key={type} className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={form.emergencyTypes.includes(type)}
                                            onChange={() => toggleEmergencyType(type)}
                                            className="rounded accent-green-600"
                                        />
                                        <span className="text-gray-700">{type}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setShowForm(false)}
                                className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                                Cancel
                            </button>
                            <button type="submit" disabled={saving}
                                className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50">
                                {saving ? 'Saving…' : editId ? 'Update Center' : 'Create Center'}
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
                            <th className="px-6 py-3">Emergency Types</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {displayed.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-10 text-center text-gray-400">
                                    <MapPin className="mx-auto mb-2 h-8 w-8" />
                                    No emergency centers found. Click &quot;Add Center&quot; to create one.
                                </td>
                            </tr>
                        )}
                        {displayed.map((c) => (
                            <tr key={c._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100">
                                            <MapPin className="h-4 w-4 text-red-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-800">{c.name}</p>
                                            <p className="text-xs text-gray-400 max-w-55 truncate">{c.address}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">{typeBadge(c.type)}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1 text-gray-600">
                                        <Phone className="h-3.5 w-3.5" /> {c.phone}
                                    </div>
                                    {c.emergencyPhone && (
                                        <p className="text-xs text-red-500 mt-0.5">🚨 {c.emergencyPhone}</p>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-gray-600">
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                                        {c.is24Hours
                                            ? <span className="text-green-600 font-medium">24h Open</span>
                                            : c.operatingHours || '—'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 max-w-50">
                                    {c.emergencyTypes?.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {c.emergencyTypes.slice(0, 3).map((t) => (
                                                <span key={t} className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] text-orange-700 border border-orange-100">
                                                    {t}
                                                </span>
                                            ))}
                                            {c.emergencyTypes.length > 3 && (
                                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
                                                    +{c.emergencyTypes.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    ) : <span className="text-gray-400 text-xs">—</span>}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1">
                                        <ShieldCheck className={`h-4 w-4 ${c.isActive ? 'text-green-500' : 'text-gray-300'}`} />
                                        <span className={`text-xs font-medium ${c.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                                            {c.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => openEdit(c)}
                                            className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition">
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => handleDelete(c._id)}
                                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition">
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
