'use client';

import React, { useEffect, useState } from 'react';
import { doctorApi } from '@/lib/api';
import { PageSkeleton } from '@/components/admin/LoadingSkeleton';
import {
    CheckCircle, XCircle, Search, Stethoscope,
    Phone, MapPin, CreditCard, Building2, Clock,
    ChevronDown, ChevronUp,
} from 'lucide-react';

interface Hospital {
    name: string;
    location: string;
    startTime?: string;
    maxAppointments?: number;
}

interface BankDetails {
    bankName?: string;
    branchName?: string;
    accountNumber?: string;
    accountHolderName?: string;
    accountType?: string;
}

interface Doctor {
    _id: string;
    title?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    email: string;
    mobile?: string;
    emergencyMobile?: string;
    nic?: string;
    address?: string;
    specialization: string;
    hospitals?: Hospital[];
    bankDetails?: BankDetails;
    status: string;         // PENDING | APPROVED | DECLINED
    declineReason?: string;
    createdAt: string;
}

function displayName(d: Doctor) {
    return d.fullName || [d.title, d.firstName, d.lastName].filter(Boolean).join(' ') || d.email;
}

function initials(d: Doctor) {
    const f = d.firstName?.[0] || d.fullName?.[0] || '?';
    const l = d.lastName?.[0] || '';
    return (f + l).toUpperCase();
}

