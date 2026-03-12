'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowUpRight,
  TrendingUp,
  Wallet
} from 'lucide-react';
import { clsx } from 'clsx';
import api from '@/utils/api';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        // We'll fetch orders but focus on payment data
        const res = await api.get('/orders');
        setPayments(res.data);
      } catch (err) {
        console.error('Failed to fetch payments:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const stats = [
    { label: 'Total Revenue', value: 'LKR 45,250', icon: TrendingUp, color: 'text-primary bg-primary/10' },
    { label: 'Pending Payouts', value: 'LKR 12,800', icon: Clock, color: 'text-accent bg-accent/10' },
    { label: 'Active Transactions', value: payments.length, icon: Wallet, color: 'text-secondary bg-secondary/10' },
  ];

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-secondary">Secure Vault</h1>
          <p className="text-secondary/60">Monitor financial transactions and gateway performance.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-2 bg-secondary text-white rounded-xl font-bold hover:scale-105 transition-all shadow-lg text-sm">
          <Download size={18} />
          Export Ledger
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-background shadow-sm flex items-center gap-5 hover:shadow-md transition-all">
            <div className={clsx("p-4 rounded-2xl", stat.color)}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-secondary/40">{stat.label}</p>
              <p className="text-2xl font-black text-secondary">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-3xl border border-background shadow-sm overflow-hidden">
        <div className="p-6 border-b border-background bg-background/20 flex justify-between items-center">
          <h3 className="font-bold text-secondary flex items-center gap-2">
            <CreditCard size={20} className="text-accent" />
            Recent Incoming Payments
          </h3>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-background" size={16} />
              <input
                type="text"
                placeholder="Search Txn ID..."
                className="pl-9 pr-4 py-1.5 text-xs bg-white border border-background rounded-lg outline-none w-48"
              />
            </div>
          </div>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="bg-background/40 border-b border-background">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary/40">Reference</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary/40">Amount</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary/40">Gateway Msg</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary/40 text-center">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary/40 text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-background/40">
            {payments.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-20 text-center text-secondary/40 italic">
                  No transaction records found.
                </td>
              </tr>
            ) : (
              payments.map((pay) => (
                <tr key={pay._id} className="hover:bg-background/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-secondary">#{pay.userId.slice(-6).toUpperCase()}</div>
                    <div className="text-[10px] font-mono text-secondary/40">ORD_{pay._id.slice(-6).toUpperCase()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-black text-secondary">LKR {Number(pay.totalAmount).toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs font-medium text-secondary/60">
                      <ArrowUpRight size={14} className="text-primary" />
                      {pay.paymentStatus === 'paid' ? 'Success: PayHere Gateway' : 'Awaiting confirmation'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={clsx(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                      pay.paymentStatus === 'paid' ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                    )}>
                      {pay.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-xs font-bold text-secondary">{new Date(pay.createdAt).toLocaleDateString()}</div>
                    <div className="text-[10px] text-secondary/40">{new Date(pay.createdAt).toLocaleTimeString()}</div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Gateway Status Integration Mockup */}
      <section className="bg-secondary text-white p-8 rounded-[2.5rem] shadow-2xl shadow-secondary/20 flex justify-between items-center overflow-hidden relative">
        <div className="relative z-10 space-y-4">
          <div className="bg-primary/20 border border-primary/30 px-4 py-1.5 rounded-full inline-flex items-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">Gateway Online</span>
          </div>
          <h2 className="text-3xl font-black">Ready for Payment Integration?</h2>
          <p className="max-w-md text-white/60 text-sm">
            Connect Lakwedha to **PayHere**, **DirectPay** or **Stripe** using our pre-built webhooks.
            Financial security is handled via RSA-encryption at the core.
          </p>
          <button className="px-8 py-3 bg-accent text-secondary rounded-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-xl">
             Configure Webhooks
          </button>
        </div>
        <div className="absolute -right-10 -bottom-10 opacity-10">
          <CreditCard size={320} strokeWidth={1} />
        </div>
      </section>
    </div>
  );
}
