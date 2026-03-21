"use client";

import React, { useState, useEffect } from "react";
import EMRFileUploader from "@/components/emr/EMRFileUploader";
import EMRSecureViewer from "@/components/emr/EMRSecureViewer";
import { FolderOpen, UploadCloud, X } from "lucide-react";

export default function EMRPage() {
  const [authToken, setAuthToken] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [records, setRecords] = useState<any[]>([]);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewerModal, setShowViewerModal] = useState(false);

  // Auto-login to get JWT token
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
          fetchHistoricalRecords(data.token);
        }
      } catch (err) {
        console.error("Auto-login failed. Make sure backend is running.", err);
      }
    };
    autoLogin();
  }, []);

  const fetchHistoricalRecords = async (token: string) => {
    try {
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
    formData.append("patientId", "65c3b1234567890123456782");
    formData.append("title", title);
    formData.append("type", "prescription");


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
      fetchHistoricalRecords(authToken);
      setShowUploadModal(false);
    } catch (err) {
      alert("Upload failed. Did you restart the backend?");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      {/* Trigger Buttons */}
      <div className="flex gap-4 p-6">
        <button
          onClick={() => setShowViewerModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow transition-all"
        >
          <FolderOpen className="w-4 h-4" />
          View Medical Records
        </button>

        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium shadow transition-all"
        >
          <UploadCloud className="w-4 h-4" />
          Upload Medical Record
        </button>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-4xl">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute -top-4 -right-4 z-10 w-9 h-9 flex items-center justify-center bg-white rounded-full shadow-lg text-gray-500 hover:text-red-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <EMRFileUploader
              onUpload={handleUploadSubmit}
              onCancel={() => setShowUploadModal(false)}
              isUploading={isUploading}
            />
          </div>
        </div>
      )}

      {/* Viewer Modal */}
      {showViewerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-4xl">
            <button
              onClick={() => setShowViewerModal(false)}
              className="absolute -top-4 -right-4 z-10 w-9 h-9 flex items-center justify-center bg-white rounded-full shadow-lg text-gray-500 hover:text-red-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <EMRSecureViewer
              records={records}
              onClose={() => setShowViewerModal(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
