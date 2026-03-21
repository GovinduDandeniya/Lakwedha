"use client";

import React, { useState, useEffect } from "react";
import EMRFileUploader from "@/components/emr/EMRFileUploader";
import EMRSecureViewer from "@/components/emr/EMRSecureViewer";
import { Stethoscope } from "lucide-react";

export default function EMRIsolatedTestPage() {
  const [authToken, setAuthToken] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [records, setRecords] = useState<any[]>([]);

  // 1. Automatically fetch the Doctor's JWT Token for this component test
  useEffect(() => {
    const autoLogin = async () => {
      const credentials = { name: 'Dr. isolated', email: 'doctor_v2@lakwedha.com', password: 'password123', role: 'DOCTOR' };
      try {
        await fetch("http://localhost:5000/api/users/register", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials)
        });
        const res = await fetch("http://localhost:5000/api/users/login", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: credentials.email, password: credentials.password })
        });
        const data = await res.json();
        if (data && data.token) {
          setAuthToken(data.token);
          fetchHistoricalRecords(data.token); // Load records once logged in
        }
      } catch (err) {
        console.error("Auto-login failed. Make sure backend is running.", err);
      }
    };
    autoLogin();
  }, []);

  const fetchHistoricalRecords = async (token: string) => {
    try {
      // Using a dummy patient ID for isolated component testing
      const res = await fetch(`http://localhost:5000/api/emr/patient/65c3b1234567890123456782`, {
         headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRecords(data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadSubmit = async (files: File[], title: string) => {
    if (!authToken) {
      alert("No secure connection to backend! Make sure the Node server is running on Port 5000.");
      return;
    }
    setIsUploading(true);

    const formData = new FormData();
    formData.append("patientId", "65c3b1234567890123456782"); // Dummy patient
    formData.append("title", title);
    formData.append("type", "prescription"); 
    formData.append("diagnosis", "Testing Component Isolation");
    
    // Attach the actual physical files
    files.forEach(f => {
      formData.append("file", f);
    });

    try {
      const res = await fetch("http://localhost:5000/api/emr/upload", {
        method: "POST",
        body: formData,
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (!res.ok) throw new Error("API returned failure");
      
      alert("File AES Encrypted and Uploaded successfully!");
      fetchHistoricalRecords(authToken); // Refresh the secure viewer instantly!
    } catch (err) {
      alert("Upload failed. Did you restart the backend?");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-gray-900 font-sans p-10 flex flex-col items-center">
      
      {/* Component Title Header */}
      <div className="w-full max-w-6xl mb-12 flex items-center justify-center space-x-4">
        <Stethoscope className="w-12 h-12 text-indigo-600" />
        <div>
           <h1 className="text-4xl font-black tracking-tight text-slate-800">Isolated EMR Components Workspace</h1>
           <p className="text-slate-500 font-medium">Test purely the Upload and Viewer parts independently here.</p>
        </div>
      </div>

      {/* 1. Show the Reference Uploader */}
      <div className="w-full flex justify-center mb-16">
        <EMRFileUploader 
           onUpload={handleUploadSubmit} 
           onCancel={() => alert("Upload Cancelled.")} 
           isUploading={isUploading}
        />
      </div>

      {/* 2. Show the Secure Viewer underneath */}
      <div className="w-full flex justify-center pb-20">
        <EMRSecureViewer 
           records={records}
           onClose={() => alert("Viewer closed.")}
        />
      </div>

    </div>
  );
}
