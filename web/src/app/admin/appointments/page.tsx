'use client';

import React, { useEffect, useState } from 'react';
import { appointmentApi, channelingSessionApi } from '@/lib/api';
import { PageSkeleton } from '@/components/admin/LoadingSkeleton';
import {
    CalendarCheck, Clock, CheckCircle2, XCircle,
    RefreshCw, AlertCircle, Search, Users,
    Building2, Hash, PhoneCall, ReceiptText, X,
    AlertTriangle, ThumbsUp, ThumbsDown,
} from 'lucide-react';

/* ─── Types ─── */

interface Appointment {
    _id: string;
    appointmentId: string;
    doctorId?: { _id: string; name: string; specialization?: string };
    patientId?: { _id: string; name?: string; email?: string; phone?: string; first_name?: string; last_name?: string };
    slotTime: string;
    hospitalName?: string;
    appointmentNumber?: number;
    queuePosition?: number;
    status: string;
    paymentStatus: string;
    symptoms?: string;
    cancellationReason?: string;
    cancellationFee?: number;
    createdAt: string;
}

interface CancelResult {
    cancellationFee: number;
    refundAmount: number;
    totalAmount: number;
}

interface ChannelingSession {
    _id: string;
    doctorId?: { _id: string; name: string; specialization?: string };
    hospitalName: string;
    date: string;
    startTime: string;
    totalAppointments: number;
    bookedCount: number;
    status: string;
    note?: string;
    createdAt: string;
}

/* ─── Helpers ─── */

function patientName(pt: Appointment['patientId']) {
    if (!pt) return '—';
    const full = [pt.first_name, pt.name].filter(Boolean)[0] || '—';
    return full;
}

function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(iso: string) {
    const d = new Date(iso);
    return `${fmtDate(iso)} ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
}

/* ─── Status badge helpers ─── */

const APPT_STATUS: Record<string, string> = {
    pending:           'bg-amber-100 text-amber-700',
    confirmed:         'bg-blue-100 text-blue-700',
    completed:         'bg-green-100 text-green-700',
    cancelled:         'bg-red-100 text-red-700',
    cancel_requested:  'bg-orange-100 text-orange-700',
    rescheduled:       'bg-purple-100 text-purple-700',
    'no-show':         'bg-gray-100 text-gray-500',
};

const SESSION_STATUS: Record<string, string> = {
    open:      'bg-green-100 text-green-700',
    full:      'bg-red-100 text-red-700',
    closed:    'bg-gray-100 text-gray-500',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
};

const PAYMENT_STATUS: Record<string, string> = {
    pending:  'bg-amber-100 text-amber-700',
    paid:     'bg-green-100 text-green-700',
    refunded: 'bg-purple-100 text-purple-700',
};

function StatusBadge({ status, map }: { status: string; map: Record<string, string> }) {
    return (
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${map[status] || 'bg-gray-100 text-gray-500'}`}>
            {status}
        </span>
    );
}

const ACTIVE_STATUSES = ['pending', 'confirmed', 'rescheduled'];

/* ─── Appointments Tab ─── */

