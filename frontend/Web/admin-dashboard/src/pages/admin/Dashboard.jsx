import StatCard from "../../components/dashboard/StatCard";
import {
  FaUserMd,
  FaUsers,
  FaCalendarAlt,
  FaDollarSign,
} from "react-icons/fa";

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Consultations"
          value="3,842"
          change="+15.3%"
          icon={<FaCalendarAlt className="text-green-600" />}
        />

        <StatCard
          title="Active Practitioners"
          value="48"
          change="+8.2%"
          icon={<FaUserMd className="text-green-600" />}
        />

        <StatCard
          title="Registered Patients"
          value="12,567"
          change="+22.4%"
          icon={<FaUsers className="text-green-600" />}
        />

        <StatCard
          title="Monthly Revenue"
          value="LKR 8.9M"
          change="+28.7%"
          icon={<FaDollarSign className="text-green-600" />}
        />
      </div>
    </div>
  );
}
