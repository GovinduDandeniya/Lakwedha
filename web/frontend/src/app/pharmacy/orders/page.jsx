'use client';

import React, { useEffect, useState } from 'react';
import api from '@/utils/api';
import {
  Package,
  Search,
  Filter,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  DownloadCloud
} from 'lucide-react';
import { clsx } from 'clsx';
import OrderDetailsModal from '@/components/pharmacy/OrderDetailsModal';

/**
 * Order Management Page
 * For pharmacists to track, manage, and update order statuses.
 */
export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest'); 
  
  // Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders');
      // Backend returns { data: [...] } based on our latest controller fix
      const data = response.data.data || response.data;
      setOrders(data);
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

  const getPaymentStatusBadge = (status) => {
    const s = (status || 'pending').toLowerCase();
    const styles = {
      pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
      paid: "bg-green-100 text-green-700 border-green-200",
      failed: "bg-red-100 text-red-700 border-red-200",
    };

    return (
      <span className={clsx(
        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
        styles[s] || styles.pending
      )}>
        {s}
      </span>
    );
  };

  const getOrderStatusBadge = (status) => {
    const s = (status || 'pending').toLowerCase();
    const styles = {
      pending: "bg-gray-100 text-gray-600 border-gray-200",
      approved: "bg-blue-100 text-blue-700 border-blue-200",
      processing: "bg-orange-100 text-orange-700 border-orange-200",
      shipped: "bg-purple-100 text-purple-700 border-purple-200",
      completed: "bg-green-100 text-green-700 border-green-200",
      cancelled: "bg-red-100 text-red-700 border-red-200",
      rejected: "bg-red-100 text-red-700 border-red-200",
    };

    return (
      <span className={clsx(
        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
        styles[s] || styles.pending
      )}>
        {s}
      </span>
    );
  };

  const processedOrders = orders
    .filter(order => {
       const term = searchTerm.toLowerCase();
       return (
        order._id.toLowerCase().includes(term) ||
        (order.patientName || '').toLowerCase().includes(term) ||
        (order.customerName || '').toLowerCase().includes(term)
       );
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      return 0;
    });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tight">Active Orders</h1>
          <p className="text-secondary font-medium italic mt-1 uppercase text-[10px] tracking-widest">Fulfillment Ledger & Tracking</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/30" size={18} />
            <input
              type="text"
              placeholder="Search Order ID or Patient..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-secondary/10 rounded-2xl outline-none focus:ring-2 focus:ring-secondary/10 transition-all font-medium text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-6 py-3 bg-white border border-secondary/10 rounded-2xl text-[10px] font-black text-primary uppercase tracking-widest outline-none cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-primary">
          <Loader2 className="animate-spin mb-4" size={48} />
          <p className="font-bold italic animate-pulse">Retreiving Secure Order Data...</p>
        </div>
      ) : processedOrders.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-secondary/10 p-24 rounded-[40px] text-center space-y-4 shadow-sm">
          <div className="bg-background w-20 h-20 rounded-full flex items-center justify-center mx-auto text-secondary/40">
            <Package size={40} />
          </div>
          <h2 className="text-xl font-bold text-primary">No Active Orders</h2>
          <p className="text-secondary/60 max-w-sm mx-auto text-sm italic">
            There are currently no orders matching your search criteria in the ledger.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-[40px] border border-secondary/10 shadow-sm overflow-hidden border-b-[8px] border-secondary">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background/50 border-b border-secondary/10">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-primary/40">Reference</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-primary/40">Patient Entity</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-primary/40 text-center">Value (LKR)</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-primary/40 text-center">Payment</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-primary/40 text-center">Fulfillment</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-primary/40 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary/5">
                {processedOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-background/30 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="font-mono text-xs font-bold text-primary/60 mb-1">#{order._id.slice(-8).toUpperCase()}</div>
                      <div className="text-[10px] font-black text-secondary flex items-center gap-1 uppercase tracking-tighter">
                        <Clock size={10} />
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-sm font-black text-primary">{order.customerName || order.patientName || 'Ayurveda Patient'}</div>
                      <div className="text-[9px] font-bold text-secondary uppercase tracking-widest opacity-40">Verified Pharmacy Order</div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="text-sm font-black text-primary whitespace-nowrap">
                        {Number(order.totalAmount).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      {getPaymentStatusBadge(order.paymentStatus)}
                    </td>
                    <td className="px-8 py-6 text-center">
                      {getOrderStatusBadge(order.status)}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button
                        onClick={() => handleOpenDetails(order)}
                        className="p-3 bg-background group-hover:bg-primary text-primary group-hover:text-white rounded-2xl transition-all shadow-sm border border-secondary/10"
                      >
                        <ExternalLink size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Oversight Modal */}
      <OrderDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={selectedOrder}
        onRefresh={fetchOrders}
      />
    </div>
  );
}
