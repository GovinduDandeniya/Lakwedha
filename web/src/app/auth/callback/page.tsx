'use client';

import { useEffect } from 'react';

export default function AuthCallback() {
  useEffect(() => {
    // Use window.location.search directly — always available on the client,
    // no Suspense/useSearchParams timing issues
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const user = params.get('user');
    if (token && user) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', user);
      // Full page reload so AuthContext reads localStorage fresh before dashboard mounts
      window.location.replace('/admin/dashboard');
    } else {
      window.location.replace('/login');
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <p className="text-gray-500">Redirecting…</p>
    </div>
  );
}
