import Sidebar from "@/components/admin/Sidebar";
import Topbar from "@/components/admin/Topbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-green-50">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
