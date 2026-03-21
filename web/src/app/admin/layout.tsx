'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from "@/components/admin/Sidebar";
import Topbar from "@/components/admin/Topbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-green-50">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="flex min-h-screen bg-green-50">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
