"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import EMRFileUploader from "@/components/emr/EMRFileUploader";
import EMRSecureViewer from "@/components/emr/EMRSecureViewer";
import { useAuth } from "@/context/AuthContext";
import { emrApi } from "@/lib/api";
import { FolderOpen, UploadCloud, X } from "lucide-react";

function EMRContent() {
  const { user, token, loading } = useAuth();
  const searchParams = useSearchParams();

  const [isUploading, setIsUploading] = useState(false);
  const [records, setRecords] = useState<any[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewerModal, setShowViewerModal] = useState(false);

  // Resolve patientId: patient sees own records; doctor passes ?patientId=... in URL
  const resolvedPatientId =
    user?.role?.toUpperCase() === "PATIENT"
      ? user._id
      : searchParams.get("patientId") ?? "";

  useEffect(() => {
    if (!loading && token && resolvedPatientId) {
      fetchHistoricalRecords();
    }
  }, [loading, token, resolvedPatientId]);

  const fetchHistoricalRecords = async () => {
    try {
      const data = await emrApi.getByPatientId(resolvedPatientId);
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch EMR records:", err);
    }
  };

  const handleUploadSubmit = async (files: File[], title: string) => {
    if (!token) {
      alert("You must be logged in to upload records.");
      return;
    }
    if (!resolvedPatientId) {
      alert("No patient selected. Doctors must pass ?patientId= in the URL.");
      return;
    }
    setIsUploading(true);

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("patientId", resolvedPatientId);
        formData.append("title", title);
        formData.append("type", "prescription");
        formData.append("file", file);
        await emrApi.upload(formData);
      }
      await fetchHistoricalRecords();
      setShowUploadModal(false);
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading…
      </div>
    );
  }

  if (!user || !token) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Please log in to access medical records.
      </div>
    );
  }

  if (!resolvedPatientId) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No patient selected. Add <code className="mx-1 font-mono">?patientId=&lt;id&gt;</code> to the URL.
      </div>
    );
  }

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

export default function EMRPage() {
  return (
    <Suspense>
      <EMRContent />
    </Suspense>
  );
}
