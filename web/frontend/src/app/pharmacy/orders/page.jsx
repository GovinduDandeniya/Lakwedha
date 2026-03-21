'use client';

import React, { useEffect, useState } from 'react';
import api from '@/utils/api';
import {
  Package,
  Search,
  Filter,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  DownloadCloud
} from 'lucide-react';
import { clsx } from 'clsx';
import OrderDetailsModal from '@/components/pharmacy/OrderDetailsModal';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'amount-high', 'amount-low'
  const [dateFilter, setDateFilter] = useState('all');

  // Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleOpenDetails = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleDownloadReport = () => {
    if (processedOrders.length === 0) return;

    // Create CSV header (student-level simple approach)
    const headers = ["Order ID", "Date", "Patient Name", "Amount (LKR)", "Payment Status", "Fulfillment Status"];

    // Map data to rows
    const rows = processedOrders.map(order => [
      `#${order._id.slice(-8).toUpperCase()}`,
      new Date(order.createdAt).toLocaleDateString(),
      order.customerName || order.patientName || 'Standard Patient',
      order.totalAmount,
      order.paymentStatus || 'pending',
      order.status || 'pending'
    ]);

    // Construct CSV content
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Lakwedha_Orders_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-accent/10 text-accent border-accent/20",
      approved: "bg-primary/10 text-primary border-primary/20",
      processing: "bg-secondary/10 text-secondary border-secondary/20",
      shipped: "bg-secondary/10 text-secondary border-secondary/20",
      completed: "bg-primary/10 text-primary border-primary/20",
      paid: "bg-primary/10 text-primary border-primary/20",
      cancelled: "bg-red-100 text-red-800 border-red-200",
      failed: "bg-red-100 text-red-800 border-red-200",
    };

    return (
      <span className={clsx(
        "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
        styles[status.toLowerCase()] || "bg-background/10 text-background border-background/20"
      )}>
        {status}
      </span>
    );
  };

  const processedOrders = orders
    .filter(order => {
       // Search
       const matchesSearch =
        order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.patientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customerName || '').toLowerCase().includes(searchTerm.toLowerCase());

       // Date
       let matchesDate = true;
       if (dateFilter !== 'all') {
         const itemDate = new Date(order.createdAt);
         const now = new Date();
         if (dateFilter === 'today') matchesDate = itemDate.toDateString() === now.toDateString();
         else if (dateFilter === 'week') matchesDate = itemDate >= new Date(now.setDate(now.getDate() - 7));
       }

       return matchesSearch && matchesDate;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'amount-high') return b.totalAmount - a.totalAmount;
      if (sortBy === 'amount-low') return a.totalAmount - b.totalAmount;
      return 0;
    });

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-secondary">Active Orders</h1>
          <p className="text-secondary/60">Monitor payment status and fulfillment progress.</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-2 px-6 py-2.5 bg-secondary text-white rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-lg shadow-secondary/20"
          >
            <DownloadCloud size={18} />
            Download Report
          </button>

          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-background" size={18} />
              <input
                type="text"
                placeholder="Search Order ID..."
                className="pl-10 pr-4 py-2.5 bg-white border border-background rounded-xl focus:ring-2 focus:ring-secondary/10 outline-none w-64 transition-all font-medium text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2.5 bg-white border border-background rounded-xl text-xs font-black text-secondary uppercase tracking-widest outline-none shadow-sm cursor-pointer"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2.5 bg-white border border-background rounded-xl text-xs font-black text-secondary uppercase tracking-widest outline-none shadow-sm cursor-pointer"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="amount-high">Price: High</option>
              <option value="amount-low">Price: Low</option>
            </select>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-secondary">
          <Loader2 className="animate-spin mb-4" size={48} />
          <p className="font-medium italic">Synchronizing order ledger...</p>
        </div>
      ) : processedOrders.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-background p-20 rounded-2xl text-center space-y-4">
          <div className="bg-background w-20 h-20 rounded-full flex items-center justify-center mx-auto text-background">
            <Package size={40} />
          </div>
          <h2 className="text-2xl font-semibold text-secondary">No Orders Found</h2>
          <p className="text-secondary/60 max-w-sm mx-auto">
            Try adjusting your search or wait for new prescriptions to be approved.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-background shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-background border-b border-background">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-secondary/40">Order Details</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-secondary/40">Patient</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-secondary/40 text-center">Amount</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-secondary/40 text-center">Payment</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-secondary/40 text-center">Fulfillment</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-secondary/40 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-background/40">
              {processedOrders.map((order) => (
                <tr key={order._id} className="hover:bg-background/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-mono text-xs text-secondary/60">#{order._id.slice(-8).toUpperCase()}</div>
                    <div className="text-sm font-medium text-secondary flex items-center gap-1">
                      <Clock size={12} className="text-accent" />
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-secondary">{order.customerName || order.patientName || 'Standard Patient'}</div>
                    <div className="text-xs text-secondary/40">Express Fulfillment</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-sm font-extrabold text-secondary whitespace-nowrap">
                      LKR {Number(order.totalAmount).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {getStatusBadge(order.paymentStatus || 'pending')}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {getStatusBadge(order.status || 'pending')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleOpenDetails(order)}
                      className="p-2 text-secondary/40 hover:text-secondary hover:bg-white rounded-lg border border-transparent hover:border-background transition-all shadow-sm"
                    >
                      <ExternalLink size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Management Modal */}
      <OrderDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={selectedOrder}
        onRefresh={fetchOrders}
      />
    </div>
  );
}
