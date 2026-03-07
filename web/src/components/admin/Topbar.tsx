"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LogOut } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/admin/dashboard": "Dashboard Overview",
  "/admin/doctors": "Doctor Management",
  "/admin/pharmacies": "Pharmacy Management",
  "/admin/patients": "Patient Management",
  "/admin/appointments": "Appointment Monitoring",
  "/admin/orders": "Order Monitoring",
  "/admin/payments": "Payment Management",
  "/admin/analytics": "Analytics & Reports",
  "/admin/emergency-centers": "Emergency Centers",
  "/admin/settings": "Settings",
};

export default function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const title = pageTitles[pathname] || "Admin Panel";

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="flex items-center justify-between bg-white px-6 py-4 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-green-900">{title}</h2>
        <p className="text-xs text-gray-500">{today}</p>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <span className="text-sm text-gray-600">
            {user.name}
          </span>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </header>
  );
}
