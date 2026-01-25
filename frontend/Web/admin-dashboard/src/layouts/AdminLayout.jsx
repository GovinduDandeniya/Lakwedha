import { Outlet, NavLink } from "react-router-dom";

function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      
      {/* Sidebar */}
      <aside className="w-64 bg-green-900 text-white p-6">
        <h2 className="text-2xl font-bold mb-8">Lakwedha Admin</h2>

        <nav className="flex flex-col gap-4">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              isActive
                ? "font-semibold text-green-300"
                : "text-white hover:text-green-200"
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/admin/users"
            className={({ isActive }) =>
              isActive
                ? "font-semibold text-green-300"
                : "text-white hover:text-green-200"
            }
          >
            Users
          </NavLink>

          <NavLink
            to="/admin/doctors"
            className={({ isActive }) =>
              isActive
                ? "font-semibold text-green-300"
                : "text-white hover:text-green-200"
            }
          >
            Doctors
          </NavLink>

          <NavLink
            to="/admin/settings"
            className={({ isActive }) =>
              isActive
                ? "font-semibold text-green-300"
                : "text-white hover:text-green-200"
            }
          >
            Settings
          </NavLink>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">
        <Outlet />
      </main>

    </div>
  );
}

export default AdminLayout;
