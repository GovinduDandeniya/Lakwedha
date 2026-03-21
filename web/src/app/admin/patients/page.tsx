'use client';

import { useEffect, useState } from 'react';
import { patientApi } from '@/lib/api';
import { ShieldOff, ShieldCheck } from 'lucide-react';

interface Patient {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  createdAt: string;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPatients = () => {
    patientApi
      .getAll()
      .then((res) => setPatients(res as Patient[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPatients(); }, []);

  const handleSuspend = async (id: string) => {
    setActionLoading(id);
    try { await patientApi.suspend(id); fetchPatients(); } catch { /* */ }
    setActionLoading(null);
  };

  const handleActivate = async (id: string) => {
    setActionLoading(id);
    try { await patientApi.activate(id); fetchPatients(); } catch { /* */ }
    setActionLoading(null);
  };

  let filtered = filter ? patients.filter((p) => p.status === filter) : patients;
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.phone?.includes(q)
    );
  }

  const active = patients.filter((p) => p.status === 'active').length;
  const suspended = patients.filter((p) => p.status === 'suspended').length;

  if (loading) return <p className="text-gray-500">Loading patients…</p>;

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      suspended: 'bg-red-100 text-red-700',
      pending: 'bg-amber-100 text-amber-700',
    };
    return (
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] || 'bg-gray-100 text-gray-600'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-green-800">Patient Management</h1>
        <p className="text-sm text-gray-500">View and manage registered patients</p>
      </div>

      {/* STATS */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Total Patients', value: patients.length },
          { title: 'Active', value: active },
          { title: 'Suspended', value: suspended },
          { title: 'New This Month', value: patients.filter((p) => new Date(p.createdAt).getMonth() === new Date().getMonth() && new Date(p.createdAt).getFullYear() === new Date().getFullYear()).length },
        ].map((s) => (
          <div key={s.title} className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">{s.title}</p>
            <p className="mt-2 text-2xl font-bold text-green-800">{s.value}</p>
          </div>
        ))}
      </div>

      {/* SEARCH + FILTER */}
      <div className="flex flex-wrap items-center gap-4">
        <input
          type="text"
          placeholder="Search by name, email, or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border px-4 py-2 text-sm"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <span className="text-sm text-gray-500">{filtered.length} patient(s)</span>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-6 py-3">Patient</th>
              <th className="px-6 py-3">Phone</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Registered</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">No patients found</td>
              </tr>
            )}
            {filtered.map((pt) => (
              <tr key={pt._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white">
                      {pt.name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{pt.name}</p>
                      <p className="text-xs text-gray-400">{pt.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{pt.phone || '—'}</td>
                <td className="px-6 py-4">{statusBadge(pt.status)}</td>
                <td className="px-6 py-4 text-gray-500">{new Date(pt.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {pt.status === 'active' && (
                      <button
                        onClick={() => handleSuspend(pt._id)}
                        disabled={actionLoading === pt._id}
                        className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                      >
                        <ShieldOff className="h-3.5 w-3.5" /> Suspend
                      </button>
                    )}
                    {pt.status === 'suspended' && (
                      <button
                        onClick={() => handleActivate(pt._id)}
                        disabled={actionLoading === pt._id}
                        className="flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition disabled:opacity-50"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" /> Activate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