export default function DoctorsPage() {
    const [doctors, setDoctors]         = useState<Doctor[]>([]);
    const [loading, setLoading]         = useState(true);
    const [filter, setFilter]           = useState('');
    const [search, setSearch]           = useState('');
    const [expanded, setExpanded]       = useState<string | null>(null);
    const [rejectId, setRejectId]       = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchDoctors = () => {
        doctorApi
            .getAll()
            .then((res) => {
                const list = Array.isArray(res) ? res : (res as { data?: Doctor[] }).data ?? [];
                setDoctors(list as Doctor[]);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchDoctors(); }, []);

    const handleApprove = async (id: string) => {
        setActionLoading(id);
        try { await doctorApi.approve(id); fetchDoctors(); } catch { /* */ }
        setActionLoading(null);
    };

    const handleReject = async (id: string) => {
        setActionLoading(id);
        try {
            await doctorApi.reject(id);
            fetchDoctors();
        } catch { /* */ }
        setActionLoading(null);
        setRejectId(null);
        setRejectReason('');
    };

    const pending  = doctors.filter((d) => d.status === 'PENDING').length;
    const approved = doctors.filter((d) => d.status === 'APPROVED').length;
    const declined = doctors.filter((d) => d.status === 'DECLINED').length;

    let filtered = filter ? doctors.filter((d) => d.status === filter) : doctors;
    if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter((d) =>
            displayName(d).toLowerCase().includes(q) ||
            d.email.toLowerCase().includes(q) ||
            d.specialization?.toLowerCase().includes(q) ||
            d.nic?.toLowerCase().includes(q) ||
            d.mobile?.includes(q)
        );
    }

    const statusBadge = (status: string) => {
        const map: Record<string, string> = {
            APPROVED: 'bg-green-100 text-green-700',
            PENDING:  'bg-amber-100 text-amber-700',
            DECLINED: 'bg-red-100 text-red-700',
        };
        return (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] || 'bg-gray-100 text-gray-600'}`}>
                {status.charAt(0) + status.slice(1).toLowerCase()}
            </span>
        );
    };

    if (loading) return <PageSkeleton statCount={3} statGridClass="sm:grid-cols-3" tableRows={8} tableCols={6} />;

    return (
        <div className="space-y-8">
            {/* HEADER */}
            <div>
                <h1 className="text-2xl font-bold text-green-800">Doctor Management</h1>
                <p className="text-sm text-gray-500">Review registrations and manage Ayurveda doctors</p>
            </div>

            {/* STATS */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    { title: 'Total Doctors',    value: doctors.length,  color: 'bg-green-100',  icon: <Stethoscope className="h-5 w-5 text-green-600" /> },
                    { title: 'Approved',         value: approved,        color: 'bg-emerald-100', icon: <CheckCircle className="h-5 w-5 text-emerald-600" /> },
                    { title: 'Pending Approval', value: pending,         color: 'bg-amber-100',  icon: <Clock className="h-5 w-5 text-amber-600" /> },
                    { title: 'Declined',         value: declined,        color: 'bg-red-100',    icon: <XCircle className="h-5 w-5 text-red-500" /> },
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
                <div className="relative flex-1 min-w-50">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, email, specialization, NIC…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-lg border px-4 py-2 pl-10 text-sm"
                    />
                </div>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="rounded-lg border px-3 py-2 text-sm"
                >
                    <option value="">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="DECLINED">Declined</option>
                </select>
                <span className="text-sm text-gray-500">{filtered.length} doctor(s)</span>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-6 py-3">Doctor</th>
                            <th className="px-6 py-3">Specialization</th>
                            <th className="px-6 py-3">Contact</th>
                            <th className="px-6 py-3">NIC</th>
                            <th className="px-6 py-3">Hospitals</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Registered</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-6 py-10 text-center text-gray-400">
                                    <Stethoscope className="mx-auto mb-2 h-8 w-8" />
                                    No doctors found
                                </td>
                            </tr>
                        )}
                        {filtered.map((doc) => (
                            <React.Fragment key={doc._id}>
                                {/* Main row */}
                                <tr
                                    className="hover:bg-gray-50 cursor-pointer"
                                    onClick={() => setExpanded(expanded === doc._id ? null : doc._id)}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-700 text-xs font-bold text-white shrink-0">
                                                {initials(doc)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">{displayName(doc)}</p>
                                                <p className="text-xs text-gray-400">{doc.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs text-green-700 border border-green-100">
                                            {doc.specialization}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        <div className="flex items-center gap-1">
                                            <Phone className="h-3.5 w-3.5 text-gray-400" />
                                            {doc.mobile || '—'}
                                        </div>
                                        {doc.emergencyMobile && (
                                            <p className="text-xs text-red-500 mt-0.5">🚨 {doc.emergencyMobile}</p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs text-gray-600">
                                        {doc.nic || '—'}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {doc.hospitals?.length
                                            ? <span className="text-xs">{doc.hospitals.length} hospital(s)</span>
                                            : '—'}
                                    </td>
                                    <td className="px-6 py-4">{statusBadge(doc.status)}</td>
                                    <td className="px-6 py-4 text-gray-500 text-xs">
                                        {new Date(doc.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                            {doc.status === 'PENDING' && (
                                                <>
                                                    <button
                                                        onClick={() => handleApprove(doc._id)}
                                                        disabled={actionLoading === doc._id}
                                                        className="flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition disabled:opacity-50"
                                                    >
                                                        <CheckCircle className="h-3.5 w-3.5" /> Approve
                                                    </button>
                                                    <button
                                                        onClick={() => { setRejectId(doc._id); setRejectReason(''); }}
                                                        disabled={actionLoading === doc._id}
                                                        className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                                                    >
                                                        <XCircle className="h-3.5 w-3.5" /> Decline
                                                    </button>
                                                </>
                                            )}
                                            {doc.status === 'DECLINED' && (
                                                <button
                                                    onClick={() => handleApprove(doc._id)}
                                                    disabled={actionLoading === doc._id}
                                                    className="flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition disabled:opacity-50"
                                                >
                                                    <CheckCircle className="h-3.5 w-3.5" /> Re-approve
                                                </button>
                                            )}
                                            {doc.status === 'APPROVED' && (
                                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                                    <CheckCircle className="h-3.5 w-3.5 text-green-500" /> Approved
                                                </span>
                                            )}
                                            <button onClick={(e) => { e.stopPropagation(); setExpanded(expanded === doc._id ? null : doc._id); }}
                                                className="ml-1 text-gray-400 hover:text-gray-600">
                                                {expanded === doc._id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>

                                {/* Expanded detail row */}
                                {expanded === doc._id && (
                                    <tr className="bg-green-50">
                                        <td colSpan={8} className="px-6 py-5">
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

                                                {/* Personal */}
                                                <div className="space-y-2">
                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Personal Details</p>
                                                    <Detail label="Full Name"   value={displayName(doc)} />
                                                    <Detail label="Email"       value={doc.email} />
                                                    <Detail label="Mobile"      value={doc.mobile} />
                                                    <Detail label="Emergency"   value={doc.emergencyMobile} />
                                                    <Detail label="NIC"         value={doc.nic} mono />
                                                    <Detail label="Address"     value={doc.address} />
                                                    {doc.declineReason && (
                                                        <div>
                                                            <p className="text-xs text-gray-400">Decline Reason</p>
                                                            <p className="text-sm text-red-600">{doc.declineReason}</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Hospitals */}
                                                <div className="space-y-2">
                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                                                        <Building2 className="h-3.5 w-3.5" /> Hospitals / Clinics
                                                    </p>
                                                    {doc.hospitals?.length ? doc.hospitals.map((h, i) => (
                                                        <div key={i} className="rounded-lg bg-white border p-3 text-sm space-y-1">
                                                            <p className="font-medium text-gray-800">{h.name}</p>
                                                            <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="h-3 w-3" />{h.location}</p>
                                                            {h.startTime && <p className="text-xs text-gray-500 flex items-center gap-1"><Clock className="h-3 w-3" />Starts: {h.startTime}</p>}
                                                            {h.maxAppointments && <p className="text-xs text-gray-500">Max appointments: {h.maxAppointments}</p>}
                                                        </div>
                                                    )) : <p className="text-sm text-gray-400">—</p>}
                                                </div>

                                                {/* Bank Details */}
                                                <div className="space-y-2">
                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                                                        <CreditCard className="h-3.5 w-3.5" /> Bank Details
                                                    </p>
                                                    {doc.bankDetails?.bankName ? (
                                                        <div className="rounded-lg bg-white border p-3 text-sm space-y-1.5">
                                                            <Detail label="Bank"           value={doc.bankDetails.bankName} />
                                                            <Detail label="Branch"         value={doc.bankDetails.branchName} />
                                                            <Detail label="Account No."    value={doc.bankDetails.accountNumber} mono />
                                                            <Detail label="Account Holder" value={doc.bankDetails.accountHolderName} />
                                                            <Detail label="Account Type"   value={doc.bankDetails.accountType} />
                                                        </div>
                                                    ) : <p className="text-sm text-gray-400">Not provided</p>}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {/* Reject reason modal inline */}
                                {rejectId === doc._id && (
                                    <tr className="bg-red-50">
                                        <td colSpan={8} className="px-6 py-4">
                                            <div className="flex items-start gap-3">
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-red-700 mb-2">Decline reason (optional)</p>
                                                    <input
                                                        type="text"
                                                        value={rejectReason}
                                                        onChange={(e) => setRejectReason(e.target.value)}
                                                        placeholder="e.g. Incomplete qualifications, invalid NIC…"
                                                        className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-400"
                                                    />
                                                </div>
                                                <div className="flex gap-2 mt-6">
                                                    <button
                                                        onClick={() => handleReject(doc._id)}
                                                        disabled={actionLoading === doc._id}
                                                        className="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                                                    >
                                                        Confirm Decline
                                                    </button>
                                                    <button
                                                        onClick={() => setRejectId(null)}
                                                        className="rounded-lg border px-4 py-2 text-xs text-gray-600 hover:bg-gray-50"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function Detail({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
    return (
        <div>
            <p className="text-xs text-gray-400">{label}</p>
            <p className={`text-sm text-gray-700 ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
        </div>
    );
}
