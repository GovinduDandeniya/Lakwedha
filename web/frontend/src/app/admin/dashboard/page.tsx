import StatCard from "@/components/admin/StatCard";
import SectionCard from "@/components/admin/SectionCard";

export default function DashboardPage() {
  return (
    <div className="space-y-10">
      {/* KPI CARDS */}
      <div className="grid gap-6 lg:grid-cols-4">
        <StatCard
          title="Total Consultations"
          value="3,842"
          subtitle="+15.3% vs last month"
        />
        <StatCard
          title="Active Practitioners"
          value="48"
          subtitle="+8.2% vs last month"
        />
        <StatCard
          title="Registered Patients"
          value="12,567"
          subtitle="+22.4% vs last month"
        />
        <StatCard
          title="Monthly Revenue"
          value="LKR 8.9M"
          subtitle="+26.7% vs last month"
        />
      </div>

      {/* CHART SECTIONS */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Consultation & Revenue Trends">
          <p className="text-sm text-gray-400">
            Line chart will be added here
          </p>
        </SectionCard>

        <SectionCard title="Bookings by Treatment Type">
          <p className="text-sm text-gray-400">
            Bar chart will be added here
          </p>
        </SectionCard>
      </div>

      {/* RECENT APPOINTMENTS */}
      <SectionCard title="Recent Appointments">
        <p className="text-sm text-gray-400">
          Appointments table will be added here
        </p>
      </SectionCard>
    </div>
  );
}
