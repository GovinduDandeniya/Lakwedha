const patients: {
  id: string;
  name: string;
  age: number;
  gender: string;
  contact: string;
  email: string;
  address: string;
  lastVisit: string;
  visits: number;
  status: string;
}[] = [];

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