function AppointmentsTab() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading]           = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [payFilter, setPayFilter]       = useState('');
    const [search, setSearch]             = useState('');
    const [expanded, setExpanded]         = useState<string | null>(null);

    // Cancel dialog state
    const [cancelTarget, setCancelTarget]   = useState<Appointment | null>(null);
    const [cancelReason, setCancelReason]   = useState('');
    const [cancelLoading, setCancelLoading] = useState(false);
    const [cancelResult, setCancelResult]   = useState<CancelResult | null>(null);

    const fetchAppointments = () => {
        appointmentApi
            .getAll()
            .then((res) => {
                const list = Array.isArray(res) ? res : (res as { data?: Appointment[] }).data ?? [];
                setAppointments(list as Appointment[]);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchAppointments(); }, []);

    const openCancel = (e: React.MouseEvent, apt: Appointment) => {
        e.stopPropagation();
        setCancelTarget(apt);
        setCancelReason('');
        setCancelResult(null);
    };

    const closeDialog = () => {
        setCancelTarget(null);
        setCancelResult(null);
        setCancelReason('');
    };

    const handleCancel = async () => {
        if (!cancelTarget) return;
        setCancelLoading(true);
        try {
            const res = await appointmentApi.cancel(cancelTarget._id, cancelReason || undefined);
            setCancelResult({ cancellationFee: res.cancellationFee, refundAmount: res.refundAmount, totalAmount: res.totalAmount });
            fetchAppointments();
        } catch {
            /* error handled by showing nothing — backend already validated */
        } finally {
            setCancelLoading(false);
        }
    };

    const total     = appointments.length;
    const confirmed = appointments.filter((a) => a.status === 'confirmed').length;
    const completed = appointments.filter((a) => a.status === 'completed').length;
    const cancelled = appointments.filter((a) => a.status === 'cancelled').length;

    let filtered = appointments;
    if (statusFilter) filtered = filtered.filter((a) => a.status === statusFilter);
    if (payFilter)    filtered = filtered.filter((a) => a.paymentStatus === payFilter);
    if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter((a) =>
            patientName(a.patientId).toLowerCase().includes(q) ||
            a.patientId?.email?.toLowerCase().includes(q) ||
            a.doctorId?.name?.toLowerCase().includes(q) ||
            a.hospitalName?.toLowerCase().includes(q) ||
            a.appointmentId?.toLowerCase().includes(q)
        );
    }

    if (loading) return <PageSkeleton statCount={4} statGridClass="sm:grid-cols-2 lg:grid-cols-4" tableRows={8} tableCols={9} />;

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    { title: 'Total',     value: total,     icon: <CalendarCheck className="h-5 w-5 text-green-600" />,  bg: 'bg-green-100' },
                    { title: 'Confirmed', value: confirmed, icon: <CheckCircle2 className="h-5 w-5 text-blue-600" />,    bg: 'bg-blue-100' },
                    { title: 'Completed', value: completed, icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />, bg: 'bg-emerald-100' },
                    { title: 'Cancelled', value: cancelled, icon: <XCircle className="h-5 w-5 text-red-500" />,          bg: 'bg-red-100' },
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

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search patient, doctor, hospital, Appt ID…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-lg border px-4 py-2 pl-10 text-sm"
                    />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="rescheduled">Rescheduled</option>
                    <option value="no-show">No Show</option>
                </select>
                <select value={payFilter} onChange={(e) => setPayFilter(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
                    <option value="">All Payment</option>
                    <option value="pending">Payment Pending</option>
                    <option value="paid">Paid</option>
                    <option value="refunded">Refunded</option>
                </select>
                <span className="text-sm text-gray-500">{filtered.length} record(s)</span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-6 py-3">Appt ID</th>
                            <th className="px-6 py-3">Patient</th>
                            <th className="px-6 py-3">Doctor</th>
                            <th className="px-6 py-3">Hospital</th>
                            <th className="px-6 py-3">Slot Time</th>
                            <th className="px-6 py-3">No.</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Payment</th>
                            <th className="px-6 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={9} className="px-6 py-10 text-center text-gray-400">
                                    <CalendarCheck className="mx-auto mb-2 h-8 w-8" />
                                    No appointments found
                                </td>
                            </tr>
                        )}
                        {filtered.map((apt) => (
                            <React.Fragment key={apt._id}>
                                <tr
                                    className="hover:bg-gray-50 cursor-pointer"
                                    onClick={() => setExpanded(expanded === apt._id ? null : apt._id)}
                                >
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-xs text-gray-500">{apt.appointmentId || apt._id.slice(-8)}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-gray-800">{patientName(apt.patientId)}</p>
                                        <p className="text-xs text-gray-400">{apt.patientId?.email || '—'}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-gray-700">{apt.doctorId?.name || '—'}</p>
                                        <p className="text-xs text-gray-400">{apt.doctorId?.specialization}</p>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        <div className="flex items-center gap-1">
                                            <Building2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                            {apt.hospitalName || '—'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 text-xs whitespace-nowrap">
                                        {apt.slotTime ? fmtDateTime(apt.slotTime) : '—'}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {apt.appointmentNumber != null ? (
                                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                                                {apt.appointmentNumber}
                                            </span>
                                        ) : apt.queuePosition != null ? (
                                            <span className="inline-flex items-center gap-0.5 text-xs text-amber-600">
                                                <Clock className="h-3 w-3" />Q{apt.queuePosition}
                                            </span>
                                        ) : '—'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={apt.status} map={APPT_STATUS} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <StatusBadge status={apt.paymentStatus} map={PAYMENT_STATUS} />
                                            {apt.cancellationFee != null && apt.cancellationFee > 0 && (
                                                <p className="text-xs text-red-500 mt-0.5">Fee: LKR {apt.cancellationFee.toLocaleString()}</p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                        {ACTIVE_STATUSES.includes(apt.status) && (
                                            <button
                                                onClick={(e) => openCancel(e, apt)}
                                                className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition"
                                            >
                                                <PhoneCall className="h-3.5 w-3.5" />
                                                Cancel &amp; Refund
                                            </button>
                                        )}
                                    </td>
                                </tr>

                                {/* Expanded detail row */}
                                {expanded === apt._id && (
                                    <tr className="bg-green-50">
                                        <td colSpan={9} className="px-6 py-4">
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <p className="text-xs text-gray-400 mb-0.5">Patient Phone</p>
                                                    <p className="text-gray-700">{apt.patientId?.phone || '—'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400 mb-0.5">Symptoms</p>
                                                    <p className="text-gray-700">{apt.symptoms || '—'}</p>
                                                </div>
                                                {apt.cancellationReason && (
                                                    <div>
                                                        <p className="text-xs text-gray-400 mb-0.5">Cancellation Reason</p>
                                                        <p className="text-red-600">{apt.cancellationReason}</p>
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-xs text-gray-400 mb-0.5">Booked On</p>
                                                    <p className="text-gray-700">{fmtDate(apt.createdAt)}</p>
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

            {/* ── Cancel & Refund Dialog ── */}
            {cancelTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">

                        {/* Header */}
                        <div className="flex items-center justify-between border-b px-6 py-4">
                            <div className="flex items-center gap-2">
                                <PhoneCall className="h-5 w-5 text-red-600" />
                                <h2 className="font-semibold text-gray-800">Cancel Appointment</h2>
                            </div>
                            <button onClick={closeDialog} className="rounded-full p-1 hover:bg-gray-100">
                                <X className="h-4 w-4 text-gray-500" />
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-5">
                            {cancelResult ? (
                                /* ── Success state ── */
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-green-700">
                                        <CheckCircle2 className="h-5 w-5" />
                                        <span className="font-medium">Appointment cancelled successfully</span>
                                    </div>

                                    {cancelResult.totalAmount > 0 ? (
                                        <div className="rounded-xl bg-gray-50 p-4 space-y-2 text-sm">
                                            <div className="flex justify-between text-gray-600">
                                                <span>Total paid</span>
                                                <span className="font-medium">LKR {cancelResult.totalAmount.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-red-600">
                                                <span>Cancellation fee (10%)</span>
                                                <span className="font-medium">− LKR {cancelResult.cancellationFee.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between border-t pt-2 text-green-700 font-semibold">
                                                <span>Refund to patient</span>
                                                <span>LKR {cancelResult.refundAmount.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500">No payment was made — no refund required.</p>
                                    )}

                                    <button
                                        onClick={closeDialog}
                                        className="w-full rounded-xl bg-green-600 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition"
                                    >
                                        Done
                                    </button>
                                </div>
                            ) : (
                                /* ── Confirm state ── */
                                <>
                                    {/* Appointment summary */}
                                    <div className="rounded-xl bg-gray-50 p-4 space-y-1.5 text-sm">
                                        <p className="font-medium text-gray-800">{patientName(cancelTarget.patientId)}</p>
                                        <p className="text-gray-500">{cancelTarget.patientId?.email}</p>
                                        <p className="text-gray-600">{cancelTarget.doctorId?.name} · {cancelTarget.hospitalName || '—'}</p>
                                        <p className="text-gray-600">{cancelTarget.slotTime ? fmtDateTime(cancelTarget.slotTime) : '—'}</p>
                                    </div>

                                    {/* Refund notice */}
                                    <div className={`rounded-xl p-4 text-sm ${cancelTarget.paymentStatus === 'paid' ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'}`}>
                                        <div className="flex items-start gap-2">
                                            <ReceiptText className={`h-4 w-4 mt-0.5 shrink-0 ${cancelTarget.paymentStatus === 'paid' ? 'text-amber-600' : 'text-gray-400'}`} />
                                            <div>
                                                {cancelTarget.paymentStatus === 'paid' ? (
                                                    <>
                                                        <p className="font-medium text-amber-800">Payment refund with 10% fee</p>
                                                        <p className="text-amber-700 mt-0.5">A 10% cancellation fee will be deducted. The remaining 90% will be refunded to the patient.</p>
                                                    </>
                                                ) : (
                                                    <p className="text-gray-500">No payment was collected — appointment will be cancelled with no refund.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Reason */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                            Reason <span className="text-gray-400">(optional)</span>
                                        </label>
                                        <textarea
                                            value={cancelReason}
                                            onChange={(e) => setCancelReason(e.target.value)}
                                            placeholder="e.g. Patient called to cancel due to travel"
                                            rows={2}
                                            className="w-full rounded-lg border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
                                        />
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={closeDialog}
                                            className="flex-1 rounded-xl border py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={handleCancel}
                                            disabled={cancelLoading}
                                            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition disabled:opacity-50"
                                        >
                                            {cancelLoading ? 'Processing…' : 'Confirm Cancel'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─── Channeling Sessions Tab ─── */

function ChannelingSessionsTab() {
    const [sessions, setSessions]         = useState<ChannelingSession[]>([]);
    const [loading, setLoading]           = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch]             = useState('');

    useEffect(() => {
        channelingSessionApi
            .getAll()
            .then((res) => {
                const list = Array.isArray(res) ? res : (res as { data?: ChannelingSession[] }).data ?? [];
                setSessions(list as ChannelingSession[]);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const open = sessions.filter((s) => s.status === 'open').length;
    const full = sessions.filter((s) => s.status === 'full').length;

    let filtered = sessions;
    if (statusFilter) filtered = filtered.filter((s) => s.status === statusFilter);
    if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter((s) =>
            s.doctorId?.name?.toLowerCase().includes(q) ||
            s.hospitalName?.toLowerCase().includes(q)
        );
    }

    if (loading) return <PageSkeleton statCount={3} statGridClass="sm:grid-cols-3" tableRows={7} tableCols={8} />;

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3">
                {[
                    { title: 'Total Sessions', value: sessions.length, icon: <Hash className="h-5 w-5 text-green-600" />,    bg: 'bg-green-100' },
                    { title: 'Open',           value: open,            icon: <CheckCircle2 className="h-5 w-5 text-blue-600" />,  bg: 'bg-blue-100' },
                    { title: 'Full / Closed',  value: full,            icon: <AlertCircle className="h-5 w-5 text-red-500" />,    bg: 'bg-red-100' },
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

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search doctor, hospital…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-lg border px-4 py-2 pl-10 text-sm"
                    />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
                    <option value="">All Status</option>
                    <option value="open">Open</option>
                    <option value="full">Full</option>
                    <option value="closed">Closed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                </select>
                <span className="text-sm text-gray-500">{filtered.length} session(s)</span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-6 py-3">Doctor</th>
                            <th className="px-6 py-3">Hospital</th>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Start Time</th>
                            <th className="px-6 py-3">Slots</th>
                            <th className="px-6 py-3">Booked</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Note</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-6 py-10 text-center text-gray-400">
                                    <CalendarCheck className="mx-auto mb-2 h-8 w-8" />
                                    No channeling sessions found
                                </td>
                            </tr>
                        )}
                        {filtered.map((s) => {
                            const fillPct = s.totalAppointments > 0
                                ? Math.round((s.bookedCount / s.totalAppointments) * 100)
                                : 0;
                            return (
                                <tr key={s._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-gray-800">{s.doctorId?.name || '—'}</p>
                                        <p className="text-xs text-gray-400">{s.doctorId?.specialization}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1 text-gray-600">
                                            <Building2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                            {s.hospitalName}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 text-xs whitespace-nowrap">
                                        {fmtDate(s.date)}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                                            {s.startTime}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-700 font-medium">{s.totalAppointments}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-700 font-medium">{s.bookedCount}</span>
                                            <div className="w-20 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${fillPct >= 100 ? 'bg-red-500' : fillPct >= 75 ? 'bg-amber-400' : 'bg-green-500'}`}
                                                    style={{ width: `${Math.min(fillPct, 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-gray-400">{fillPct}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={s.status} map={SESSION_STATUS} />
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-500">{s.note || '—'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* ─── Cancellation Requests Tab ─── */

function CancellationRequestsTab() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading]           = useState(true);
    const [search, setSearch]             = useState('');

    // Approve state
    const [approveTarget, setApproveTarget]   = useState<Appointment | null>(null);
    const [approveLoading, setApproveLoading] = useState(false);
    const [approveResult, setApproveResult]   = useState<CancelResult | null>(null);

    // Reject state
    const [rejectTarget, setRejectTarget]   = useState<Appointment | null>(null);
    const [rejectReason, setRejectReason]   = useState('');
    const [rejectLoading, setRejectLoading] = useState(false);

    const fetchRequests = () => {
        appointmentApi
            .getAll({ status: 'cancel_requested' })
            .then((res) => {
                const list = Array.isArray(res) ? res : (res as { data?: Appointment[] }).data ?? [];
                setAppointments(list as Appointment[]);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchRequests(); }, []);

    const filtered = search
        ? appointments.filter((a) => {
            const q = search.toLowerCase();
            return (
                patientName(a.patientId).toLowerCase().includes(q) ||
                a.doctorId?.name?.toLowerCase().includes(q) ||
                a.appointmentId?.toLowerCase().includes(q)
            );
        })
        : appointments;

    const handleApprove = async () => {
        if (!approveTarget) return;
        setApproveLoading(true);
        try {
            const res = await appointmentApi.approveCancel(approveTarget._id);
            setApproveResult({
                cancellationFee: (res as { cancellationFee: number }).cancellationFee,
                refundAmount: (res as { refundAmount: number }).refundAmount,
                totalAmount: (res as { totalAmount: number }).totalAmount,
            });
            fetchRequests();
        } catch { /* silent */ }
        finally { setApproveLoading(false); }
    };

    const handleReject = async () => {
        if (!rejectTarget || !rejectReason.trim()) return;
        setRejectLoading(true);
        try {
            await appointmentApi.rejectCancel(rejectTarget._id, rejectReason.trim());
            setRejectTarget(null);
            setRejectReason('');
            fetchRequests();
        } catch { /* silent */ }
        finally { setRejectLoading(false); }
    };

    if (loading) return <PageSkeleton statCount={1} statGridClass="sm:grid-cols-1" tableRows={5} tableCols={7} />;

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="rounded-xl bg-white p-5 shadow-sm flex items-center gap-4 max-w-xs">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-100">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                    <p className="text-sm text-gray-500">Pending Requests</p>
                    <p className="text-2xl font-bold text-green-800">{appointments.length}</p>
                </div>
            </div>

            {/* Search */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search patient, doctor, Appt ID…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-lg border px-4 py-2 pl-10 text-sm"
                    />
                </div>
                <span className="text-sm text-gray-500">{filtered.length} request(s)</span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-6 py-3">Appt ID</th>
                            <th className="px-6 py-3">Patient</th>
                            <th className="px-6 py-3">Doctor</th>
                            <th className="px-6 py-3">Slot Time</th>
                            <th className="px-6 py-3">Reason</th>
                            <th className="px-6 py-3">Payment</th>
                            <th className="px-6 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-10 text-center text-gray-400">
                                    <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-green-400" />
                                    No pending cancellation requests
                                </td>
                            </tr>
                        )}
                        {filtered.map((apt) => (
                            <tr key={apt._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <span className="font-mono text-xs text-gray-500">{apt.appointmentId || apt._id.slice(-8)}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="font-medium text-gray-800">{patientName(apt.patientId)}</p>
                                    <p className="text-xs text-gray-400">{apt.patientId?.phone || apt.patientId?.email || '—'}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-gray-700">{apt.doctorId?.name || '—'}</p>
                                    <p className="text-xs text-gray-400">{apt.doctorId?.specialization}</p>
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-600 whitespace-nowrap">
                                    {apt.slotTime ? fmtDateTime(apt.slotTime) : '—'}
                                </td>
                                <td className="px-6 py-4 max-w-[200px]">
                                    <p className="text-sm text-gray-700 truncate">
                                        {(apt as unknown as { cancellation?: { reason?: string } }).cancellation?.reason || apt.cancellationReason || '—'}
                                    </p>
                                </td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={apt.paymentStatus} map={PAYMENT_STATUS} />
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => { setApproveTarget(apt); setApproveResult(null); }}
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition"
                                        >
                                            <ThumbsUp className="h-3.5 w-3.5" /> Approve
                                        </button>
                                        <button
                                            onClick={() => { setRejectTarget(apt); setRejectReason(''); }}
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition"
                                        >
                                            <ThumbsDown className="h-3.5 w-3.5" /> Reject
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ── Approve Dialog ── */}
            {approveTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b px-6 py-4">
                            <div className="flex items-center gap-2">
                                <ThumbsUp className="h-5 w-5 text-green-600" />
                                <h2 className="font-semibold text-gray-800">Approve Cancellation</h2>
                            </div>
                            <button onClick={() => setApproveTarget(null)} className="rounded-full p-1 hover:bg-gray-100">
                                <X className="h-4 w-4 text-gray-500" />
                            </button>
                        </div>
                        <div className="px-6 py-5 space-y-5">
                            {approveResult ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-green-700">
                                        <CheckCircle2 className="h-5 w-5" />
                                        <span className="font-medium">Cancellation approved</span>
                                    </div>
                                    {approveResult.totalAmount > 0 ? (
                                        <div className="rounded-xl bg-gray-50 p-4 space-y-2 text-sm">
                                            <div className="flex justify-between text-gray-600">
                                                <span>Total paid</span>
                                                <span className="font-medium">LKR {approveResult.totalAmount.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-red-600">
                                                <span>Cancellation fee (10%)</span>
                                                <span className="font-medium">− LKR {approveResult.cancellationFee.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between border-t pt-2 text-green-700 font-semibold">
                                                <span>Refund to patient</span>
                                                <span>LKR {approveResult.refundAmount.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500">No payment was made — no refund required.</p>
                                    )}
                                    <button onClick={() => setApproveTarget(null)} className="w-full rounded-xl bg-green-600 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition">
                                        Done
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="rounded-xl bg-gray-50 p-4 text-sm space-y-1">
                                        <p className="font-medium text-gray-800">{patientName(approveTarget.patientId)}</p>
                                        <p className="text-gray-500">{approveTarget.doctorId?.name} · {approveTarget.slotTime ? fmtDateTime(approveTarget.slotTime) : '—'}</p>
                                        <p className="text-orange-700 font-medium mt-1">
                                            Reason: {(approveTarget as unknown as { cancellation?: { reason?: string } }).cancellation?.reason || '—'}
                                        </p>
                                    </div>
                                    {approveTarget.paymentStatus === 'paid' && (
                                        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm">
                                            <div className="flex items-start gap-2">
                                                <ReceiptText className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" />
                                                <p className="text-amber-800">A <strong>10% cancellation fee</strong> will be deducted. 90% will be refunded to the patient.</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex gap-3">
                                        <button onClick={() => setApproveTarget(null)} className="flex-1 rounded-xl border py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                                            Back
                                        </button>
                                        <button
                                            onClick={handleApprove}
                                            disabled={approveLoading}
                                            className="flex-1 rounded-xl bg-green-600 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition disabled:opacity-50"
                                        >
                                            {approveLoading ? 'Processing…' : 'Confirm Approval'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Reject Dialog ── */}
            {rejectTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b px-6 py-4">
                            <div className="flex items-center gap-2">
                                <ThumbsDown className="h-5 w-5 text-red-600" />
                                <h2 className="font-semibold text-gray-800">Reject Cancellation</h2>
                            </div>
                            <button onClick={() => setRejectTarget(null)} className="rounded-full p-1 hover:bg-gray-100">
                                <X className="h-4 w-4 text-gray-500" />
                            </button>
                        </div>
                        <div className="px-6 py-5 space-y-4">
                            <div className="rounded-xl bg-gray-50 p-4 text-sm">
                                <p className="font-medium text-gray-800">{patientName(rejectTarget.patientId)}</p>
                                <p className="text-gray-500">{rejectTarget.doctorId?.name} · {rejectTarget.slotTime ? fmtDateTime(rejectTarget.slotTime) : '—'}</p>
                                <p className="text-orange-700 mt-1">
                                    Patient reason: {(rejectTarget as unknown as { cancellation?: { reason?: string } }).cancellation?.reason || '—'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                    Reason for rejection <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="e.g. Appointment is within 12 hours, policy does not allow cancellation"
                                    rows={3}
                                    className="w-full rounded-lg border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setRejectTarget(null)} className="flex-1 rounded-xl border py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                                    Back
                                </button>
                                <button
                                    onClick={handleReject}
                                    disabled={rejectLoading || !rejectReason.trim()}
                                    className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition disabled:opacity-50"
                                >
                                    {rejectLoading ? 'Rejecting…' : 'Confirm Rejection'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─── Page ─── */

export default function AppointmentsPage() {
    const [tab, setTab] = useState<'appointments' | 'cancellations' | 'sessions'>('appointments');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-green-800">Channeling & Appointments</h1>
                <p className="text-sm text-gray-500">Monitor doctor channeling sessions and patient appointments</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b">
                <button
                    onClick={() => setTab('appointments')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition ${
                        tab === 'appointments'
                            ? 'border-green-600 text-green-700'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Users className="h-4 w-4" /> Patient Appointments
                </button>
                <button
                    onClick={() => setTab('cancellations')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition ${
                        tab === 'cancellations'
                            ? 'border-orange-500 text-orange-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <AlertTriangle className="h-4 w-4" /> Cancellation Requests
                </button>
                <button
                    onClick={() => setTab('sessions')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition ${
                        tab === 'sessions'
                            ? 'border-green-600 text-green-700'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <RefreshCw className="h-4 w-4" /> Channeling Sessions
                </button>
            </div>

            {tab === 'appointments' ? <AppointmentsTab /> :
             tab === 'cancellations' ? <CancellationRequestsTab /> :
             <ChannelingSessionsTab />}
        </div>
    );
}
