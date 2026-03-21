'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Trash2,
  Plus,
  CheckCircle,
  DollarSign,
  Image as ImageIcon,
  Loader2,
  AlertCircle
} from 'lucide-react';
import api from '../../utils/api';

/**
 * Prescription Review Modal
 * Strictly for Pharmacist Admin use.
 * Handles Approve (Medicines/Pricing) and Reject (Reason >= 10 chars) flows.
 */
export default function PrescriptionReviewModal({ prescription, isOpen, onClose, onRefresh }) {
  const [medicines, setMedicines] = useState([
    { id: Date.now(), name: '', qty: 1, unitPrice: 0 }
  ]);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time calculation
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

  const handleApprove = async () => {
    try {
      setIsSubmitting(true);
      const payload = {
        status: 'approved',
        medicines: calculatedMedicines.map(m => ({
          name: m.name,
          qty: Number(m.qty),
          unitPrice: Number(m.unitPrice)
        }))
      };

      await api.put(`/pharmacy/prescriptions/${prescription._id}/review`, payload);

      onRefresh?.();
      onClose();
    } catch (error) {
      console.error('Failed to approve prescription:', error);
      alert('Failed to submit approval.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (rejectionReason.length < 10) return;
    
    try {
      setIsSubmitting(true);
      await api.put(`/pharmacy/prescriptions/${prescription._id}/review`, {
        status: 'rejected',
        rejectionReason: rejectionReason
      });
      onRefresh?.();
      onClose();
    } catch (error) {
      console.error('Failed to reject prescription:', error);
      alert('Failed to submit rejection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full max-w-6xl h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <header className="px-8 py-5 border-b border-background flex justify-between items-center bg-background">
          <div>
            <h2 className="text-2xl font-bold text-primary">Prescription Review</h2>
            <p className="text-sm text-secondary italic font-medium">Verify image and assign pricing</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary/10 rounded-full transition-colors text-primary">
            <X size={24} />
          </button>
        </header>

        {/* Content View */}
        <div className="flex-1 flex overflow-hidden bg-background/30">
          
          {/* Left Side: Image (40%) */}
          <div className="w-[40%] p-6 flex flex-col">
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary/40 mb-4 px-2">Prescription Document</h3>
            <div className="flex-1 bg-white rounded-2xl border border-secondary/20 p-2 overflow-hidden shadow-inner flex items-center justify-center">
              {prescription.imageUrl ? (
                <img src={prescription.imageUrl} alt="Prescription" className="w-full h-full object-contain" />
              ) : (
                <div className="flex flex-col items-center justify-center text-primary/30">
                  <ImageIcon size={64} />
                  <p className="mt-2 font-bold uppercase text-[10px]">No Image</p>
                </div>
              )}
            </div>
            <div className="mt-4 p-4 bg-white rounded-xl border border-secondary/10">
              <p className="text-xs font-bold text-primary/40 uppercase mb-1">Patient Name</p>
              <p className="font-bold text-primary">{prescription.patientName || 'Not Provided'}</p>
            </div>
          </div>

          {/* Right Side: Form (60%) */}
          <div className="w-[60%] p-8 overflow-y-auto flex flex-col bg-white">
            {!isRejecting ? (
              <>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-primary text-lg">Quotation Details</h3>
                    <button onClick={handleAddRow} className="flex items-center gap-2 text-primary font-bold text-[11px] uppercase tracking-widest bg-secondary/10 px-4 py-2 rounded-lg border border-secondary/20 hover:bg-secondary/20 transition-all">
                      <Plus size={14} />
                      Add Medicine
                    </button>
                  </div>
                  
                  <table className="w-full text-left border-separate border-spacing-y-3">
                    <thead>
                      <tr className="text-[10px] font-bold uppercase tracking-widest text-primary/40">
                        <th className="pb-2">Medicine Name</th>
                        <th className="pb-2 w-20 text-center">Qty</th>
                        <th className="pb-2 w-32 text-center">Price</th>
                        <th className="pb-2 w-32 text-right">Subtotal</th>
                        <th className="pb-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculatedMedicines.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <input
                              type="text"
                              placeholder="Name..."
                              className="w-full px-4 py-3 bg-background rounded-xl border border-secondary/10 outline-none focus:border-secondary transition-all"
                              value={item.name}
                              onChange={(e) => handleInputChange(item.id, 'name', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="w-full py-3 bg-background rounded-xl text-center font-bold"
                              value={item.qty}
                              onChange={(e) => handleInputChange(item.id, 'qty', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="w-full py-3 bg-background rounded-xl text-center font-bold"
                              value={item.unitPrice}
                              onChange={(e) => handleInputChange(item.id, 'unitPrice', e.target.value)}
                            />
                          </td>
                          <td className="text-right font-black text-secondary">
                            {item.total.toLocaleString()}
                          </td>
                          <td className="text-center">
                            <button onClick={() => handleRemoveRow(item.id)} className="text-red-400 hover:text-red-600 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-8 pt-6 border-t border-background">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-sm font-bold text-primary/40 uppercase">Total Quotation (LKR)</span>
                    <span className="text-3xl font-black text-primary">{grandTotal.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex gap-4">
                    <button
                      onClick={() => setIsRejecting(true)}
                      className="flex-1 py-4 text-red-500 font-bold text-xs uppercase tracking-widest rounded-xl border border-red-100 hover:bg-red-50 transition-all"
                    >
                      Reject Prescription
                    </button>
                    <button
                      disabled={grandTotal <= 0 || isSubmitting}
                      onClick={handleApprove}
                      className="flex-[2] py-4 bg-primary text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 className="animate-spin" /> : <CheckCircle size={18} />}
                      {isSubmitting ? 'Approving...' : 'Approve & Create Order'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full space-y-6">
                <div className="text-center">
                  <div className="bg-red-50 text-red-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-primary">Reject Prescription</h3>
                  <p className="text-sm text-primary/60 mt-1">Please provide a valid reason for the patient.</p>
                </div>

                <textarea
                  rows={4}
                  placeholder="Reason for rejection (minimum 10 characters)..."
                  className="w-full p-4 bg-background border border-secondary/20 rounded-2xl outline-none focus:border-secondary transition-all resize-none shadow-inner"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
                
                <p className={clsx(
                  "text-[10px] font-bold uppercase transition-colors",
                  rejectionReason.length < 10 ? "text-red-400" : "text-primary/40"
                )}>
                  Characters: {rejectionReason.length} / 10
                </p>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setIsRejecting(false)}
                    className="flex-1 py-4 text-primary font-bold text-xs uppercase rounded-xl bg-background hover:bg-secondary/10 transition-all"
                  >
                    Back to Review
                  </button>
                  <button
                    disabled={rejectionReason.length < 10 || isSubmitting}
                    onClick={handleReject}
                    className="flex-1 py-4 bg-red-600 text-white font-bold text-xs uppercase rounded-xl shadow-lg disabled:opacity-50 disabled:grayscale transition-all"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function clsx(...classes) {
  return classes.filter(Boolean).join(' ');
}
