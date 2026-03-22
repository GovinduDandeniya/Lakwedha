'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  CreditCard,
  LogOut,
  Leaf
} from 'lucide-react';
import { clsx } from 'clsx';

/**
 * Pharmacy Hub Layout
 * Strictly for Pharmacist Admin use.
 */
export default function PharmacyLayout({ children }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard Hub', href: '/pharmacy/dashboard', icon: LayoutDashboard },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - Strictly Pharmacist Sidebar */}
      <aside className="w-64 bg-primary text-white flex flex-col fixed inset-y-0 left-0 z-40 transition-transform shadow-xl border-r border-secondary/20">
        {/* Brand */}
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <Leaf className="text-secondary" size={28} />
          <span className="font-bold text-xl tracking-tight text-secondary">Ayurveda Hub</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                  isActive
                    ? "bg-secondary text-primary font-bold shadow-lg"
                    : "hover:bg-white/10 text-white/80 hover:text-white"
                )}
              >
                <item.icon size={20} className={clsx(
                  isActive ? "text-primary" : "text-secondary group-hover:scale-110 transition-transform"
                )} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => {
              localStorage.removeItem('token');
              window.location.href = '/login';
            }}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-all font-medium"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 min-h-screen p-8 bg-background">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

