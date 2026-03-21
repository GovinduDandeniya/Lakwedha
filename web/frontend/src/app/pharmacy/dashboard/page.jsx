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
  RotateCcw
} from 'lucide-react';

import PrescriptionReviewModal from '@/components/pharmacy/PrescriptionReviewModal';

/**
 * Pharmacy Admin Dashboard
 * Strictly for pharmacists to manage prescriptions and view live stats.
 */
export default function PharmacyDashboard() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [stats, setStats] = useState({ pendingPrescriptions: 0, activeOrders: 0, completedToday: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch Stats and Prescriptions in parallel
      const [statsRes, presRes] = await Promise.all([
        api.get('/pharmacy/stats'),
        api.get('/pharmacy/prescriptions')
      ]);

      setStats(statsRes.data.data || stats);
      
      const allPres = Array.isArray(presRes.data) ? presRes.data : (presRes.data.data || []);
      // Filter for pending only
      setPrescriptions(allPres.filter(p => (p.pharmacyStatus || p.status) === 'pending'));

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-primary">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="font-bold italic animate-pulse">Synchronizing Pharmacy Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <header className="flex justify-between items-end border-b border-primary/10 pb-6">
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tight">Pharmacy Hub</h1>
          <p className="text-secondary font-medium italic mt-1 uppercase text-[10px] tracking-widest">Pharmacist Admin Operations Only</p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-secondary/10 border border-secondary/20 rounded-full text-secondary text-[11px] font-black uppercase tracking-widest">
          <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
          Live Connection Established
        </div>
      </header>

      {/* Real-time Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Pending Prescriptions', value: stats.pendingPrescriptions, icon: Clock, color: 'text-secondary', bg: 'bg-secondary/10' },
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

      {/* Error Retry Alert */}
      {error && (
        <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex items-center justify-between text-red-600 font-bold mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} />
            {error}
          </div>
          <button onClick={fetchData} className="p-2 hover:bg-red-100 rounded-lg transition-colors">
            <RotateCcw size={20} />
          </button>
        </div>
      )}

      {/* Prescription Queue */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-primary uppercase tracking-widest px-2 border-l-4 border-secondary ml-1">Incoming Prescription Queue</h2>
          <span className="bg-secondary text-primary px-3 py-1 rounded-full text-[10px] font-black">{prescriptions.length} Requests</span>
        </div>

        {prescriptions.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-secondary/20 p-24 rounded-[40px] text-center space-y-4">
            <div className="bg-background w-20 h-20 rounded-full flex items-center justify-center mx-auto text-secondary/40">
              <FileText size={40} />
            </div>
            <h3 className="text-xl font-bold text-primary">Queue Clear!</h3>
            <p className="text-secondary/60 max-w-xs mx-auto text-sm italic">All incoming prescriptions have been processed. New ones will appear here automatically.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {prescriptions.map((p) => (
              <div
                key={p._id}
                className="bg-white rounded-[40px] border border-secondary/10 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col border-b-[6px] border-secondary"
              >
                {/* Image/Thumbnail area */}
                <div className="aspect-[4/3] bg-background relative overflow-hidden group">
                  {p.imageUrl ? (
                    <img 
                      src={p.imageUrl} 
                      alt="Prescription" 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-secondary/20">
                      <AlertCircle size={48} />
                      <p className="text-[10px] uppercase font-black tracking-widest mt-2">No Image Attachment</p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => handleOpenReview(p)}
                      className="bg-white text-primary p-4 rounded-full shadow-2xl hover:scale-110 transition-all font-black"
                    >
                      <ExternalLink size={24} />
                    </button>
                  </div>
                </div>

                {/* Patient Info */}
                <div className="p-8 flex flex-col flex-1">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary text-secondary rounded-[18px] flex items-center justify-center font-black text-lg">
                        {p.patientName?.charAt(0) || 'P'}
                      </div>
                      <div>
                        <h4 className="font-bold text-primary line-clamp-1">{p.patientName || 'Anonymous Patient'}</h4>
                        <div className="flex items-center gap-1.5 text-xs text-secondary/60 font-medium">
                          <Clock size={12} />
                          {new Date(p.createdAt).toLocaleDateString()} at {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Block */}
                  <div className="mt-8 flex gap-3">
                    <button 
                      onClick={() => handleOpenReview(p)}
                      className="flex-1 py-4 bg-primary text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-secondary hover:text-primary transition-all active:scale-95 shadow-lg shadow-primary/5 flex items-center justify-center gap-2"
                    >
                      Review & Process
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Review & Quotation Modal */}
      <PrescriptionReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        prescription={selectedPrescription}
        onRefresh={fetchData}
      />
    </div>
  );
}
