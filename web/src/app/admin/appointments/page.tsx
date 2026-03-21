'use client';

import { useEffect, useState } from 'react';
import { appointmentApi } from '@/lib/api';
import { CalendarCheck, Clock, CheckCircle2, XCircle } from 'lucide-react';

interface Appointment {
  _id: string;
  patientId?: { name: string; email: string; phone?: string };
  doctorId?: { name: string; specialty?: string };
  date?: string;
  time?: string;
  status: string;
  type?: string;
  notes?: string;
  createdAt: string;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    appointmentApi
      .getAll()
      .then((res) => setAppointments(res as Appointment[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter ? appointments.filter((a) => a.status === filter) : appointments;

  const scheduled = appointments.filter((a) => a.status === 'scheduled').length;
  const completed = appointments.filter((a) => a.status === 'completed').length;
  const cancelled = appointments.filter((a) => a.status === 'cancelled').length;

  if (loading) return <p className="text-gray-500">Loading appointments…</p>;

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; icon: React.ReactNode }> = {
      scheduled: { bg: 'bg-blue-100 text-blue-700', icon: <Clock className="h-3 w-3" /> },
      completed: { bg: 'bg-green-100 text-green-700', icon: <CheckCircle2 className="h-3 w-3" /> },
      cancelled: { bg: 'bg-red-100 text-red-700', icon: <XCircle className="h-3 w-3" /> },
      pending: { bg: 'bg-amber-100 text-amber-700', icon: <Clock className="h-3 w-3" /> },
    };
    const s = map[status] || { bg: 'bg-gray-100 text-gray-600', icon: null };
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.bg}`}>
        {s.icon} {status}
      </span>
    );
  };

  // If Avishka's Appointment model isn't ready, show empty state
  if (appointments.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-green-800">Appointment Monitoring</h1>
          <p className="text-sm text-gray-500">Monitor all patient-doctor appointments</p>
        </div>
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <CalendarCheck className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">No appointments yet</p>
          <p className="text-sm text-gray-400">Appointments will appear here once the booking system is active.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-green-800">Appointment Monitoring</h1>
        <p className="text-sm text-gray-500">Monitor all patient-doctor appointments</p>
      </div>

      {/* STATS */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Total Appointments', value: appointments.length },
          { title: 'Scheduled', value: scheduled },
          { title: 'Completed', value: completed },
          { title: 'Cancelled', value: cancelled },
        ].map((s) => (
          <div key={s.title} className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">{s.title}</p>
            <p className="mt-2 text-2xl font-bold text-green-800">{s.value}</p>
          </div>
        ))}
      </div>

      {/* FILTER */}
      <div className="flex flex-wrap items-center gap-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          <option value="">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="pending">Pending</option>
        </select>
        <span className="text-sm text-gray-500">{filtered.length} appointment(s)</span>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-6 py-3">Patient</th>
              <th className="px-6 py-3">Doctor</th>
              <th className="px-6 py-3">Date / Time</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((apt) => (
              <tr key={apt._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-800">{apt.patientId?.name || '—'}</p>
                  <p className="text-xs text-gray-400">{apt.patientId?.email}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-gray-700">{apt.doctorId?.name || '—'}</p>
                  <p className="text-xs text-gray-400">{apt.doctorId?.specialty}</p>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {apt.date ? new Date(apt.date).toLocaleDateString() : '—'}
                  {apt.time ? ` at ${apt.time}` : ''}
                </td>
                <td className="px-6 py-4 text-gray-600">{apt.type || '—'}</td>
                <td className="px-6 py-4">{statusBadge(apt.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
