'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function AuthCallbackInner() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get('token');
    const user = params.get('user');
    if (token && user) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', user);
      router.replace('/admin/dashboard');
    } else {
      router.replace('/login');
    }
  }, [params, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <p className="text-gray-500">Redirecting…</p>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-green-50"><p className="text-gray-500">Redirecting…</p></div>}>
      <AuthCallbackInner />
    </Suspense>
  );
}
