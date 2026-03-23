'use client';

import { useEffect, useState } from 'react';
import { pharmacyRequestApi } from '@/lib/api';
import { PageSkeleton } from '@/components/admin/LoadingSkeleton';
import { ClipboardList, MapPin, Phone, Clock, DollarSign } from 'lucide-react';

interface PatientDetails {
    firstName: string;
    lastName: string;
    address: string;
    mobile: string;
}

interface Location {
    province?: string;
    district?: string;
    city?: string;
}

interface PharmacyInfo {
    pharmacyName?: string;
    city?: string;
    district?: string;
}

interface PharmacyRequest {
    _id: string;
    patientDetails: PatientDetails;
    location: Location;
    pharmacy: PharmacyInfo | null;
    status: string;
    price?: number;
    rejectionReason?: string;
    paymentStatus: string;
    createdAt: string;
}

const STATUS_STYLE: Record<string, string> = {
    pending:    'bg-amber-100 text-amber-700',
    price_sent: 'bg-blue-100 text-blue-700',
    approved:   'bg-green-100 text-green-700',
    rejected:   'bg-red-100 text-red-700',
    paid:       'bg-emerald-100 text-emerald-700',
    processing: 'bg-purple-100 text-purple-700',
    completed:  'bg-teal-100 text-teal-700',
};

const STATUS_LABEL: Record<string, string> = {
    pending:    'Pending',
    price_sent: 'Price Sent',
    approved:   'Approved',
    rejected:   'Rejected',
    paid:       'Paid',
    processing: 'Processing',
    completed:  'Completed',
};

export default function PharmacyOrdersAdminPage() {
    const [requests, setRequests] = useState<PharmacyRequest[]>([]);
    const [loading, setLoading]   = useState(true);
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        pharmacyRequestApi
            .getAll(statusFilter ? { status: statusFilter } : undefined)
            .then((data) => {
                const res = data as { data?: PharmacyRequest[] };
                setRequests(Array.isArray(data) ? (data as PharmacyRequest[]) : (res.data ?? []));
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [statusFilter]);

    const stats = {
        total:      requests.length,
        pending:    requests.filter((r) => r.status === 'pending').length,
        paid:       requests.filter((r) => ['paid', 'processing', 'completed'].includes(r.status)).length,
        rejected:   requests.filter((r) => r.status === 'rejected').length,
        revenue:    requests
            .filter((r) => r.paymentStatus === 'paid' && r.price)
            .reduce((sum, r) => sum + (r.price ?? 0), 0),
    };

    if (loading) return <PageSkeleton statCount={4} statGridClass="sm:grid-cols-4" tableRows={8} tableCols={6} />;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-green-800">Pharmacy Prescription Orders</h1>
                <p className="text-sm text-gray-500">Monitor all prescription requests and order activity</p>
            </div>

            {/* Stats */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
                {[
                    { label: 'Total Requests', value: stats.total,   icon: ClipboardList },
                    { label: 'Pending Review', value: stats.pending,  icon: Clock        },
                    { label: 'Paid / Active',  value: stats.paid,     icon: DollarSign   },
                    { label: 'Rejected',       value: stats.rejected, icon: ClipboardList },
                    { label: 'Total Revenue (LKR)', value: stats.revenue.toLocaleString(), icon: DollarSign },
                ].map((s) => (
                    <div key={s.label} className="rounded-xl bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500">{s.label}</p>
                            <s.icon className="h-5 w-5 text-green-600 opacity-60" />
                        </div>
                        <p className="mt-2 text-2xl font-bold text-green-800">{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-lg border px-3 py-2 text-sm"
                >
                    <option value="">All Statuses</option>
                    {Object.keys(STATUS_LABEL).map((s) => (
                        <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                    ))}
                </select>
                <span className="text-sm text-gray-500">{requests.length} request(s)</span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-5 py-3">Patient</th>
                            <th className="px-5 py-3">Mobile</th>
                            <th className="px-5 py-3">Location</th>
                            <th className="px-5 py-3">Pharmacy</th>
                            <th className="px-5 py-3">Price (LKR)</th>
                            <th className="px-5 py-3">Status</th>
                            <th className="px-5 py-3">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {requests.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-5 py-10 text-center text-gray-400">
                                    No prescription requests found
                                </td>
                            </tr>
                        )}
                        {requests.map((req) => {
                            const pd  = req.patientDetails;
                            const loc = req.location;
                            const ph  = req.pharmacy;
                            return (
                                <tr key={req._id} className="hover:bg-gray-50">
                                    <td className="px-5 py-4">
                                        <p className="font-semibold text-gray-800">
                                            {pd.firstName} {pd.lastName}
                                        </p>
                                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                            <MapPin className="h-3 w-3" />
                                            {pd.address || '—'}
                                        </p>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="flex items-center gap-1 text-gray-600">
                                            <Phone className="h-3.5 w-3.5" />
                                            {pd.mobile || '—'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-gray-600 text-xs">
                                        {[loc?.city, loc?.district, loc?.province].filter(Boolean).join(', ') || '—'}
                                    </td>
                                    <td className="px-5 py-4">
                                        <p className="font-medium text-gray-800">{ph?.pharmacyName || '—'}</p>
                                        <p className="text-xs text-gray-400">
                                            {[ph?.city, ph?.district].filter(Boolean).join(', ') || ''}
                                        </p>
                                    </td>
                                    <td className="px-5 py-4 font-semibold text-green-700">
                                        {req.price ? req.price.toLocaleString() : '—'}
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[req.status] || 'bg-gray-100 text-gray-600'}`}>
                                            {STATUS_LABEL[req.status] || req.status}
                                        </span>
                                        {req.rejectionReason && (
                                            <p className="mt-1 text-xs text-red-400 max-w-[160px] truncate" title={req.rejectionReason}>
                                                {req.rejectionReason}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-5 py-4 text-gray-500 text-xs">
                                        {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : '—'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
