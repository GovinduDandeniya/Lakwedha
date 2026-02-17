'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Trash2,
  Plus,
  CheckCircle,
  DollarSign,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import api from '../../utils/api';

export default function PrescriptionReviewModal({ prescription, isOpen, onClose, onRefresh }) {
  const [medicines, setMedicines] = useState([
    { id: Date.now(), name: '', qty: 1, unitPrice: 0 }
  ]);

  // Real-time calculation using useMemo for performance
  const calculatedMedicines = useMemo(() => {
    return medicines.map(m => ({
      ...m,
      total: Number(m.qty || 0) * Number(m.unitPrice || 0)
    }));
  }, [medicines]);

  const grandTotal = useMemo(() => {
    return calculatedMedicines.reduce((sum, m) => sum + m.total, 0);
  }, [calculatedMedicines]);

  if (!isOpen || !prescription) return null;

  const handleAddRow = () => {
    setMedicines([...medicines, { id: Date.now(), name: '', qty: 1, unitPrice: 0 }]);
  };

  const handleRemoveRow = (id) => {
    if (medicines.length > 1) {
      setMedicines(medicines.filter((m) => m.id !== id));
    }
  };

  const handleInputChange = (id, field, value) => {
    setMedicines(medicines.map(m =>
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApprove = async () => {
    try {
      setIsSubmitting(true);
      const payload = {
        status: 'approved',
        medicines: calculatedMedicines.map(m => ({
          name: m.name,
          qty: Number(m.qty),
          unitPrice: Number(m.unitPrice),
          totalPrice: m.total
        })),
        totalAmount: Number(grandTotal)
      };

      await api.put(`/pharmacy/prescriptions/${prescription._id}/review`, payload);

      onRefresh?.();
      onClose();
    } catch (error) {
      console.error('❌ Failed to approve prescription:', error);
      alert('Failed to submit approval. Check backend console.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsSubmitting(true);
      await api.put(`/pharmacy/prescriptions/${prescription._id}/review`, {
        status: 'rejected',
        medicines: [],
        totalAmount: 0
      });
      onRefresh?.();
      onClose();
    } catch (error) {
      console.error('❌ Failed to reject prescription:', error);
      alert('Failed to submit rejection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-earth/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative bg-white w-full max-w-6xl h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">

        {/* Header */}
        <header className="px-8 py-5 border-b border-clay flex justify-between items-center bg-sand">
          <div>
            <h2 className="text-2xl font-bold text-earth">Financial Review & Quotation</h2>
            <p className="text-sm text-earth/60 italic font-medium">Ayurveda Pharmacy Module</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-earth/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </header>

        {/* Content - Split View (40/60) */}
        <div className="flex-1 flex overflow-hidden">

          {/* Left Side: Prescription Image (40%) */}
          <div className="w-[40%] p-6 bg-clay/5 border-r border-clay flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-earth/40 mb-4">Source Document</span>
            <div className="flex-1 bg-white rounded-2xl border-2 border-dashed border-clay p-2 overflow-hidden relative group shadow-inner">
              {prescription.imageUrl ? (
                <img src={prescription.imageUrl} alt="Prescription" className="w-full h-full object-contain" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-clay">
                  <ImageIcon size={64} strokeWidth={1} />
                  <p className="mt-2 font-medium">No Image Provided</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Quotation Form (60%) */}
          <div className="w-[60%] p-8 overflow-y-auto flex flex-col bg-white">
            <div className="flex-1">
              <table className="w-full text-left border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-[10px] font-bold uppercase tracking-widest text-earth/40">
                    <th className="pb-2">Medicine Detail</th>
                    <th className="pb-2 w-20 text-center">Qty</th>
                    <th className="pb-2 w-32 text-center">Unit Price</th>
                    <th className="pb-2 w-32 text-right px-4">Subtotal</th>
                    <th className="pb-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {calculatedMedicines.map((item) => (
                    <tr key={item.id} className="group animate-in slide-in-from-right-2 duration-300">
                      <td>
                        <input
                          type="text"
                          placeholder="Search or enter medicine name..."
                          className="w-full px-4 py-3 bg-sand/30 border border-clay/50 rounded-xl focus:ring-2 focus:ring-turmeric/20 focus:border-turmeric outline-none transition-all placeholder:text-earth/30"
                          value={item.name}
                          onChange={(e) => handleInputChange(item.id, 'name', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="w-full px-2 py-3 bg-sand/30 border border-clay/50 rounded-xl text-center font-bold text-earth"
                          value={item.qty}
                          onChange={(e) => handleInputChange(item.id, 'qty', e.target.value)}
                        />
                      </td>
                      <td>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-earth/30">LKR</span>
                          <input
                            type="number"
                            className="w-full pl-10 pr-3 py-3 bg-sand/30 border border-clay/50 rounded-xl text-center font-bold text-earth"
                            value={item.unitPrice}
                            onChange={(e) => handleInputChange(item.id, 'unitPrice', e.target.value)}
                          />
                        </div>
                      </td>
                      <td className="text-right font-black text-earth text-sm px-4">
                        {(item.total).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <button onClick={() => handleRemoveRow(item.id)} className="p-2 text-earth/20 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button onClick={handleAddRow} className="mt-6 flex items-center gap-2 text-earth font-black text-[11px] uppercase tracking-widest hover:text-turmeric transition-colors bg-sand/50 px-4 py-2 rounded-full border border-clay/50">
                <Plus size={14} className="bg-turmeric text-white p-0.5 rounded-sm" />
                Add Row
              </button>
            </div>

            {/* Price Breakdown */}
            <div className="mt-12 space-y-4">
              <div className="flex justify-between items-center bg-earth text-white p-6 rounded-3xl shadow-xl shadow-earth/10">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-[0.3em] opacity-40">Grand Total (LKR)</p>
                  <p className="text-xs italic opacity-60">Verified Frontend Calculation</p>
                </div>
                <div className="text-4xl font-black">
                  {grandTotal.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  disabled={isSubmitting}
                  onClick={handleReject}
                  className="flex-1 py-4 text-red-600 font-black text-xs uppercase tracking-widest border-2 border-red-100 rounded-2xl hover:bg-red-50 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : 'Reject & Close'}
                </button>
                <button
                  disabled={grandTotal <= 0 || isSubmitting}
                  onClick={handleApprove}
                  className="flex-[2] py-4 bg-herbal text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-herbal/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:scale-100 disabled:grayscale cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <CheckCircle size={18} />
                  )}
                  {isSubmitting ? 'Generating Order...' : 'Approve & Create Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
