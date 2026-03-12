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

export default function PharmacyLayout({ children }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/pharmacy/dashboard', icon: LayoutDashboard },
    { name: 'Active Orders', href: '/pharmacy/orders', icon: Package },
    { name: 'Payments', href: '/pharmacy/payments', icon: CreditCard },
  ];

  return (
<<<<<<< HEAD
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-secondary text-white flex flex-col fixed inset-y-0 left-0 z-40 transition-transform shadow-xl">
        {/* Brand */}
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <Leaf className="text-accent" size={28} />
=======
    <div className="flex min-h-screen bg-sand">
      {/* Sidebar */}
      <aside className="w-64 bg-earth text-white flex flex-col fixed inset-y-0 left-0 z-40 transition-transform shadow-xl">
        {/* Brand */}
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <Leaf className="text-turmeric" size={28} />
>>>>>>> origin/pharmacy
          <span className="font-bold text-xl tracking-tight">Ayurveda Hub</span>
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
<<<<<<< HEAD
                    ? "bg-accent text-secondary font-bold shadow-lg"
=======
                    ? "bg-turmeric text-earth font-bold shadow-lg"
>>>>>>> origin/pharmacy
                    : "hover:bg-white/10 text-white/80 hover:text-white"
                )}
              >
                <item.icon size={20} className={clsx(
<<<<<<< HEAD
                  isActive ? "text-secondary" : "text-accent group-hover:scale-110 transition-transform"
=======
                  isActive ? "text-earth" : "text-turmeric group-hover:scale-110 transition-transform"
>>>>>>> origin/pharmacy
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
      <main className="flex-1 ml-64 min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
