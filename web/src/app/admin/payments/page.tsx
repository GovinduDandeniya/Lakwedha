'use client';

import { useEffect, useState } from 'react';
import { orderApi } from '@/lib/api';
import { PageSkeleton } from '@/components/admin/LoadingSkeleton';
import {
    CreditCard,
    DollarSign,
    Clock,
    CheckCircle,
    XCircle,
    Search,
    ArrowUpRight,
    ArrowDownRight,
    Receipt,
} from 'lucide-react';

interface Payment {
    _id: string;
    userId: { _id: string; name: string; email: string } | null;
    totalAmount: number;
    subtotal: number;
    deliveryFee: number;
    tax: number;
    paymentStatus: string;
    status: string;
    createdAt: string;
    medicines: { name: string; quantity: number; price: number }[];
}

export default function PaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        const params: Record<string, string> = {};
        if (filter !== 'all') params.paymentStatus = filter;

        orderApi
            .getAll(params)
            .then((res) => setPayments(res as Payment[]))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [filter]);

    /* ── Computed stats ── */
    const totalRevenue = payments
        .filter((p) => p.paymentStatus === 'paid')
        .reduce((sum, p) => sum + (p.totalAmount || 0), 0);

    const pendingAmount = payments
        .filter((p) => p.paymentStatus === 'pending')
        .reduce((sum, p) => sum + (p.totalAmount || 0), 0);

    const paidCount = payments.filter((p) => p.paymentStatus === 'paid').length;
    const failedCount = payments.filter((p) => p.paymentStatus === 'failed').length;

    /* ── Search ── */
    const filtered = payments.filter((p) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            p._id.toLowerCase().includes(q) ||
            p.userId?.name?.toLowerCase().includes(q) ||
            p.userId?.email?.toLowerCase().includes(q)
        );
    });

    const statusBadge = (status: string) => {
        const map: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
            paid: {
                bg: 'bg-green-100',
                text: 'text-green-700',
                icon: <CheckCircle className="h-3.5 w-3.5" />,
            },
            pending: {
                bg: 'bg-amber-100',
                text: 'text-amber-700',
                icon: <Clock className="h-3.5 w-3.5" />,
            },
            failed: {
                bg: 'bg-red-100',
                text: 'text-red-700',
                icon: <XCircle className="h-3.5 w-3.5" />,
            },
        };
        const s = map[status] || map.pending;
        return (
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.bg} ${s.text}`}>
                {s.icon} {status}
            </span>
        );
    };

    if (loading) return <PageSkeleton statCount={4} statGridClass="sm:grid-cols-2 lg:grid-cols-4" tableRows={7} tableCols={6} />;

    return (
        <div className="space-y-8">
            {/* HEADER */}
            <div>
                <h1 className="text-2xl font-bold text-green-800">Payments</h1>
                <p className="text-sm text-gray-500">Track all payment transactions across the platform</p>
            </div>

            {/* STAT CARDS */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">Total Revenue</p>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                            <DollarSign className="h-5 w-5 text-green-600" />
                        </div>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-green-800">
                        Rs. {totalRevenue.toLocaleString()}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
                        <ArrowUpRight className="h-3 w-3" /> From {paidCount} paid orders
                    </p>
                </div>

                <div className="rounded-xl bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">Pending Payments</p>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                            <Clock className="h-5 w-5 text-amber-600" />
                        </div>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-amber-700">
                        Rs. {pendingAmount.toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                        {payments.filter((p) => p.paymentStatus === 'pending').length} pending transaction(s)
                    </p>
                </div>

                <div className="rounded-xl bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">Successful</p>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                            <CheckCircle className="h-5 w-5 text-emerald-600" />
                        </div>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-emerald-700">{paidCount}</p>
                    <p className="mt-1 text-xs text-gray-400">Completed payments</p>
                </div>

                <div className="rounded-xl bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">Failed</p>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                            <XCircle className="h-5 w-5 text-red-600" />
                        </div>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-red-700">{failedCount}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
                        <ArrowDownRight className="h-3 w-3" /> Failed transactions
                    </p>
                </div>
            </div>

            {/* FILTERS */}
            <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        placeholder="Search by order ID, name, or email…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-lg border bg-white px-3 py-2 pl-10 text-sm"
                    />
                </div>
                <select
                    value={filter}
                    onChange={(e) => { setFilter(e.target.value); setLoading(true); }}
                    className="rounded-lg border bg-white px-3 py-2 text-sm"
                >
                    <option value="all">All Payments</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                </select>
                <span className="text-sm text-gray-500">{filtered.length} transaction(s)</span>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-6 py-3">Transaction</th>
                            <th className="px-6 py-3">Customer</th>
                            <th className="px-6 py-3">Amount</th>
                            <th className="px-6 py-3">Breakdown</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                                    <Receipt className="mx-auto mb-2 h-8 w-8" />
                                    No payment transactions found
                                </td>
                            </tr>
                        )}
                        {filtered.map((p) => (
                            <tr key={p._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100">
                                            <CreditCard className="h-4 w-4 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="font-mono text-xs text-gray-800">
                                                #TXN-{p._id.slice(-8).toUpperCase()}
                                            </p>
                                            <p className="text-[11px] text-gray-400">
                                                Order #{p._id.slice(-6).toUpperCase()}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {p.userId ? (
                                        <div>
                                            <p className="font-medium text-gray-800">{p.userId.name}</p>
                                            <p className="text-xs text-gray-400">{p.userId.email}</p>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">—</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <p className="font-semibold text-gray-800">
                                        Rs. {(p.totalAmount || 0).toLocaleString()}
                                    </p>
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-500">
                                    <p>Subtotal: Rs. {(p.subtotal || 0).toLocaleString()}</p>
                                    <p>Delivery: Rs. {(p.deliveryFee || 0).toLocaleString()}</p>
                                    <p>Tax: Rs. {(p.tax || 0).toLocaleString()}</p>
                                </td>
                                <td className="px-6 py-4">{statusBadge(p.paymentStatus)}</td>
                                <td className="px-6 py-4 text-gray-500">
                                    {new Date(p.createdAt).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })}
                                    <p className="text-[11px] text-gray-400">
                                        {new Date(p.createdAt).toLocaleTimeString('en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
