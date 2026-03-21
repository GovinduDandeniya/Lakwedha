'use client';

import React from 'react';
import { 
  X, 
  Save, 
  Clock, 
  Package, 
  Truck, 
  CheckCircle, 
  CreditCard, 
  AlertCircle,
  User,
  History
} from 'lucide-react';
import { clsx } from 'clsx';
import api from '../../utils/api';

/**
 * Order Details Modal
 * Strictly for Pharmacist Admin use.
 * Shows Full Order Info and complete Lifecycle History.
 */
export default function OrderDetailsModal({ order, isOpen, onClose, onRefresh }) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedStatus, setSelectedStatus] = React.useState(order?.status || 'approved');
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

      // 1. Update Payment Status if changed (Manual/COD)
      if (selectedPaymentStatus !== order.paymentStatus) {
        await api.put(`/orders/${order._id}/payment`, { paymentStatus: selectedPaymentStatus });
      }

      // 2. Update Order Lifecycle Status if changed
      if (selectedStatus !== order.status) {
        await api.put(`/orders/${order._id}/status`, { 
          status: selectedStatus,
          reason: `Manual status transition by pharmacist`
        });
      }

      onRefresh?.();
      onClose();
    } catch (error) {
      console.error('Failed to sync order update:', error);
      alert('Update failed. Ensure the status transition is valid.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // PayHere Integration Logic (Step 8)
  const startPayment = async (orderId) => {
    try {
      setIsSubmitting(true);
      const response = await api.post(`/orders/${orderId}/pay/initiate`);
      const data = response.data;
      if (!data.success) throw new Error(data.message);
      
      setIsSubmitting(false);
      
      // PayHere event handlers
      payhere.onCompleted = async function(oId) {
        console.log('Payment received for ' + oId);
        try {
          const res = await api.post(`/orders/${oId}/pay/confirm`);
          if (res.data.success) {
            alert('Payment confirmed. Order moved to processing.');
            onRefresh?.();
            onClose();
          } else {
            alert(res.data.message || 'Payment confirmation failed.');
          }
        } catch (error) {
          pollOrderStatus(oId);
        }
      };

      payhere.onDismissed = function() {
        alert('Payment was cancelled.');
      };

      payhere.onError = function(error) {
        alert('Payment error: ' + error);
      };

      payhere.startPayment(data.data);
    } catch (error) {
      setIsSubmitting(false);
      alert('Could not start payment: ' + (error.message || error));
    }
  };

  const pollOrderStatus = async (orderId) => {
    let attempts = 0;
    const maxAttempts = 12;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const response = await api.get(`/orders/${orderId}`);
        if (response.data.data.paymentStatus === 'paid') {
          clearInterval(interval);
          alert('Payment confirmed via background sync.');
          onRefresh?.();
          onClose();
        }
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          alert('Verification taking longer than expected. Please refresh.');
        }
      } catch (e) {
        clearInterval(interval);
      }
    }, 5000);
  };

  const statusOptions = [
    { key: 'approved', label: 'Approved', color: 'bg-blue-500' },
    { key: 'processing', label: 'Processing', color: 'bg-orange-500' },
    { key: 'shipped', label: 'Shipped', color: 'bg-purple-500' },
    { key: 'completed', label: 'Completed', color: 'bg-green-500' },
    { key: 'cancelled', label: 'Cancelled', color: 'bg-red-500' },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 border-2 border-secondary/20">
        
        {/* Header */}
        <header className="px-10 py-8 border-b border-background flex justify-between items-center bg-background/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
               <span className="bg-secondary text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Order Receipt</span>
               <span className="text-secondary/40 font-mono text-xs">#{order._id.slice(-12).toUpperCase()}</span>
            </div>
            <h2 className="text-3xl font-black text-primary">Patient: {order.patientName || order.customerName || 'LAK Patient'}</h2>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-red-50 text-primary hover:text-red-500 rounded-2xl transition-all">
            <X size={28} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            
            {/* Left: General Info & Actions */}
            <div className="space-y-8">
              
              {/* Payment Control */}
              <section className="bg-background rounded-3xl p-6 border border-secondary/10 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                   <CreditCard className="text-secondary" />
                   <h3 className="font-bold text-primary text-sm uppercase tracking-widest">Financial Status</h3>
                </div>
                <div className="flex items-center gap-4">
                  <select
                    value={selectedPaymentStatus}
                    onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                    className="flex-1 bg-white border border-secondary/20 rounded-xl px-4 py-3 font-bold text-primary outline-none focus:ring-2 focus:ring-secondary/20"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                  </select>
                  <div className={clsx(
                    "px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest",
                    selectedPaymentStatus === 'paid' ? "bg-accent/10 text-accent" : 
                    selectedPaymentStatus === 'failed' ? "bg-red-50 text-red-500" : "bg-secondary/10 text-secondary"
                  )}>
                    {selectedPaymentStatus}
                  </div>
                </div>
                <p className="text-[10px] text-primary/40 italic">* Pharmacists should only manually mark COD orders as paid after collection.</p>
              </section>

              {/* Status Advancement */}
              <section className="bg-primary/5 rounded-3xl p-6 border border-primary/10 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                   <Package className="text-primary" />
                   <h3 className="font-bold text-primary text-sm uppercase tracking-widest">Advance Lifecycle</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {statusOptions.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setSelectedStatus(opt.key)}
                      className={clsx(
                        "py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2",
                        selectedStatus === opt.key 
                          ? `${opt.color} text-white border-transparent shadow-lg scale-105` 
                          : "bg-white text-primary/40 border-secondary/10 hover:border-primary/20"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                
                {/* PayNow Override for Pending Payment */}
                {order.paymentStatus === 'pending' && (
                   <button
                     onClick={() => startPayment(order._id)}
                     disabled={isSubmitting}
                     className="w-full py-4 bg-accent text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-accent/80 transition-all flex items-center justify-center gap-2"
                   >
                     <CreditCard size={16} />
                     Pay Now (PayHere Gateway)
                   </button>
                )}
              </section>

              {/* Items List */}
              <section className="space-y-4">
                <h3 className="font-bold text-primary text-xs uppercase tracking-[0.2em] px-2">Dispensed Medicines</h3>
                <div className="bg-white rounded-3xl border border-secondary/10 overflow-hidden divide-y divide-secondary/5">
                  {order.medicines?.map((med, i) => (
                    <div key={i} className="px-6 py-4 flex justify-between items-center group hover:bg-background/40 transition-colors">
                      <div>
                        <p className="font-bold text-primary text-sm">{med.name}</p>
                        <p className="text-[10px] font-medium text-secondary">Box of {med.quantity}</p>
                      </div>
                      <p className="font-black text-primary text-sm">LKR {Number(med.price * med.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                  <div className="px-6 py-6 bg-primary text-secondary flex justify-between items-baseline">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Total Billable</span>
                    <span className="text-2xl font-black italic">LKR {Number(order.totalAmount).toLocaleString()}</span>
                  </div>
                </div>
              </section>
            </div>

            {/* Right: History Timeline */}
            <div className="flex flex-col h-full space-y-4">
              <div className="flex items-center gap-3 px-2">
                 <History className="text-secondary" />
                 <h3 className="font-bold text-primary text-sm uppercase tracking-widest">Audit Trail & History</h3>
              </div>
              
              <div className="flex-1 bg-background/50 rounded-[40px] border border-secondary/10 p-8 space-y-8 overflow-y-auto max-h-[500px] relative">
                 {order.statusHistory?.length === 0 ? (
                   <p className="text-center text-primary/30 italic text-sm mt-10">No history records found for this order.</p>
                 ) : (
                   <div className="space-y-8 border-l-2 border-primary/10 ml-4 pb-4">
                     {order.statusHistory?.map((entry, idx) => (
                       <div key={idx} className="relative pl-8">
                         {/* Bullet */}
                         <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-primary border-4 border-white shadow-sm" />
                         
                         <div className="space-y-1">
                            <div className="flex items-center gap-2">
                               <span className="text-[11px] font-black text-primary uppercase tracking-wider">{entry.to}</span>
                               <span className="text-[9px] text-primary/40 font-bold">{new Date(entry.changedAt).toLocaleString()}</span>
                            </div>
                            <p className="text-xs text-primary/60 font-medium italic">"{entry.reason || 'Status updated by system'}"</p>
                            <div className="flex items-center gap-1.5 mt-2 opacity-40">
                               <User size={10} className="text-primary" />
                               <span className="text-[9px] font-black uppercase tracking-tighter">By: {entry.changedBy?.name || entry.changedBy || 'System/Auth'}</span>
                            </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <footer className="p-8 border-t border-background bg-white flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-4 text-primary font-bold text-xs uppercase tracking-widest rounded-2xl hover:bg-secondary/10 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={isSubmitting}
            onClick={handleUpdate}
            className="flex-[2] py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            {isSubmitting ? <Clock className="animate-spin" /> : <Save size={20} />}
            {isSubmitting ? 'Syncing Ledger...' : 'Commit Changes to Database'}
          </button>
        </footer>
      </div>
    </div>
  );
}
