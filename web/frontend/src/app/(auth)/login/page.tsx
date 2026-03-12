'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Leaf, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  const handleBypass = () => {
    localStorage.setItem('token', 'dummy-jwt-token-for-dev');
    router.push('/pharmacy/dashboard');
  };

  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-white p-12 rounded-3xl shadow-2xl w-full max-w-md border border-background flex flex-col items-center">
        <div className="bg-secondary p-4 rounded-2xl mb-6 shadow-xl shadow-secondary/20">
          <Leaf className="text-accent" size={40} />
        </div>

        <h1 className="text-3xl font-extrabold text-secondary mb-2">Ayurveda Hub</h1>
        <p className="text-secondary/60 text-center mb-8">Authentication is currently being built by the Core Team.</p>
=======
    <div className="min-h-screen bg-sand flex items-center justify-center p-4">
      <div className="bg-white p-12 rounded-3xl shadow-2xl w-full max-w-md border border-clay flex flex-col items-center">
        <div className="bg-earth p-4 rounded-2xl mb-6 shadow-xl shadow-earth/20">
          <Leaf className="text-turmeric" size={40} />
        </div>

        <h1 className="text-3xl font-extrabold text-earth mb-2">Ayurveda Hub</h1>
        <p className="text-earth/60 text-center mb-8">Authentication is currently being built by the Core Team.</p>
>>>>>>> origin/pharmacy

        <div className="w-full space-y-4">
          <button
            onClick={handleBypass}
<<<<<<< HEAD
            className="w-full py-4 bg-secondary text-white rounded-xl font-bold text-lg hover:bg-secondary/95 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl shadow-secondary/10"
=======
            className="w-full py-4 bg-earth text-white rounded-xl font-bold text-lg hover:bg-earth/95 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl shadow-earth/10"
>>>>>>> origin/pharmacy
          >
            <Lock size={20} />
            Dev Auth Bypass
          </button>

<<<<<<< HEAD
          <p className="text-[10px] text-center text-secondary/40 uppercase tracking-widest font-bold">
=======
          <p className="text-[10px] text-center text-earth/40 uppercase tracking-widest font-bold">
>>>>>>> origin/pharmacy
            Senior Frontend Architect Mode Active
          </p>
        </div>
      </div>
    </div>
  );
}
