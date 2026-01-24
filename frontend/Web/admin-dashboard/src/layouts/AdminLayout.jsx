import { Outlet, Link } from "react-router-dom";

function AdminLayout() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      
      {/* Sidebar */}
      <aside
        style={{
          width: "220px",
          background: "#eee",
          padding: "1rem",
        }}
      >
        <h2>Admin Sidebar</h2>

        <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Link to="/admin">Dashboard</Link>
          <Link to="/admin/users">Users</Link>
          <Link to="/admin/doctors">Doctors</Link>
          <Link to="/admin/settings">Settings</Link>
        </nav>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: "1rem" }}>
        <h2>Admin Layout Loaded</h2>
        <Outlet />
      </main>

    </div>
  );
}

export default AdminLayout;
