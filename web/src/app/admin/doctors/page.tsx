'use client';

import { useEffect, useState } from 'react';
import { doctorApi } from '@/lib/api';
import DoctorStatCard from '@/components/doctors/DoctorStatCard';
import { CheckCircle, XCircle, Clock, User } from 'lucide-react';

interface Doctor {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  specialty?: string;
  experience?: string;
  qualifications?: string;
  status: string;
  createdAt: string;
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDoctors = () => {
    doctorApi
      .getAll()
      .then((res) => setDoctors(res as Doctor[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDoctors(); }, []);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await doctorApi.approve(id);
      fetchDoctors();
    } catch { /* */ }
    setActionLoading(null);
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await doctorApi.reject(id);
      fetchDoctors();
    } catch { /* */ }
    setActionLoading(null);
  };

  const filtered = filter
    ? doctors.filter((d) => d.status === filter)
    : doctors;

  const pending = doctors.filter((d) => d.status === 'pending').length;
  const active = doctors.filter((d) => d.status === 'active').length;
  const rejected = doctors.filter((d) => d.status === 'rejected').length;

  if (loading) return <p className="text-gray-500">Loading doctors…</p>;

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      pending: 'bg-amber-100 text-amber-700',
      rejected: 'bg-red-100 text-red-700',
      suspended: 'bg-gray-200 text-gray-600',
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
        <h1 className="text-2xl font-bold text-green-800">Doctor Management</h1>
        <p className="text-sm text-gray-500">Approve, reject, and manage registered doctors</p>
      </div>

      {/* STATS */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <DoctorStatCard title="Total Doctors" value={doctors.length} />
        <DoctorStatCard title="Active" value={active} />
        <DoctorStatCard title="Pending Approval" value={pending} />
        <DoctorStatCard title="Rejected" value={rejected} />
      </div>

      {/* FILTER */}
      <div className="flex flex-wrap items-center gap-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="rejected">Rejected</option>
        </select>
        <span className="text-sm text-gray-500">{filtered.length} doctor(s)</span>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-6 py-3">Doctor</th>
              <th className="px-6 py-3">Specialty</th>
              <th className="px-6 py-3">Experience</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Registered</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                  No doctors found
                </td>
              </tr>
            )}
            {filtered.map((doc) => (
              <tr key={doc._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white">
                      {doc.name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{doc.name}</p>
                      <p className="text-xs text-gray-400">{doc.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{doc.specialty || '—'}</td>
                <td className="px-6 py-4 text-gray-600">{doc.experience || '—'}</td>
                <td className="px-6 py-4">{statusBadge(doc.status)}</td>
                <td className="px-6 py-4 text-gray-500">
                  {new Date(doc.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {doc.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(doc._id)}
                          disabled={actionLoading === doc._id}
                          className="flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition disabled:opacity-50"
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleReject(doc._id)}
                          disabled={actionLoading === doc._id}
                          className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </button>
                      </>
                    )}
                    {doc.status === 'rejected' && (
                      <button
                        onClick={() => handleApprove(doc._id)}
                        disabled={actionLoading === doc._id}
                        className="flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition disabled:opacity-50"
                      >
                        <CheckCircle className="h-3.5 w-3.5" /> Re-approve
                      </button>
                    )}
                    {doc.status === 'active' && (
                      <span className="text-xs text-gray-400">Approved</span>
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
