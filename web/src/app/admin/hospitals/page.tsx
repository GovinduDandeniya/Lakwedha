'use client';

import React, { useEffect, useState } from 'react';
import { hospitalApi } from '@/lib/api';
import { PageSkeleton } from '@/components/admin/LoadingSkeleton';
import {
    Building2, Plus, Pencil, Trash2, Search,
    Hospital, CheckCircle, XCircle, DollarSign,
} from 'lucide-react';

interface HospitalRecord {
    _id: string;
    name: string;
    location: string;
    city: string;
    type: 'hospital' | 'clinic';
    contactNumber: string;
    adminCharge: number;
    isActive: boolean;
    createdAt: string;
}

const EMPTY_FORM = { name: '', location: '', city: '', type: 'hospital', contactNumber: '', adminCharge: '0', isActive: true };

export default function HospitalsPage() {
    const [hospitals, setHospitals] = useState<HospitalRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');

    // modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<HospitalRecord | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    // delete confirm
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchHospitals = () => {
        hospitalApi.getAll()
            .then((res) => {
                const list = Array.isArray(res) ? res : (res as { data?: HospitalRecord[] }).data ?? [];
                setHospitals(list as HospitalRecord[]);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchHospitals(); }, []);

    const openCreate = () => {
        setEditTarget(null);
        setForm(EMPTY_FORM);
        setFormError('');
        setModalOpen(true);
    };

    const openEdit = (h: HospitalRecord) => {
        setEditTarget(h);
        setForm({
            name: h.name,
            location: h.location,
            city: h.city || '',
            type: h.type,
            contactNumber: h.contactNumber || '',
            adminCharge: String(h.adminCharge),
            isActive: h.isActive,
        });
        setFormError('');
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!form.name.trim() || !form.location.trim()) {
            setFormError('Name and location are required.');
            return;
        }
        if (isNaN(Number(form.adminCharge)) || Number(form.adminCharge) < 0) {
            setFormError('Admin charge must be a valid non-negative number.');
            return;
        }
        setSaving(true);
        setFormError('');
        try {
            const payload = {
                name: form.name.trim(),
                location: form.location.trim(),
                city: form.city.trim(),
                type: form.type,
                contactNumber: form.contactNumber.trim(),
                adminCharge: Number(form.adminCharge),
                isActive: form.isActive,
            };
            if (editTarget) {
                await hospitalApi.update(editTarget._id, payload);
            } else {
                await hospitalApi.create(payload);
            }
            setModalOpen(false);
            fetchHospitals();
        } catch (err: unknown) {
            setFormError((err as Error).message || 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await hospitalApi.delete(deleteId);
            setDeleteId(null);
            fetchHospitals();
        } catch { /* */ }
        setDeleting(false);
    };

    const filtered = hospitals.filter((h) => {
        const q = search.toLowerCase();
        const matchSearch = !q || h.name.toLowerCase().includes(q) || h.location.toLowerCase().includes(q) || h.city?.toLowerCase().includes(q);
        const matchType = !typeFilter || h.type === typeFilter;
        return matchSearch && matchType;
    });

    const totalActive = hospitals.filter(h => h.isActive).length;
    const totalHospitals = hospitals.filter(h => h.type === 'hospital').length;
    const totalClinics = hospitals.filter(h => h.type === 'clinic').length;

    if (loading) return <PageSkeleton statCount={3} statGridClass="sm:grid-cols-3" tableRows={6} tableCols={5} />;

    return (
        <div className="space-y-8">
            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-green-800">Hospitals / Clinics</h1>
                    <p className="text-sm text-gray-500">Manage registered hospitals and set channeling charges</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 transition"
                >
                    <Plus className="h-4 w-4" /> Add Hospital / Clinic
                </button>
            </div>

            {/* STATS */}
            <div className="grid gap-6 sm:grid-cols-3">
                {[
                    { title: 'Active',     value: totalActive,    icon: <CheckCircle className="h-5 w-5 text-green-600" />,  color: 'bg-green-100' },
                    { title: 'Hospitals',  value: totalHospitals, icon: <Hospital className="h-5 w-5 text-blue-600" />,     color: 'bg-blue-100' },
                    { title: 'Clinics',    value: totalClinics,   icon: <Building2 className="h-5 w-5 text-purple-600" />,  color: 'bg-purple-100' },
                ].map((s) => (
                    <div key={s.title} className="rounded-xl bg-white p-5 shadow-sm flex items-center gap-4">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-full ${s.color}`}>{s.icon}</div>
                        <div>
                            <p className="text-sm text-gray-500">{s.title}</p>
                            <p className="text-2xl font-bold text-green-800">{s.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* SEARCH + FILTER */}
            <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-56">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, location, city…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-lg border px-4 py-2 pl-10 text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
                    />
                </div>
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="rounded-lg border px-3 py-2 text-sm"
                >
                    <option value="">All Types</option>
                    <option value="hospital">Hospital</option>
                    <option value="clinic">Clinic</option>
                </select>
                <span className="text-sm text-gray-500">{filtered.length} record(s)</span>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">Location</th>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3">Contact</th>
                            <th className="px-6 py-3">Hospital Fee (LKR)</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-10 text-center text-gray-400">
                                    <Building2 className="mx-auto mb-2 h-8 w-8" />
                                    No hospitals found
                                </td>
                            </tr>
                        )}
                        {filtered.map((h) => (
                            <tr key={h._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 shrink-0">
                                            <Building2 className="h-4 w-4 text-green-700" />
                                        </div>
                                        <p className="font-medium text-gray-800">{h.name}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-600">
                                    <p>{h.location}</p>
                                    {h.city && <p className="text-xs text-gray-400">{h.city}</p>}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${h.type === 'hospital' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                        {h.type.charAt(0).toUpperCase() + h.type.slice(1)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-600 text-sm">
                                    {h.contactNumber || '—'}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1 font-semibold text-green-800">
                                        <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                                        Rs. {h.adminCharge.toLocaleString()}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {h.isActive ? (
                                        <span className="flex items-center gap-1 text-xs font-medium text-green-700">
                                            <CheckCircle className="h-3.5 w-3.5" /> Active
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-xs font-medium text-gray-400">
                                            <XCircle className="h-3.5 w-3.5" /> Inactive
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => openEdit(h)}
                                            className="flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition"
                                        >
                                            <Pencil className="h-3.5 w-3.5" /> Edit
                                        </button>
                                        <button
                                            onClick={() => setDeleteId(h._id)}
                                            className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" /> Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* CREATE / EDIT MODAL */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h2 className="text-lg font-bold text-green-800 mb-5">
                            {editTarget ? 'Edit Hospital / Clinic' : 'Add Hospital / Clinic'}
                        </h2>

                        {formError && (
                            <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{formError}</p>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="e.g. Lakwedha Ayurveda Hospital"
                                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Location / Address *</label>
                                <input
                                    type="text"
                                    value={form.location}
                                    onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))}
                                    placeholder="e.g. 123 Galle Road"
                                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                                    <input
                                        type="text"
                                        value={form.city}
                                        onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))}
                                        placeholder="e.g. Colombo"
                                        className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                                    <select
                                        value={form.type}
                                        onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}
                                        className="w-full rounded-lg border px-3 py-2 text-sm"
                                    >
                                        <option value="hospital">Hospital</option>
                                        <option value="clinic">Clinic</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Contact Number</label>
                                <input
                                    type="text"
                                    value={form.contactNumber}
                                    onChange={(e) => setForm(f => ({ ...f, contactNumber: e.target.value }))}
                                    placeholder="07XXXXXXXX"
                                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Hospital Fee (LKR) — charged per channeling session
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={form.adminCharge}
                                    onChange={(e) => setForm(f => ({ ...f, adminCharge: e.target.value }))}
                                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
                                />
                                <p className="mt-1 text-xs text-gray-400">
                                    Patient pays: Doctor fee + Hospital fee + 10% channeling commission
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={form.isActive}
                                    onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))}
                                    className="h-4 w-4 rounded accent-green-600"
                                />
                                <label htmlFor="isActive" className="text-sm text-gray-600">Active (visible to doctors)</label>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setModalOpen(false)}
                                className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="rounded-lg bg-green-700 px-5 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
                            >
                                {saving ? 'Saving…' : editTarget ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRM */}
            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
                        <h2 className="text-lg font-bold text-red-700 mb-2">Delete Hospital?</h2>
                        <p className="text-sm text-gray-600 mb-6">
                            This will permanently remove the hospital from the system. Existing channeling sessions will not be affected.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteId(null)}
                                className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                            >
                                {deleting ? 'Deleting…' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
