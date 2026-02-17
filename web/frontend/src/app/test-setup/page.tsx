'use client';

import React from 'react';
import { ORDER_STATUS } from '../../config/constants';
import api from '../../utils/api';
import { Activity } from 'lucide-react';

export default function TestSetupPage() {
  const checkAPI = async () => {
    try {
      console.log('Checking API health...');
      const response = await api.get('/health');
      console.log('API Response:', response.data);
      alert('API Check Successful! Check console for details.');
    } catch (error) {
      console.error('API Check Failed:', error);
      alert('API Check Failed! Check console for details.');
    }
  };

  return (
    <div className="p-8 space-y-8">
      <header className="flex items-center gap-4">
        <Activity className="text-herbal w-8 h-8" />
        <h1 className="text-3xl font-bold">Frontend Foundation Verification</h1>
      </header>

      {/* Color Palette Check */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">1. Color Palette Check (Tailwind Config)</h2>
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col items-center gap-2">
            <div className="w-24 h-24 bg-earth rounded-lg border border-clay shadow-md"></div>
            <span className="text-sm font-medium">bg-earth</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-24 h-24 bg-turmeric rounded-lg border border-clay shadow-md"></div>
            <span className="text-sm font-medium">bg-turmeric</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-24 h-24 bg-herbal rounded-lg border border-clay shadow-md"></div>
            <span className="text-sm font-medium">bg-herbal</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-24 h-24 bg-sand rounded-lg border border-clay shadow-md"></div>
            <span className="text-sm font-medium">bg-sand</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-24 h-24 bg-clay rounded-lg border border-clay shadow-md"></div>
            <span className="text-sm font-medium">bg-clay</span>
          </div>
        </div>
      </section>

      {/* Constants Check */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">2. Constants Check</h2>
        <div className="bg-white p-4 rounded-lg border border-clay shadow-inner">
          <code className="whitespace-pre-wrap text-sm text-earth">
            {JSON.stringify(ORDER_STATUS, null, 2)}
          </code>
        </div>
      </section>

      {/* API Check */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">3. API Client Check</h2>
        <button
          onClick={checkAPI}
          className="px-6 py-2 bg-earth text-white rounded-md hover:bg-opacity-90 active:scale-95 transition-all flex items-center gap-2 shadow-lg"
        >
          Test API Health
        </button>
        <p className="text-sm text-earth/60 italic">
          Click to attempt GET /health. Result will be logged to the console.
        </p>
      </section>
    </div>
  );
}
