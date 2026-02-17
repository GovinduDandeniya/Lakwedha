'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Key } from 'lucide-react';

export default function DevAuthTrigger() {
  const router = useRouter();

  const handleBypass = () => {
    // Set a dummy token to bypass auth checks in our axios client
    localStorage.setItem('token', 'dummy-jwt-token-for-dev');
    // Redirect to pharmacy dashboard
    router.push('/pharmacy/dashboard');
  };

  // Only show in development if needed, but for now we'll keep it active for the user
  return (
    <button
      onClick={handleBypass}
      className="fixed bottom-4 right-4 z-50 bg-turmeric text-earth p-3 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center gap-2 font-bold text-xs"
      title="Dev Auth Bypass"
    >
      <Key size={16} />
      BYPASS AUTH
    </button>
  );
}
