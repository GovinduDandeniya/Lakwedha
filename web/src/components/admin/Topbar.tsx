"use client";

export default function Topbar() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="flex items-center justify-between bg-white px-6 py-4">
      <div>
        <h2 className="text-lg font-semibold text-green-900">
          Dashboard Overview
        </h2>
        <p className="text-xs text-gray-500">
          Ayurvedic E-Channeling Platform Analytics
        </p>
      </div>

      <span className="text-sm text-gray-500">{today}</span>
    </header>
  );
}
