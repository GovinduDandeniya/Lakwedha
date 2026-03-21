'use client';

import React, { useState, useEffect } from 'react';
import StatCard from "@/components/admin/StatCard";
import SectionCard from "@/components/admin/SectionCard";
import { 
  Users, 
  Activity, 
  Stethoscope, 
  TrendingUp, 
  Settings, 
  Terminal,
  Database,
  CloudLightning,
  RefreshCcw,
  Zap
} from 'lucide-react';

export default function DashboardPage() {
  const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualSync = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastSync(new Date().toLocaleTimeString());
      setIsRefreshing(false);
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-secondary tracking-tight">System Infrastructure</h1>
          <p className="text-secondary/60 font-medium">Developer Control Center & Performance Monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-2xl border border-emerald-100 flex items-center gap-2 text-sm font-bold">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-sm shadow-emerald-200" />
            Backend Online
          </div>
          <button 
            onClick={handleManualSync}
            className={`bg-white p-2.5 rounded-2xl border border-background shadow-sm hover:shadow-md transition-all active:scale-90 ${isRefreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCcw size={20} className="text-secondary/40" />
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Server Load"
          value="14%"
          subtitle="All nodes healthy"
          icon={<CloudLightning size={24} />}
          trend="down"
        />
        <StatCard
          title="Active Users"
          value="1,248"
          subtitle="+12.5% from last month"
          icon={<Users size={24} />}
          trend="up"
        />
        <StatCard
          title="API Response Time"
          value="42ms"
          subtitle="Standard baseline maintained"
          icon={<Zap size={24} />}
        />
        <StatCard
          title="Monthly Volumme"
          value="LKR 4.2M"
          subtitle="Processed via Stripe"
          icon={<TrendingUp size={24} />}
          trend="up"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {/* RECENT SYSTEM LOGS */}
        <SectionCard 
           title="Real-time System Logs" 
           icon={<Terminal size={20} className="text-secondary/40" />}
           className="xl:col-span-2"
        >
          <div className="bg-secondary p-6 rounded-2xl font-mono text-sm space-y-3 overflow-hidden border border-white/5">
            <div className="flex gap-3">
              <span className="text-emerald-400 font-bold">[SUCCESS]</span>
              <span className="text-white/60">Mongo Connection established in 8.4ms</span>
            </div>
            <div className="flex gap-3">
              <span className="text-accent font-bold">[INFO]</span>
              <span className="text-white/60">Webhook listener for Stripe initialized on /api/orders/pay/notify</span>
            </div>
            <div className="flex gap-3">
              <span className="text-accent font-bold">[INFO]</span>
              <span className="text-white/60">Cross-Origin Resource Sharing (CORS) configured for * Environment</span>
            </div>
             <div className="flex gap-3 opacity-60">
              <span className="text-accent font-bold">[INFO]</span>
              <span className="text-white/60">Syncing prescription data with primary cluster... COMPLETE</span>
            </div>
            <div className="flex gap-3 animate-pulse">
              <span className="text-accent font-bold">[INFO]</span>
              <span className="text-white/40">Waiting for incoming requests...</span>
            </div>
          </div>
        </SectionCard>

        {/* DB HEALTH */}
        <SectionCard title="Database Health" icon={<Database size={20} className="text-secondary/40" />}>
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs font-bold text-secondary/40 uppercase tracking-widest mb-1">Disk Usage</p>
                <p className="text-2xl font-black text-secondary">42.8 GB / 100 GB</p>
              </div>
              <span className="bg-background text-secondary/60 px-3 py-1 rounded-full text-[10px] font-black uppercase">Normal</span>
            </div>
            <div className="w-full bg-background h-3 rounded-full overflow-hidden">
                <div className="bg-secondary h-full rounded-full transition-all duration-1000" style={{ width: '42.8%' }} />
            </div>
            
            <div className="pt-4 border-t border-background space-y-4">
                 {[
                   { label: 'Latency', value: '1.2ms', status: 'optimal' },
                   { label: 'Throughput', value: '4.8k ops/s', status: 'optimal' },
                   { label: 'Uptime', value: '99.99%', status: 'optimal' },
                 ].map((metric, i) => (
                   <div key={i} className="flex justify-between text-sm items-center">
                     <span className="font-bold text-secondary/50">{metric.label}</span>
                     <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-lg font-black text-[10px] uppercase shadow-sm border border-emerald-100">
                       {metric.value}
                     </span>
                   </div>
                 ))}
            </div>
          </div>
        </SectionCard>
      </div>

       {/* ACTIVE CONNECTIONS */}
       <SectionCard title="Active Pharmacy Portals (Live)">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
             {[
               { name: 'Sethsuwa Ayurveda', location: 'Colombo', status: 'connected', load: 'Low' },
               { name: 'Standard Pharmacy', location: 'Kandy', status: 'connected', load: 'Medium' },
               { name: 'AyurCare Lab', location: 'Galle', status: 'connected', load: 'Optimizing' },
             ].map((node, i) => (
               <div key={i} className="bg-background p-4 rounded-2xl flex items-center justify-between border border-background/50 hover:border-secondary/20 transition-all cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-secondary shadow-sm group-hover:scale-110 transition-transform">
                      <Stethoscope size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-secondary text-sm">{node.name}</p>
                      <p className="text-xs text-secondary/40 font-medium">{node.location}</p>
                    </div>
                  </div>
                  <div className="bg-white/80 px-2 py-1 rounded-lg text-[10px] font-black uppercase text-secondary/40 shadow-sm">
                    {node.load}
                  </div>
               </div>
             ))}
          </div>
       </SectionCard>

      <footer className="pt-10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold text-secondary/30 uppercase tracking-widest border-t border-background mt-20">
         <p>© 2026 Ayurveda Hub Infrastructure Management Portfolio Edition</p>
         <div className="flex gap-6">
           <span className="hover:text-secondary cursor-pointer transition-colors">Documentation</span>
           <span className="hover:text-secondary cursor-pointer transition-colors">API Keys</span>
           <span className="hover:text-secondary cursor-pointer transition-colors">Support</span>
         </div>
      </footer>
    </div>
  );
}
