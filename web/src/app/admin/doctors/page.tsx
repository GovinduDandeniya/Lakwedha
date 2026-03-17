import DoctorStatCard from "@/components/doctors/DoctorStatCard";
import DoctorCard from "@/components/doctors/DoctorCard";

export default function DoctorsPage() {
  return (
    <div className="space-y-8">
      {/* PAGE HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-green-800">
          Practitioners
        </h1>
        <p className="text-sm text-gray-500">
          Manage registered Ayurvedic practitioners
        </p>
      </div>

      {/* STATS */}
      <div className="grid gap-6 lg:grid-cols-4">
        <DoctorStatCard title="Total Practitioners" value={0} />
        <DoctorStatCard title="Active Doctors" value={0} />
        <DoctorStatCard title="Total Patients" value={0} />
        <DoctorStatCard title="Avg Rating" value="—" />
      </div>

      {/* SEARCH + FILTER + ACTION */}
      <div className="flex flex-wrap items-center gap-4">
        <input
          type="text"
          placeholder="Search by name or specialty..."
          className="flex-1 rounded-lg border px-4 py-2 text-sm"
        />

        <select className="rounded-lg border px-3 py-2 text-sm">
          <option>All Status</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>

        <button className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white">
          + Add Practitioner
        </button>
      </div>

      {/* PRACTITIONER CARDS */}
      <div className="grid gap-6 lg:grid-cols-3">
        <p className="text-sm text-gray-400 col-span-3">No practitioners found.</p>
      </div>
    </div>
  );
}
