'use client';

import { useEffect, useState } from 'react';
import { pharmacyApi } from '@/lib/api';
import { PageSkeleton } from '@/components/admin/LoadingSkeleton';
import { CheckCircle, XCircle, Pill } from 'lucide-react';

interface Pharmacy {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    pharmacyName?: string;
    licenseNumber?: string;
    address?: string;
    status: string;
    createdAt: string;
}

export default function PharmaciesPage() {
    const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchPharmacies = () => {
        pharmacyApi
            .getAll()
            .then((res) => setPharmacies(res as Pharmacy[]))
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchPharmacies(); }, []);

    const handleApprove = async (id: string) => {
        setActionLoading(id);
        try { await pharmacyApi.approve(id); fetchPharmacies(); } catch { /* */ }
        setActionLoading(null);
    };

    const handleReject = async (id: string) => {
        setActionLoading(id);
        try { await pharmacyApi.reject(id); fetchPharmacies(); } catch { /* */ }
        setActionLoading(null);
    };

    const filtered = filter ? pharmacies.filter((p) => p.status === filter) : pharmacies;

    const pending = pharmacies.filter((p) => p.status === 'pending').length;
    const active = pharmacies.filter((p) => p.status === 'active').length;
    const rejected = pharmacies.filter((p) => p.status === 'rejected').length;

    if (loading) return <PageSkeleton statCount={3} statGridClass="sm:grid-cols-3" tableRows={7} tableCols={5} />;

    const statusBadge = (status: string) => {
        const map: Record<string, string> = {
            active: 'bg-green-100 text-green-700',
            pending: 'bg-amber-100 text-amber-700',
            rejected: 'bg-red-100 text-red-700',
            suspended: 'bg-gray-200 text-gray-600',
        };
        return (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] || 'bg-gray-100 text-gray-600'}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="space-y-8">
            {/* HEADER */}
            <div>
                <h1 className="text-2xl font-bold text-green-800">Pharmacy Management</h1>
                <p className="text-sm text-gray-500">Approve, reject, and manage registered pharmacies</p>
            </div>

            {/* STATS */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    { title: 'Total Pharmacies', value: pharmacies.length },
                    { title: 'Active', value: active },
                    { title: 'Pending Approval', value: pending },
                    { title: 'Rejected', value: rejected },
                ].map((s) => (
                    <div key={s.title} className="rounded-xl bg-white p-5 shadow-sm">
                        <p className="text-sm text-gray-500">{s.title}</p>
                        <p className="mt-2 text-2xl font-bold text-green-800">{s.value}</p>
                    </div>
                ))}
            </div>

            {/* FILTER */}
            <div className="flex flex-wrap items-center gap-4">
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="rounded-lg border px-3 py-2 text-sm"
                >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="rejected">Rejected</option>
                </select>
                <span className="text-sm text-gray-500">{filtered.length} pharmacy(s)</span>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-6 py-3">Pharmacy</th>
                            <th className="px-6 py-3">License No.</th>
                            <th className="px-6 py-3">Address</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Registered</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">No pharmacies found</td>
                            </tr>
                        )}
                        {filtered.map((ph) => (
                            <tr key={ph._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                                            <Pill className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-800">{ph.pharmacyName || ph.name}</p>
                                            <p className="text-xs text-gray-400">{ph.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-600">{ph.licenseNumber || '—'}</td>
                                <td className="px-6 py-4 text-gray-600 max-w-[200px] truncate">{ph.address || '—'}</td>
                                <td className="px-6 py-4">{statusBadge(ph.status)}</td>
                                <td className="px-6 py-4 text-gray-500">{new Date(ph.createdAt).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {ph.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleApprove(ph._id)}
                                                    disabled={actionLoading === ph._id}
                                                    className="flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition disabled:opacity-50"
                                                >
                                                    <CheckCircle className="h-3.5 w-3.5" /> Approve
                                                </button>
                                                <button
                                                    onClick={() => handleReject(ph._id)}
                                                    disabled={actionLoading === ph._id}
                                                    className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                                                >
                                                    <XCircle className="h-3.5 w-3.5" /> Reject
                                                </button>
                                            </>
                                        )}
                                        {ph.status === 'rejected' && (
                                            <button
                                                onClick={() => handleApprove(ph._id)}
                                                disabled={actionLoading === ph._id}
                                                className="flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition disabled:opacity-50"
                                            >
                                                <CheckCircle className="h-3.5 w-3.5" /> Re-approve
                                            </button>
                                        )}
                                        {ph.status === 'active' && (
                                            <span className="text-xs text-gray-400">Approved</span>
                                        )}
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
