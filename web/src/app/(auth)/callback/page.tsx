'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const token = params.get('token');
    const user = params.get('user');

    if (token) {
      localStorage.setItem('token', token);
    }

    if (user) {
      localStorage.setItem('user', user);
    }

    router.push('/admin/dashboard');
  }, []);

  return <p>Logging you in...</p>;
}