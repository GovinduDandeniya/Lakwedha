const patients = [
  {
    id: "#1",
    name: "Amara Wijesinghe",
    age: 34,
    gender: "Female",
    contact: "0771234567",
    email: "amara.w@gmail.com",
    address: "Colombo 07",
    lastVisit: "2026-01-24",
    visits: 12,
    status: "active",
  },
  {
    id: "#2",
    name: "Nuwan Rajapaksa",
    age: 45,
    gender: "Male",
    contact: "0776543210",
    email: "nuwan.r@gmail.com",
    address: "Kandy",
    lastVisit: "2026-01-22",
    visits: 8,
    status: "active",
  },
  {
    id: "#3",
    name: "Kasuni Fernando",
    age: 28,
    gender: "Female",
    contact: "0763456789",
    email: "kasuni.f@gmail.com",
    address: "Galle",
    lastVisit: "2026-01-18",
    visits: 15,
    status: "active",
  },
  {
    id: "#4",
    name: "Dilani Amarasinghe",
    age: 38,
    gender: "Female",
    contact: "0789876543",
    email: "dilani.a@gmail.com",
    address: "Colombo 05",
    lastVisit: "2025-12-15",
    visits: 5,
    status: "inactive",
  },
];

const statusStyles: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-200 text-gray-600",
};

export default function PatientsTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="pb-3">ID</th>
            <th className="pb-3">Name</th>
            <th className="pb-3">Age / Gender</th>
            <th className="pb-3">Contact</th>
            <th className="pb-3">Email</th>
            <th className="pb-3">Address</th>
            <th className="pb-3">Last Visit</th>
            <th className="pb-3">Total Visits</th>
            <th className="pb-3">Status</th>
            <th className="pb-3">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y">
          {patients.map((p) => (
            <tr key={p.id}>
              <td className="py-3">{p.id}</td>
              <td className="py-3 font-medium">{p.name}</td>
              <td className="py-3">
                {p.age} / {p.gender}
              </td>
              <td className="py-3">{p.contact}</td>
              <td className="py-3">{p.email}</td>
              <td className="py-3">{p.address}</td>
              <td className="py-3">{p.lastVisit}</td>
              <td className="py-3">{p.visits}</td>
              <td className="py-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    statusStyles[p.status]
                  }`}
                >
                  {p.status}
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
