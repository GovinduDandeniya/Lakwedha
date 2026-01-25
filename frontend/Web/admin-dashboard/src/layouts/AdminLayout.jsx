import { NavLink, Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* Sidebar */}
      <aside className="w-64 bg-green-900 text-white flex flex-col px-6 py-8">
        <h1 className="text-2xl font-bold mb-10">
          Lakwedha Admin
        </h1>

        <nav className="flex flex-col gap-3">
          <SidebarLink to="/admin" end label="Dashboard" />
          <SidebarLink to="/admin/users" label="Users" />
          <SidebarLink to="/admin/doctors" label="Doctors" />
          <SidebarLink to="/admin/settings" label="Settings" />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <Outlet />
      </main>

    </div>
  );
}

function SidebarLink({ to, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `px-4 py-2 rounded-md transition ${
          isActive
            ? "bg-green-700 font-semibold"
            : "hover:bg-green-800"
        }`
      }
    >
      {label}
    </NavLink>
  );
}
