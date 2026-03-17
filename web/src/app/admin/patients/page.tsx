import PatientStatCard from "@/components/patients/PatientStatCard";
import PatientsTable from "@/components/patients/PatientsTable";

export default function PatientsPage() {
  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-green-800">
          Patients
        </h1>
        <p className="text-sm text-gray-500">
          Manage patient records and information
        </p>
      </div>

      {/* STATS */}
      <div className="grid gap-6 lg:grid-cols-4">
        <PatientStatCard title="Total Patients" value={0} />
        <PatientStatCard title="Active Patients" value={0} />
        <PatientStatCard title="Total Visits" value={0} />
        <PatientStatCard title="New This Month" value={0} />
      </div>

      {/* SEARCH + FILTER + ACTION */}
      <div className="flex flex-wrap items-center gap-4">
        <input
          type="text"
          placeholder="Search by name, phone, or email..."
          className="flex-1 rounded-lg border px-4 py-2 text-sm"
        />

        <select className="rounded-lg border px-3 py-2 text-sm">
          <option>All Patients</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>

        <button className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white">
          + Add Patient
        </button>
      </div>

      {/* TABLE */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold text-green-800">
          All Patients (0)
        </h2>

        <PatientsTable />
      </div>
    </div>
  );
}
