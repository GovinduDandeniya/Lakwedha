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
  AlertCircle
} from 'lucide-react';

import PrescriptionReviewModal from '@/components/pharmacy/PrescriptionReviewModal';

const DUMMY_DATA = [
  {
    _id: 'dummy_1',
    patientName: 'Test Patient (Demo)',
    createdAt: new Date().toISOString(),
    status: 'pending',
    pharmacyStatus: 'pending',
    imageUrl: 'https://placehold.co/600x400/5D4037/FFF8E1?text=Demo+Prescription+A'
  },
  {
    _id: 'dummy_2',
    patientName: 'John Doe (Demo)',
    createdAt: new Date().toISOString(),
    status: 'pending',
    pharmacyStatus: 'pending',
    imageUrl: 'https://placehold.co/600x400/2E7D32/FFF8E1?text=Demo+Prescription+B'
  }
];

export default function PharmacyDashboard() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'alpha-asc', 'alpha-desc'
  const [selectedLetter, setSelectedLetter] = useState('All');
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'week', 'month'

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/pharmacy/prescriptions');

      // DEBUG LOG: Check what the backend actually sends
      console.log('🔍 RAW API RESPONSE:', res.data);

      // Handle different response structures (Array vs Object wrapper)
      const data = Array.isArray(res.data)
        ? res.data
        : (res.data.data || res.data.prescriptions || []);

      // Filter purely for 'pending' (backend uses pharmacyStatus)
      const pendingItems = data.filter(item => (item.pharmacyStatus || item.status) === 'pending');

      console.log('✅ PROCESSED PENDING LIST:', pendingItems);
      setPrescriptions(pendingItems);
      setIsDemoMode(false);
      setError(null);
    } catch (error) {
      console.error('❌ FETCH ERROR - Switching to Demo Mode:', error);
      setPrescriptions(DUMMY_DATA);
      setIsDemoMode(true);
      setError('Backend connection failed. Displaying temporary demo data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const handleOpenReview = (prescription) => {
    setSelectedPrescription(prescription);
    setIsModalOpen(true);
  };

  // Filter and Sort Logic
  const processedPrescriptions = prescriptions
    .filter(item => {
      // 1. Search Filter (ID or Name)
      const matchesSearch =
        item._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.patientName || '').toLowerCase().includes(searchTerm.toLowerCase());

      // 2. Letter Filter
      const matchesLetter = selectedLetter === 'All' ||
        (item.patientName || '').toUpperCase().startsWith(selectedLetter);

      // 3. Date Filter
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const itemDate = new Date(item.createdAt);
        const now = new Date();
        if (dateFilter === 'today') {
           matchesDate = itemDate.toDateString() === now.toDateString();
        } else if (dateFilter === 'week') {
           const weekAgo = new Date(now.setDate(now.getDate() - 7));
           matchesDate = itemDate >= weekAgo;
        } else if (dateFilter === 'month') {
           const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
           matchesDate = itemDate >= monthAgo;
        }
      }

      return matchesSearch && matchesLetter && matchesDate;
    })
    .sort((a, b) => {
      // Sort Logic
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'alpha-asc') return (a.patientName || '').localeCompare(b.patientName || '');
      if (sortBy === 'alpha-desc') return (b.patientName || '').localeCompare(a.patientName || '');
      return 0;
    });

  if (loading) {
    return (
<<<<<<< HEAD
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-secondary">
=======
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-earth">
>>>>>>> origin/pharmacy
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="font-medium italic text-lg animate-pulse">Synchronizing Prescription Data...</p>
      </div>
    );
  }

  if (error && !isDemoMode) { // Only show full error screen if not in demo mode
    return (
      <div className="bg-red-50 border border-red-200 p-8 rounded-2xl flex flex-col items-center gap-4 text-red-800 max-w-lg mx-auto mt-20 shadow-xl">
        <AlertCircle size={48} className="text-red-500" />
        <div className="text-center">
          <h3 className="font-bold text-xl mb-2">Fetch Error</h3>
          <p className="text-red-700/80">{error}</p>
        </div>
        <button
          onClick={fetchPrescriptions}
          className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  const letters = ['All', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

  return (
    <div className="space-y-6 relative">
      {/* Demo Mode Badge */}
      {isDemoMode && (
<<<<<<< HEAD
        <div className="absolute -top-4 -right-4 bg-accent text-secondary px-4 py-1 rounded-bl-xl font-bold text-xs shadow-lg animate-pulse z-10 flex items-center gap-2">
=======
        <div className="absolute -top-4 -right-4 bg-turmeric text-earth px-4 py-1 rounded-bl-xl font-bold text-xs shadow-lg animate-pulse z-10 flex items-center gap-2">
>>>>>>> origin/pharmacy
          <AlertCircle size={14} />
          ⚠️ DEMO MODE ACTIVE
        </div>
      )}

      <header className="flex justify-between items-end">
        <div>
<<<<<<< HEAD
          <h1 className="text-3xl font-bold text-secondary">Pharmacy Dashboard</h1>
          <p className="text-secondary/60">Manage your dispensary and patient requests.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-bold border border-primary/20 flex items-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
=======
          <h1 className="text-3xl font-bold text-earth">Pharmacy Dashboard</h1>
          <p className="text-earth/60">Manage your dispensary and patient requests.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-herbal/10 text-herbal px-4 py-2 rounded-full text-sm font-bold border border-herbal/20 flex items-center gap-2">
            <span className="w-2 h-2 bg-herbal rounded-full animate-pulse" />
>>>>>>> origin/pharmacy
            Live System
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
<<<<<<< HEAD
          { label: 'Inbox', value: prescriptions.length, icon: FileText, color: 'text-accent', bg: 'bg-accent/10' },
          { label: 'Active Orders', value: '12', icon: Package, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Daily Revenue', value: 'LKR 42K', icon: DollarSign, color: 'text-secondary', bg: 'bg-secondary/10' },
          { label: 'Alerts', value: '2', icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[32px] border border-background shadow-sm hover:shadow-md transition-all">
=======
          { label: 'Inbox', value: prescriptions.length, icon: FileText, color: 'text-turmeric', bg: 'bg-turmeric/10' },
          { label: 'Active Orders', value: '12', icon: Package, color: 'text-herbal', bg: 'bg-herbal/10' },
          { label: 'Daily Revenue', value: 'LKR 42K', icon: DollarSign, color: 'text-earth', bg: 'bg-earth/10' },
          { label: 'Alerts', value: '2', icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[32px] border border-clay shadow-sm hover:shadow-md transition-all">
>>>>>>> origin/pharmacy
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl`}>
                <stat.icon size={24} />
              </div>
<<<<<<< HEAD
              <span className="text-[10px] font-black text-secondary/20 uppercase tracking-widest">MTD</span>
            </div>
            <div className="text-2xl font-black text-secondary">{stat.value}</div>
            <div className="text-xs font-bold text-secondary/40 uppercase tracking-tighter mt-1">{stat.label}</div>
=======
              <span className="text-[10px] font-black text-earth/20 uppercase tracking-widest">MTD</span>
            </div>
            <div className="text-2xl font-black text-earth">{stat.value}</div>
            <div className="text-xs font-bold text-earth/40 uppercase tracking-tighter mt-1">{stat.label}</div>
>>>>>>> origin/pharmacy
          </div>
        ))}
      </div>

      {/* Advanced Filter Bar */}
<<<<<<< HEAD
      <div className="bg-white p-6 rounded-[32px] border border-background shadow-sm space-y-6">
=======
      <div className="bg-white p-6 rounded-[32px] border border-clay shadow-sm space-y-6">
>>>>>>> origin/pharmacy
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Search patient name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
<<<<<<< HEAD
              className="w-full pl-12 pr-4 py-3 bg-background rounded-2xl border border-background/50 outline-none focus:ring-2 focus:ring-secondary/10 transition-all font-medium"
            />
            <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/30" size={20} />
=======
              className="w-full pl-12 pr-4 py-3 bg-sand rounded-2xl border border-clay/50 outline-none focus:ring-2 focus:ring-earth/10 transition-all font-medium"
            />
            <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-earth/30" size={20} />
>>>>>>> origin/pharmacy
          </div>

          <div className="flex gap-4 w-full md:w-auto">
             <select
               value={dateFilter}
               onChange={(e) => setDateFilter(e.target.value)}
<<<<<<< HEAD
               className="bg-background px-4 py-3 rounded-2xl border border-background/50 font-bold text-secondary text-sm outline-none"
=======
               className="bg-sand px-4 py-3 rounded-2xl border border-clay/50 font-bold text-earth text-sm outline-none"
>>>>>>> origin/pharmacy
             >
                <option value="all">📅 All Dates</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
             </select>

             <select
               value={sortBy}
               onChange={(e) => setSortBy(e.target.value)}
<<<<<<< HEAD
               className="bg-background px-4 py-3 rounded-2xl border border-background/50 font-bold text-secondary text-sm outline-none"
=======
               className="bg-sand px-4 py-3 rounded-2xl border border-clay/50 font-bold text-earth text-sm outline-none"
>>>>>>> origin/pharmacy
             >
                <option value="newest">🕒 Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="alpha-asc">A-Z</option>
                <option value="alpha-desc">Z-A</option>
             </select>
          </div>
        </div>

        {/* Letter Filtering */}
        <div className="flex flex-wrap gap-2 pt-2">
           {letters.map(letter => (
             <button
               key={letter}
               onClick={() => setSelectedLetter(letter)}
               className={clsx(
                 "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all border",
                 selectedLetter === letter
<<<<<<< HEAD
                  ? "bg-secondary text-white border-secondary shadow-lg shadow-secondary/20"
                  : "bg-background text-secondary/60 border-background/30 hover:bg-secondary/5 hover:text-secondary"
=======
                  ? "bg-earth text-white border-earth shadow-lg shadow-earth/20"
                  : "bg-sand text-earth/60 border-clay/30 hover:bg-earth/5 hover:text-earth"
>>>>>>> origin/pharmacy
               )}
             >
               {letter}
             </button>
           ))}
        </div>
      </div>

      <div className="pt-4 flex items-center gap-4">
<<<<<<< HEAD
         <h2 className="text-xl font-bold text-secondary">Incoming Requests ({processedPrescriptions.length})</h2>
         <div className="h-px flex-1 bg-background/30" />
      </div>

      {processedPrescriptions.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-background p-20 rounded-3xl text-center space-y-6 shadow-sm">
          <div className="bg-background w-24 h-24 rounded-full flex items-center justify-center mx-auto text-background">
            <AlertCircle size={48} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-secondary">No Results Found.</h2>
            <p className="text-secondary/60 max-w-sm mx-auto text-lg italic">
=======
         <h2 className="text-xl font-bold text-earth">Incoming Requests ({processedPrescriptions.length})</h2>
         <div className="h-px flex-1 bg-clay/30" />
      </div>

      {processedPrescriptions.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-clay p-20 rounded-3xl text-center space-y-6 shadow-sm">
          <div className="bg-sand w-24 h-24 rounded-full flex items-center justify-center mx-auto text-clay">
            <AlertCircle size={48} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-earth">No Results Found.</h2>
            <p className="text-earth/60 max-w-sm mx-auto text-lg italic">
>>>>>>> origin/pharmacy
              Try adjusting your filters or clearing your search term.
            </p>
          </div>
          <button
            onClick={() => { setSearchTerm(''); setSelectedLetter('All'); setDateFilter('all'); }}
<<<<<<< HEAD
            className="px-8 py-3 bg-secondary text-white rounded-xl font-bold transition-all shadow-lg mx-auto"
=======
            className="px-8 py-3 bg-earth text-white rounded-xl font-bold transition-all shadow-lg mx-auto"
>>>>>>> origin/pharmacy
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {processedPrescriptions.map((prescription) => (
            <div
              key={prescription._id}
<<<<<<< HEAD
              className="bg-white rounded-3xl border border-background shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group border-b-4 border-b-accent/20"
            >
              {/* Card Header */}
              <div className="bg-accent/10 p-4 border-b border-background flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="bg-secondary text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">
                    {prescription.patientName?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <h3 className="font-bold text-secondary leading-tight">
                      {prescription.patientName || 'Anonymous Patient'}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-secondary/60">
=======
              className="bg-white rounded-3xl border border-clay shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group border-b-4 border-b-turmeric/20"
            >
              {/* Card Header */}
              <div className="bg-turmeric/10 p-4 border-b border-clay flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="bg-earth text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">
                    {prescription.patientName?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <h3 className="font-bold text-earth leading-tight">
                      {prescription.patientName || 'Anonymous Patient'}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-earth/60">
>>>>>>> origin/pharmacy
                      <Calendar size={12} />
                      {new Date(prescription.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
<<<<<<< HEAD
                <span className="bg-primary/10 text-primary px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider">
=======
                <span className="bg-herbal/10 text-herbal px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider">
>>>>>>> origin/pharmacy
                  New
                </span>
              </div>

              {/* Card Body - Image Placeholder */}
<<<<<<< HEAD
              <div className="aspect-video bg-background relative overflow-hidden">
=======
              <div className="aspect-video bg-sand relative overflow-hidden">
>>>>>>> origin/pharmacy
                {prescription.imageUrl ? (
                  <img
                    src={prescription.imageUrl}
                    alt="Prescription"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
<<<<<<< HEAD
                  <div className="w-full h-full flex flex-col items-center justify-center text-background p-4">
=======
                  <div className="w-full h-full flex flex-col items-center justify-center text-clay p-4">
>>>>>>> origin/pharmacy
                    <FileText size={48} strokeWidth={1} />
                    <span className="text-xs mt-2 uppercase tracking-widest font-bold">Image Missing</span>
                  </div>
                )}
<<<<<<< HEAD
                <div className="absolute inset-0 bg-secondary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => handleOpenReview(prescription)}
                    className="bg-white text-secondary p-3 rounded-full shadow-lg hover:scale-110 transition-transform"
=======
                <div className="absolute inset-0 bg-earth/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => handleOpenReview(prescription)}
                    className="bg-white text-earth p-3 rounded-full shadow-lg hover:scale-110 transition-transform"
>>>>>>> origin/pharmacy
                  >
                    <ExternalLink size={24} />
                  </button>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 bg-white mt-auto">
                <button
                  onClick={() => handleOpenReview(prescription)}
<<<<<<< HEAD
                  className="w-full py-2.5 bg-secondary text-white rounded-lg font-bold hover:bg-secondary/95 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
=======
                  className="w-full py-2.5 bg-earth text-white rounded-lg font-bold hover:bg-earth/95 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
>>>>>>> origin/pharmacy
                >
                  Review & Process
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Calculator Modal */}
      <PrescriptionReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        prescription={selectedPrescription}
        onRefresh={fetchPrescriptions}
      />
    </div>
  );
}

function clsx(...classes) {
  return classes.filter(Boolean).join(' ');
}
