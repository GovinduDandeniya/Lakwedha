import { Eye, Pencil, Trash2 } from "lucide-react";

type Props = {
  name: string;
  specialty: string;
  experience: string;
  patients: number;
  availability: string;
  status: "active" | "inactive";
  initials: string;
};

export default function DoctorCard({
  name,
  specialty,
  experience,
  patients,
  availability,
  status,
  initials,
}: Props) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white">
            {initials}
          </div>

          <div>
            <p className="font-semibold text-green-800">
              {name}
            </p>
            <p className="text-xs text-gray-500">
              {specialty}
            </p>
          </div>
        </div>

        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            status === "active"
              ? "bg-green-100 text-green-700"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          {status}
        </span>
      </div>

      {/* INFO */}
      <div className="mt-4 space-y-1 text-sm text-gray-600">
        <p>
          <span className="font-medium">Experience:</span>{" "}
          {experience}
        </p>
        <p>
          <span className="font-medium">Patients:</span>{" "}
          {patients}
        </p>
        <p>
          <span className="font-medium">Availability:</span>{" "}
          {availability}
        </p>
      </div>

      {/* ACTIONS */}
      <div className="mt-4 flex gap-2">
        <button className="flex flex-1 items-center justify-center gap-1 rounded border px-2 py-1 text-xs">
          <Eye size={14} /> View
        </button>
        <button className="flex flex-1 items-center justify-center gap-1 rounded border px-2 py-1 text-xs">
          <Pencil size={14} /> Edit
        </button>
        <button className="flex items-center justify-center rounded border px-2 py-1 text-xs text-red-600">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
