'use client';

import React, { useEffect, useState } from 'react';
import api from '@/utils/api';
import {
  FileText,
  User,
  Calendar,
  Package,
  DollarSign,
  ExternalLink,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Search,
  Filter
} from 'lucide-react';
import { clsx } from 'clsx';

import PrescriptionReviewModal from '@/components/pharmacy/PrescriptionReviewModal';
import OrderDetailsModal from '@/components/pharmacy/OrderDetailsModal';

/**
 * Pharmacy Admin Dashboard Hub
 * One-stop-shop for pharmacists: Stats, Queue, and Fulfillment.
 */
export default function PharmacyDashboard() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ pendingPrescriptions: 0, activeOrders: 0, completedToday: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search state for orders table
  const [orderSearchTerm, setOrderSearchTerm] = useState('');

  // Modal States
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, presRes, orderRes] = await Promise.all([
        api.get('/pharmacy/stats'),
        api.get('/pharmacy/prescriptions'),
        api.get('/orders')
      ]);

      setStats(statsRes.data.data || stats);
      
      const allPres = Array.isArray(presRes.data) ? presRes.data : (presRes.data.data || []);
      setPrescriptions(allPres.filter(p => (p.pharmacyStatus || p.status) === 'pending'));

      const allOrders = Array.isArray(orderRes.data) ? orderRes.data : (orderRes.data.data || []);
      setOrders(allOrders);

    } catch (err) {
      console.error('Failed to sync pharmacy dashboard:', err);
      setError('Connection to pharmacy ledger lost. Retrying...');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenReview = (prescription) => {
    setSelectedPrescription(prescription);
    setIsReviewOpen(true);
  };

  const handleOpenOrder = (order) => {
    setSelectedOrder(order);
    setIsOrderOpen(true);
  };

  const getPaymentStatusBadge = (status) => {
    const s = (status || 'pending').toLowerCase();
    const styles = {
      pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
      paid: "bg-green-100 text-green-700 border-green-200",
      failed: "bg-red-100 text-red-700 border-red-200",
    };
    return (
      <span className={clsx("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border", styles[s])}>
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
      <span className={clsx("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border", styles[s])}>
        {s}
      </span>
    );
  };

  const filteredOrders = orders.filter(o => {
    const term = orderSearchTerm.toLowerCase();
    return o._id.toLowerCase().includes(term) || (o.patientName || o.customerName || '').toLowerCase().includes(term);
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-primary">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="font-bold italic animate-pulse">Synchronizing Dashboard Hub...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
      
      {/* Real-time Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Prescriptions Inbox', value: stats.pendingPrescriptions, icon: Clock, color: 'text-secondary', bg: 'bg-secondary/10' },
          { label: 'Active Orders', value: stats.activeOrders, icon: Package, color: 'text-primary', bg: 'bg-primary/20' },
          { label: 'Completed Today', value: stats.completedToday, icon: CheckCircle, color: 'text-accent', bg: 'bg-accent/10' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[40px] border border-secondary/10 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center">
            <div className={`${stat.bg} ${stat.color} p-4 rounded-3xl mb-4`}>
              <stat.icon size={32} />
            </div>
            <div className="text-4xl font-black text-primary mb-1">{stat.value}</div>
            <div className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Inbox / Prescription Queue Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-primary uppercase tracking-widest px-2 border-l-4 border-secondary ml-1">Incoming Prescriptions ({prescriptions.length})</h2>
          <span className="text-[10px] text-secondary font-bold uppercase tracking-widest">Awaiting Pharmacist Action</span>
        </div>

        {prescriptions.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-secondary/20 p-16 rounded-[40px] text-center space-y-4 shadow-sm">
             <p className="text-secondary/60 text-sm italic">Queue is clear! Well done.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {prescriptions.slice(0, 3).map((p) => (
              <div key={p._id} className="bg-white rounded-[40px] border border-secondary/10 overflow-hidden shadow-sm hover:shadow-xl transition-all">
                <div className="aspect-[4/3] bg-background relative overflow-hidden flex items-center justify-center">
                   {p.imageUrl ? (
                     <img src={p.imageUrl} alt="Rx" className="w-full h-full object-cover" />
                   ) : (
                     <AlertCircle className="text-secondary/20" size={48} />
                   )}
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h4 className="font-bold text-primary">{p.patientName || 'Ayurveda Patient'}</h4>
                    <p className="text-[10px] font-medium text-secondary">{new Date(p.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => handleOpenReview(p)} className="w-full py-4 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-secondary transition-all">
                    Process Request
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Orders Table Management Section */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <h2 className="text-xl font-black text-primary uppercase tracking-widest px-2 border-l-4 border-secondary ml-1">Active Order Management</h2>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/30" size={18} />
            <input
              type="text"
              placeholder="Filter ID or Patient Name..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-secondary/10 rounded-2xl outline-none focus:ring-2 focus:ring-secondary/10 transition-all font-medium text-xs"
              value={orderSearchTerm}
              onChange={(e) => setOrderSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white rounded-[40px] border border-secondary/10 shadow-sm overflow-hidden border-b-[8px] border-secondary">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background/20 border-b border-secondary/10">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-primary/40">Order Ref</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-primary/40">Patient Entity</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-primary/40 text-center">Value (LKR)</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-primary/40 text-center">Payment</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-primary/40 text-center">Lifecycle</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-primary/40 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary/5 font-medium">
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan="6" className="px-8 py-10 text-center text-primary/30 italic">No orders found in ledger.</td></tr>
                ) : (
                  filteredOrders.map((o) => (
                    <tr key={o._id} className="hover:bg-background/30 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="font-mono text-xs text-primary/60">#{o._id.slice(-8).toUpperCase()}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-sm font-black text-primary">{o.customerName || o.patientName || 'Patient'}</div>
                        <div className="text-[9px] font-bold text-secondary uppercase tracking-widest opacity-40 italic">{new Date(o.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className="text-sm font-black text-primary">
                          {Number(o.totalAmount).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        {getPaymentStatusBadge(o.paymentStatus)}
                      </td>
                      <td className="px-8 py-6 text-center">
                        {getOrderStatusBadge(o.status)}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button
                          onClick={() => handleOpenOrder(o)}
                          className="p-3 bg-background group-hover:bg-primary text-primary group-hover:text-white rounded-2xl transition-all shadow-sm border border-secondary/10"
                        >
                          <ExternalLink size={20} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Review Modal */}
      <PrescriptionReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        prescription={selectedPrescription}
        onRefresh={fetchData}
      />

      {/* Details Oversight Modal */}
      <OrderDetailsModal
        isOpen={isOrderOpen}
        onClose={() => setIsOrderOpen(false)}
        order={selectedOrder}
        onRefresh={fetchData}
      />

    </div>
  );
}
