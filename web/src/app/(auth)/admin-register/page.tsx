'use client';

import { useEffect } from 'react';

export default function AdminRegisterPage() {
  useEffect(() => {
    window.location.href = "/login";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <p className="text-gray-500">Redirecting to login…</p>
    </div>
  );
}
