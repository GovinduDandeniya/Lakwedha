"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck,
  Leaf,
  Users,
  Package,
  Clock,
  DollarSign,
  BarChart3,
  Settings,
} from "lucide-react";

const menu = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Appointments", href: "/admin/appointments", icon: CalendarCheck },
  { name: "Practitioners", href: "/admin/doctors", icon: Leaf },
  { name: "Patients", href: "/admin/patients", icon: Users },
  { name: "Treatments", href: "#", icon: Package },
  { name: "Schedule", href: "#", icon: Clock },
  { name: "Payments", href: "#", icon: DollarSign },
  { name: "Analytics", href: "#", icon: BarChart3 },
  { name: "Settings", href: "#", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gradient-to-b from-green-900 to-green-700 text-white">
      {/* LOGO */}
      <div className="px-6 py-6">
        <div className="flex items-center gap-2">
          <Leaf className="h-6 w-6 text-green-300" />
          <h1 className="text-xl font-bold">Lakwedha</h1>
        </div>
        <p className="mt-1 text-xs text-green-200">Admin Portal</p>
      </div>

      {/* MENU */}
      <nav className="mt-4 space-y-1 px-3">
        {menu.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-2 text-sm transition
                ${
                  active
                    ? "bg-orange-500 text-white shadow"
                    : "text-green-100 hover:bg-green-800"
                }`}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
