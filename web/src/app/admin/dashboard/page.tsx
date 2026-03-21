'use client';

import { useEffect, useState } from 'react';
import { analyticsApi } from '@/lib/api';
import StatCard from '@/components/admin/StatCard';
import SectionCard from '@/components/admin/SectionCard';
import { Users, Leaf, ShoppingCart, CalendarCheck, Pill, TrendingUp } from 'lucide-react';

interface Analytics {
  totalPatients: number;
  activeDoctors: number;
  pendingDoctors: number;
  totalPharmacies: number;
  pendingPharmacies: number;
  totalOrders: number;
  totalAppointments: number;
  appointmentsThisMonth: number;
  totalRevenue: number;
  monthlyRevenue: number;
  patientsThisMonth: number;
  patientGrowth: string;
}

export default function DashboardPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi
      .getOverview()
      .then((res) => setData(res as Analytics))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-gray-500">Loading dashboard…</p>;
  }

  if (!data) {
    return <p className="text-red-500">Failed to load analytics. Is the backend running?</p>;
  }

  return (
    <div className="space-y-10">
      {/* KPI CARDS */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard
          title="Total Patients"
          value={data.totalPatients.toLocaleString()}
          subtitle={`+${data.patientsThisMonth} this month (${data.patientGrowth})`}
        />
        <StatCard
          title="Active Doctors"
          value={String(data.activeDoctors)}
          subtitle={`${data.pendingDoctors} pending approval`}
        />
        <StatCard
          title="Total Pharmacies"
          value={String(data.totalPharmacies)}
          subtitle={`${data.pendingPharmacies} pending approval`}
        />
        <StatCard
          title="Total Orders"
          value={data.totalOrders.toLocaleString()}
          subtitle={`LKR ${data.totalRevenue.toLocaleString()} total revenue`}
        />
        <StatCard
          title="Monthly Revenue"
          value={`LKR ${data.monthlyRevenue.toLocaleString()}`}
          subtitle="Current month"
        />
        <StatCard
          title="Appointments"
          value={String(data.totalAppointments)}
          subtitle={`${data.appointmentsThisMonth} this month`}
        />
      </div>

      {/* QUICK GLANCE SECTIONS */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Pending Approvals">
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-amber-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <Leaf className="h-5 w-5 text-amber-600" />
                <span className="text-sm font-medium text-gray-700">Doctors awaiting approval</span>
              </div>
              <span className="text-lg font-bold text-amber-700">{data.pendingDoctors}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-amber-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <Pill className="h-5 w-5 text-amber-600" />
                <span className="text-sm font-medium text-gray-700">Pharmacies awaiting approval</span>
              </div>
              <span className="text-lg font-bold text-amber-700">{data.pendingPharmacies}</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Platform Overview">
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-green-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Total registered users</span>
              </div>
              <span className="text-lg font-bold text-green-700">
                {(data.totalPatients + data.activeDoctors + data.pendingDoctors + data.totalPharmacies).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-green-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Patient growth</span>
              </div>
              <span className="text-lg font-bold text-green-700">{data.patientGrowth}</span>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
