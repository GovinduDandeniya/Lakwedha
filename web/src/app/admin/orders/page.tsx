'use client';

import { useEffect, useState } from 'react';
import { orderApi } from '@/lib/api';
import { PageSkeleton } from '@/components/admin/LoadingSkeleton';
import { ShoppingCart, Package, CreditCard, Clock } from 'lucide-react';

interface Order {
    _id: string;
    userId?: { name: string; email: string };
    items?: { name: string; quantity: number; price: number }[];
    totalAmount: number;
    status: string;
    paymentStatus: string;
    createdAt: string;
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [paymentFilter, setPaymentFilter] = useState('');

    useEffect(() => {
        const params: Record<string, string> = {};
        if (statusFilter) params.status = statusFilter;
        if (paymentFilter) params.paymentStatus = paymentFilter;

        orderApi
            .getAll(params)
            .then((res) => setOrders(res as Order[]))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [statusFilter, paymentFilter]);

    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const paid = orders.filter((o) => o.paymentStatus === 'paid').length;
    const pending = orders.filter((o) => o.paymentStatus === 'pending').length;

    if (loading) return <PageSkeleton statCount={4} statGridClass="sm:grid-cols-2 lg:grid-cols-4" tableRows={7} tableCols={6} />;

    const statusBadge = (status: string) => {
        const map: Record<string, string> = {
            pending: 'bg-amber-100 text-amber-700',
            processing: 'bg-blue-100 text-blue-700',
            shipped: 'bg-indigo-100 text-indigo-700',
            delivered: 'bg-green-100 text-green-700',
            cancelled: 'bg-red-100 text-red-700',
        };
        return (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] || 'bg-gray-100 text-gray-600'}`}>
                {status}
            </span>
        );
    };

    const paymentBadge = (status: string) => {
        const map: Record<string, string> = {
            paid: 'bg-green-100 text-green-700',
            pending: 'bg-amber-100 text-amber-700',
            failed: 'bg-red-100 text-red-700',
            refunded: 'bg-gray-200 text-gray-600',
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
                <h1 className="text-2xl font-bold text-green-800">Order Monitoring</h1>
                <p className="text-sm text-gray-500">Track and manage all pharmacy orders</p>
            </div>

            {/* STATS */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <ShoppingCart className="h-5 w-5 text-green-600" />
                        <p className="text-sm text-gray-500">Total Orders</p>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-green-800">{orders.length}</p>
                </div>
                <div className="rounded-xl bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-green-600" />
                        <p className="text-sm text-gray-500">Total Revenue</p>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-green-800">LKR {totalRevenue.toLocaleString()}</p>
                </div>
                <div className="rounded-xl bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <Package className="h-5 w-5 text-green-600" />
                        <p className="text-sm text-gray-500">Paid Orders</p>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-green-800">{paid}</p>
                </div>
                <div className="rounded-xl bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-amber-500" />
                        <p className="text-sm text-gray-500">Payment Pending</p>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-amber-700">{pending}</p>
                </div>
            </div>

            {/* FILTERS */}
            <div className="flex flex-wrap items-center gap-4">
                <select
                    value={statusFilter}
                    onChange={(e) => { setLoading(true); setStatusFilter(e.target.value); }}
                    className="rounded-lg border px-3 py-2 text-sm"
                >
                    <option value="">All Order Status</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                </select>
                <select
                    value={paymentFilter}
                    onChange={(e) => { setLoading(true); setPaymentFilter(e.target.value); }}
                    className="rounded-lg border px-3 py-2 text-sm"
                >
                    <option value="">All Payment Status</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                </select>
                <span className="text-sm text-gray-500">{orders.length} order(s)</span>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-6 py-3">Order ID</th>
                            <th className="px-6 py-3">Customer</th>
                            <th className="px-6 py-3">Amount</th>
                            <th className="px-6 py-3">Order Status</th>
                            <th className="px-6 py-3">Payment</th>
                            <th className="px-6 py-3">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {orders.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">No orders found</td>
                            </tr>
                        )}
                        {orders.map((order) => (
                            <tr key={order._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-mono text-xs text-gray-500">
                                    {order._id.slice(-8).toUpperCase()}
                                </td>
                                <td className="px-6 py-4">
                                    <p className="font-medium text-gray-800">{order.userId?.name || '—'}</p>
                                    <p className="text-xs text-gray-400">{order.userId?.email}</p>
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-800">
                                    LKR {(order.totalAmount || 0).toLocaleString()}
                                </td>
                                <td className="px-6 py-4">{statusBadge(order.status)}</td>
                                <td className="px-6 py-4">{paymentBadge(order.paymentStatus)}</td>
                                <td className="px-6 py-4 text-gray-500">
                                    {new Date(order.createdAt).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
