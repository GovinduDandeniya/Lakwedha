'use client';

import { useEffect, useState } from 'react';
import { analyticsApi } from '@/lib/api';
import { AnalyticsSkeleton } from '@/components/admin/LoadingSkeleton';
import {
    Users,
    Leaf,
    Pill,
    ShoppingCart,
    TrendingUp,
    CalendarCheck,
    DollarSign,
    BarChart3,
} from 'lucide-react';

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

export default function AnalyticsPage() {
    const [data, setData] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        analyticsApi
            .getOverview()
            .then((res) => setData(res as unknown as Analytics))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <AnalyticsSkeleton />;

    if (!data) {
        return (
            <div className="space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-green-800">Analytics & Reports</h1>
                    <p className="text-sm text-gray-500">Platform performance metrics</p>
                </div>
                <div className="rounded-xl bg-white p-12 text-center shadow-sm">
                    <BarChart3 className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-4 text-gray-500">Unable to load analytics</p>
                    <p className="text-sm text-gray-400">Make sure the backend is running.</p>
                </div>
            </div>
        );
    }

    const cards = [
        { label: 'Total Patients', value: data.totalPatients.toLocaleString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Patient Growth', value: data.patientGrowth, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'New Patients (Month)', value: String(data.patientsThisMonth), icon: Users, color: 'text-teal-600', bg: 'bg-teal-50' },
        { label: 'Active Doctors', value: String(data.activeDoctors), icon: Leaf, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Pending Doctors', value: String(data.pendingDoctors), icon: Leaf, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Total Pharmacies', value: String(data.totalPharmacies), icon: Pill, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Pending Pharmacies', value: String(data.pendingPharmacies), icon: Pill, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Total Revenue', value: `LKR ${data.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Monthly Revenue', value: `LKR ${data.monthlyRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Total Orders', value: data.totalOrders.toLocaleString(), icon: ShoppingCart, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Total Appointments', value: String(data.totalAppointments), icon: CalendarCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Appointments (Month)', value: String(data.appointmentsThisMonth), icon: CalendarCheck, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    ];

    return (
        <div className="space-y-8">
            {/* HEADER */}
            <div>
                <h1 className="text-2xl font-bold text-green-800">Analytics & Reports</h1>
                <p className="text-sm text-gray-500">Comprehensive platform performance metrics</p>
            </div>

            {/* KPI GRID */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {cards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div key={card.label} className="rounded-xl bg-white p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.bg}`}>
                                    <Icon className={`h-5 w-5 ${card.color}`} />
                                </div>
                                <p className="text-sm text-gray-500">{card.label}</p>
                            </div>
                            <p className="mt-3 text-2xl font-bold text-gray-800">{card.value}</p>
                        </div>
                    );
                })}
            </div>

            {/* SUMMARY SECTIONS */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Revenue Summary */}
                <div className="rounded-xl bg-white p-6 shadow-sm">
                    <h3 className="mb-4 text-base font-semibold text-gray-800">Revenue Summary</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Total Revenue</span>
                            <span className="text-lg font-bold text-green-700">LKR {data.totalRevenue.toLocaleString()}</span>
                        </div>
                        <div className="h-px bg-gray-100" />
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">This Month</span>
                            <span className="text-lg font-bold text-green-700">LKR {data.monthlyRevenue.toLocaleString()}</span>
                        </div>
                        <div className="h-px bg-gray-100" />
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Total Orders</span>
                            <span className="text-lg font-bold text-gray-700">{data.totalOrders}</span>
                        </div>
                        {data.totalOrders > 0 && (
                            <>
                                <div className="h-px bg-gray-100" />
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">Avg Order Value</span>
                                    <span className="text-lg font-bold text-gray-700">
                                        LKR {Math.round(data.totalRevenue / data.totalOrders).toLocaleString()}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* User Summary */}
                <div className="rounded-xl bg-white p-6 shadow-sm">
                    <h3 className="mb-4 text-base font-semibold text-gray-800">User Summary</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Total Patients</span>
                            <span className="text-lg font-bold text-blue-700">{data.totalPatients}</span>
                        </div>
                        <div className="h-px bg-gray-100" />
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Active Doctors</span>
                            <span className="text-lg font-bold text-emerald-700">{data.activeDoctors}</span>
                        </div>
                        <div className="h-px bg-gray-100" />
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Total Pharmacies</span>
                            <span className="text-lg font-bold text-purple-700">{data.totalPharmacies}</span>
                        </div>
                        <div className="h-px bg-gray-100" />
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Patient Growth</span>
                            <span className="text-lg font-bold text-green-700">{data.patientGrowth}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
