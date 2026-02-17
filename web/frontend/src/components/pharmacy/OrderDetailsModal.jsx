'use client';

import React from 'react';
import { X, Save, Clock, Package, Truck, CheckCircle, CreditCard, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import api from '../../utils/api';

export default function OrderDetailsModal({ order, isOpen, onClose, onRefresh }) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedStatus, setSelectedStatus] = React.useState(order?.status || 'pending');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = React.useState(order?.paymentStatus || 'pending');

  React.useEffect(() => {
    if (order) {
      setSelectedStatus(order.status);
      setSelectedPaymentStatus(order.paymentStatus);
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const handleUpdate = async () => {
    try {
      setIsSubmitting(true);

      // Update Order Status
      if (selectedStatus !== order.status) {
        await api.put(`/orders/${order._id}/status`, { status: selectedStatus });
      }

      // Update Payment Status
      if (selectedPaymentStatus !== order.paymentStatus) {
        await api.put(`/orders/${order._id}/payment`, { paymentStatus: selectedPaymentStatus });
      }

      onRefresh?.();
      onClose();
    } catch (error) {
      console.error('Failed to update order:', error);
      alert('Update failed. Check console.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusSteps = [
    { key: 'pending', icon: Clock, label: 'Pending' },
    { key: 'approved', icon: CheckCircle, label: 'Approved' },
    { key: 'processing', icon: Package, label: 'Processing' },
    { key: 'shipped', icon: Truck, label: 'Shipped' },
    { key: 'completed', icon: CheckCircle, label: 'Delivered' },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-earth/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        <header className="px-8 py-6 border-b border-clay flex justify-between items-center bg-sand">
          <div>
            <h2 className="text-2xl font-bold text-earth">Order #{order._id.slice(-8).toUpperCase()}</h2>
            <p className="text-sm text-earth/60">Manage fulfillment and payments</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-earth/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </header>

        <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
          {/* Status Tracker */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-earth/40">Fulfillment Lifecycle</h3>
            <div className="flex justify-between items-start">
              {statusSteps.map((step, idx) => {
                const Icon = step.icon;
                const isActive = selectedStatus === step.key;
                const isPast = statusSteps.findIndex(s => s.key === selectedStatus) >= idx;

                return (
                  <button
                    key={step.key}
                    onClick={() => setSelectedStatus(step.key)}
                    className="flex flex-col items-center gap-2 group flex-1"
                  >
                    <div className={clsx(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all border-2",
                      isActive ? "bg-earth text-white border-earth scale-110 shadow-lg shadow-earth/20" :
                      isPast ? "bg-earth/10 text-earth border-earth/20" : "bg-sand text-clay border-clay/30"
                    )}>
                      <Icon size={18} />
                    </div>
                    <span className={clsx(
                      "text-[10px] font-bold uppercase transition-colors",
                      isActive ? "text-earth" : "text-clay group-hover:text-earth"
                    )}>
                      {step.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Payment Section */}
          <section className="bg-sand/30 p-6 rounded-2xl border border-clay/50 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-lg shadow-sm">
                  <CreditCard className="text-earth" size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-earth">Payment Status</h4>
                  <p className="text-xs text-earth/40">Select the current financial state</p>
                </div>
              </div>
              <select
                value={selectedPaymentStatus}
                onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                className="bg-white border border-clay rounded-xl px-4 py-2 text-sm font-bold text-earth outline-none focus:ring-2 focus:ring-earth/10"
              >
                <option value="pending">⏳ Pending</option>
                <option value="paid">✅ Paid</option>
                <option value="failed">❌ Failed</option>
              </select>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-clay/30">
              <span className="text-xs font-bold text-earth/60 uppercase">Payment Method</span>
              <span className="px-3 py-1 bg-white border border-clay rounded-lg text-xs font-black text-earth uppercase tracking-widest">
                {order.paymentMethod || 'Online Payment'}
              </span>
            </div>
          </section>

          {/* Order Summary */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-earth/40">Items in Order</h3>
            <div className="bg-white border border-clay rounded-2xl overflow-hidden divide-y divide-clay/30">
              {order.medicines?.map((item, i) => (
                <div key={i} className="px-5 py-3 flex justify-between items-center bg-sand/10">
                  <div>
                    <p className="text-sm font-bold text-earth">{item.name}</p>
                    <p className="text-[10px] text-earth/40">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-mono font-bold text-earth">
                    LKR {(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
              <div className="px-5 py-4 bg-earth text-white flex justify-between items-baseline">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Total Billable</span>
                <span className="text-2xl font-black">LKR {Number(order.totalAmount).toLocaleString()}</span>
              </div>
            </div>
          </section>
        </div>

        <footer className="p-6 border-t border-clay bg-sand/20 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-earth font-bold text-sm uppercase tracking-widest rounded-xl hover:bg-earth/5 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={isSubmitting}
            onClick={handleUpdate}
            className="flex-[2] py-4 bg-earth text-white font-bold text-sm uppercase tracking-widest rounded-xl shadow-xl shadow-earth/10 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Clock className="animate-spin" size={18} /> : <Save size={18} />}
            {isSubmitting ? 'Updating...' : 'Save Changes'}
          </button>
        </footer>
      </div>
    </div>
  );
}
