const appointments = [
  {
    id: "#1",
    patient: "Amara Wijesinghe",
    contact: "0771234567",
    doctor: "Dr. Chandana Perera",
    treatment: "Panchakarma",
    date: "2026-01-25 10:00 AM",
    fee: "LKR 2,500",
    status: "confirmed",
  },
  {
    id: "#2",
    patient: "Nuwan Rajapaksa",
    contact: "0776543210",
    doctor: "Dr. Malini Jayawardena",
    treatment: "Shirodhara",
    date: "2026-01-25 10:30 AM",
    fee: "LKR 3,000",
    status: "pending",
  },
  {
    id: "#3",
    patient: "Kasuni Fernando",
    contact: "0763456789",
    doctor: "Dr. Rohan Herath",
    treatment: "Consultation",
    date: "2026-01-25 11:00 AM",
    fee: "LKR 1,500",
    status: "confirmed",
  },
];

const statusStyles: Record<string, string> = {
  confirmed: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  completed: "bg-gray-200 text-gray-600",
  cancelled: "bg-red-100 text-red-600",
};

export default function AppointmentsTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="pb-3">ID</th>
            <th className="pb-3">Patient</th>
            <th className="pb-3">Contact</th>
            <th className="pb-3">Doctor</th>
            <th className="pb-3">Treatment</th>
            <th className="pb-3">Date & Time</th>
            <th className="pb-3">Fee</th>
            <th className="pb-3">Status</th>
            <th className="pb-3">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y">
          {appointments.map((a) => (
            <tr key={a.id}>
              <td className="py-3">{a.id}</td>
              <td className="py-3">{a.patient}</td>
              <td className="py-3">{a.contact}</td>
              <td className="py-3 text-green-700">{a.doctor}</td>
              <td className="py-3">{a.treatment}</td>
              <td className="py-3">{a.date}</td>
              <td className="py-3">{a.fee}</td>
              <td className="py-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    statusStyles[a.status]
                  }`}
                >
                  {a.status}
                </span>
              </td>
              <td className="py-3 flex gap-2 text-gray-500">
                👁 ✏️ 🗑
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
