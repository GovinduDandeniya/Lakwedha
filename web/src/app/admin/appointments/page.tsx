import AppointmentStatCard from "@/components/appointments/AppointmentStatCard";
import AppointmentsTable from "@/components/appointments/AppointmentsTable";

export default function AppointmentsPage() {
  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-green-800">
          Appointments
        </h1>
        <p className="text-sm text-gray-500">
          Manage all your patient appointments
        </p>
      </div>

      {/* STATS */}
      <div className="grid gap-6 lg:grid-cols-4">
        <AppointmentStatCard title="Today's Total" value={0} />
        <AppointmentStatCard title="Confirmed" value={0} />
        <AppointmentStatCard title="Pending" value={0} />
        <AppointmentStatCard title="Completed" value={0} />
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap items-center gap-4">
        <input
          type="text"
          placeholder="Search by patient, doctor, or treatment..."
          className="flex-1 rounded-lg border px-4 py-2 text-sm"
        />

        <select className="rounded-lg border px-3 py-2 text-sm">
          <option>All Status</option>
          <option>Confirmed</option>
          <option>Pending</option>
          <option>Completed</option>
        </select>

        <select className="rounded-lg border px-3 py-2 text-sm">
          <option>All Dates</option>
        </select>

        <button className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white">
          More Filters
        </button>
      </div>

      {/* TABLE */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-green-800">
            All Appointments (0)
          </h2>
          <button className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white">
            + New Appointment
          </button>
        </div>

        <AppointmentsTable />
      </div>
    </div>
  );
}
