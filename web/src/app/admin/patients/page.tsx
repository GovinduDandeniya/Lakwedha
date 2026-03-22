'use client';

import React, { useEffect, useState } from 'react';
import { patientApi } from '@/lib/api';
import { PageSkeleton } from '@/components/admin/LoadingSkeleton';
import {
    ShieldOff, ShieldCheck, Search, Users,
    Phone, Calendar, CreditCard, Globe,
} from 'lucide-react';

interface Patient {
    _id: string;
    // Legacy
    name?: string;
    // Extended registration fields (from mobile sign-up)
    title?: string;
    first_name?: string;
    last_name?: string;
    email: string;
    phone?: string;
    country_code?: string;
    nationality?: string;
    birthday?: string;
    nic_type?: string;
    nic_number?: string;
    phone_verified?: boolean;
    status: string;
    createdAt: string;
}

function displayName(p: Patient) {
    const full = [p.first_name, p.last_name].filter(Boolean).join(' ');
    const base = full || p.name || '—';
    return p.title ? `${p.title}. ${base}` : base;
}

function initials(p: Patient) {
    const f = p.first_name?.[0] || p.name?.[0] || '?';
    const l = p.last_name?.[0] || '';
    return (f + l).toUpperCase();
}

function calcAge(birthday?: string) {
    if (!birthday) return null;
    const diff = Date.now() - new Date(birthday).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

export default function PatientsPage() {
    const [patients, setPatients]       = useState<Patient[]>([]);
    const [loading, setLoading]         = useState(true);
    const [search, setSearch]           = useState('');
    const [filter, setFilter]           = useState('');
    const [expanded, setExpanded]       = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchPatients = () => {
        patientApi
            .getAll()
            .then((res) => {
                const list = Array.isArray(res) ? res : (res as { data?: Patient[] }).data ?? [];
                setPatients(list as Patient[]);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchPatients(); }, []);

    const handleSuspend = async (id: string) => {
        setActionLoading(id);
        try { await patientApi.suspend(id); fetchPatients(); } catch { /* */ }
        setActionLoading(null);
    };

    const handleActivate = async (id: string) => {
        setActionLoading(id);
        try { await patientApi.activate(id); fetchPatients(); } catch { /* */ }
        setActionLoading(null);
    };

const now = new Date();
    const thisMonth = patients.filter((p) => {
        const d = new Date(p.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    let filtered = filter ? patients.filter((p) => p.status === filter) : patients;
    if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter((p) =>
            displayName(p).toLowerCase().includes(q) ||
            p.email?.toLowerCase().includes(q) ||
            p.phone?.includes(q) ||
            p.nic_number?.toLowerCase().includes(q) ||
            p.nationality?.toLowerCase().includes(q)
        );
    }

    const statusBadge = (status: string) => {
        const map: Record<string, string> = {
            active:    'bg-green-100 text-green-700',
            suspended: 'bg-red-100 text-red-700',
            pending:   'bg-amber-100 text-amber-700',
            rejected:  'bg-gray-100 text-gray-500',
        };
        return (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${map[status] || 'bg-gray-100 text-gray-600'}`}>
                {status}
            </span>
        );
    };

    if (loading) return <PageSkeleton statCount={4} statGridClass="sm:grid-cols-2 lg:grid-cols-4" tableRows={8} tableCols={6} />;

    return (
        <div className="space-y-8">
            {/* HEADER */}
            <div>
                <h1 className="text-2xl font-bold text-green-800">Patient Management</h1>
                <p className="text-sm text-gray-500">View and manage all registered patients from the mobile app</p>
            </div>

            {/* STATS */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    { title: 'Total Patients',   value: patients.length,                                               icon: <Users className="h-5 w-5 text-green-600" />,  bg: 'bg-green-100' },
                    { title: 'Active',           value: patients.filter((p) => p.status === 'active').length,          icon: <ShieldCheck className="h-5 w-5 text-emerald-600" />, bg: 'bg-emerald-100' },
                    { title: 'Suspended',        value: patients.filter((p) => p.status === 'suspended').length,       icon: <ShieldOff className="h-5 w-5 text-red-500" />,   bg: 'bg-red-100' },
                    { title: 'New This Month',   value: thisMonth,                                                     icon: <Calendar className="h-5 w-5 text-blue-600" />,   bg: 'bg-blue-100' },
                ].map((s) => (
                    <div key={s.title} className="rounded-xl bg-white p-5 shadow-sm flex items-center gap-4">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-full ${s.bg}`}>{s.icon}</div>
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
                        placeholder="Search by name, email, phone, NIC, nationality…"
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
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                </select>
                <span className="text-sm text-gray-500">{filtered.length} patient(s)</span>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-6 py-3">Patient</th>
                            <th className="px-6 py-3">Contact</th>
                            <th className="px-6 py-3">Date of Birth</th>
                            <th className="px-6 py-3">NIC / Passport</th>
                            <th className="px-6 py-3">Nationality</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Registered</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-6 py-10 text-center text-gray-400">
                                    <Users className="mx-auto mb-2 h-8 w-8" />
                                    No patients found
                                </td>
                            </tr>
                        )}
                        {filtered.map((pt) => (
                            <React.Fragment key={pt._id}>
                                <tr
                                    className="hover:bg-gray-50 cursor-pointer"
                                    onClick={() => setExpanded(expanded === pt._id ? null : pt._id)}
                                >
                                    {/* Patient */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white shrink-0">
                                                {initials(pt)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">{displayName(pt)}</p>
                                                <p className="text-xs text-gray-400">{pt.email}</p>
                                                <div className="flex gap-1 mt-0.5">
                                                    {pt.phone_verified && (
                                                        <span className="flex items-center gap-0.5 text-[10px] text-green-600 font-medium">
                                                            <Phone className="h-3 w-3" /> Phone ✓
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Contact */}
                                    <td className="px-6 py-4 text-gray-600">
                                        {pt.phone ? (
                                            <span>{pt.phone}</span>
                                        ) : '—'}
                                    </td>

                                    {/* DOB + Age */}
                                    <td className="px-6 py-4 text-gray-600">
                                        {pt.birthday ? (
                                            <div>
                                                <p>{new Date(pt.birthday).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                                <p className="text-xs text-gray-400">{calcAge(pt.birthday)} yrs</p>
                                            </div>
                                        ) : '—'}
                                    </td>

                                    {/* NIC */}
                                    <td className="px-6 py-4">
                                        {pt.nic_number ? (
                                            <div className="flex items-center gap-1.5">
                                                <CreditCard className="h-3.5 w-3.5 text-gray-400" />
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500">{pt.nic_type || 'NIC'}</p>
                                                    <p className="font-mono text-xs text-gray-700">{pt.nic_number}</p>
                                                </div>
                                            </div>
                                        ) : '—'}
                                    </td>

                                    {/* Nationality */}
                                    <td className="px-6 py-4 text-gray-600">
                                        {pt.nationality ? (
                                            <div className="flex items-center gap-1">
                                                <Globe className="h-3.5 w-3.5 text-gray-400" />
                                                {pt.nationality}
                                            </div>
                                        ) : '—'}
                                    </td>

                                    {/* Status */}
                                    <td className="px-6 py-4">{statusBadge(pt.status)}</td>

                                    {/* Registered */}
                                    <td className="px-6 py-4 text-gray-500 text-xs">
                                        {new Date(pt.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>

                                    {/* Actions */}
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                            {pt.status !== 'suspended' && (
                                                <button
                                                    onClick={() => handleSuspend(pt._id)}
                                                    disabled={actionLoading === pt._id}
                                                    className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                                                >
                                                    <ShieldOff className="h-3.5 w-3.5" /> Suspend
                                                </button>
                                            )}
                                            {pt.status === 'suspended' && (
                                                <button
                                                    onClick={() => handleActivate(pt._id)}
                                                    disabled={actionLoading === pt._id}
                                                    className="flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition disabled:opacity-50"
                                                >
                                                    <ShieldCheck className="h-3.5 w-3.5" /> Activate
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>

                                {/* Expanded detail row */}
                                {expanded === pt._id && (
                                    <tr className="bg-green-50">
                                        <td colSpan={8} className="px-6 py-4">
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <p className="text-xs text-gray-400 mb-0.5">Full Name</p>
                                                    <p className="font-medium text-gray-700">{displayName(pt)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400 mb-0.5">Email</p>
                                                    <p className="text-gray-700">{pt.email}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400 mb-0.5">Phone</p>
                                                    <p className="text-gray-700">{pt.phone || '—'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400 mb-0.5">Nationality</p>
                                                    <p className="text-gray-700">{pt.nationality || '—'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400 mb-0.5">Date of Birth</p>
                                                    <p className="text-gray-700">
                                                        {pt.birthday ? `${new Date(pt.birthday).toLocaleDateString('en-GB')} (${calcAge(pt.birthday)} yrs)` : '—'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400 mb-0.5">{pt.nic_type || 'NIC'} Number</p>
                                                    <p className="font-mono text-gray-700">{pt.nic_number || '—'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400 mb-0.5">Phone OTP Verified</p>
                                                    <p className={pt.phone_verified ? 'text-green-600 font-medium' : 'text-gray-400'}>
                                                        {pt.phone_verified ? 'Yes' : 'No'}
                                                    </p>
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
