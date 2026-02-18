'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  ShieldCheck,
  Info
} from 'lucide-react';
import api from '@/utils/api';

export default function UploadPrescription() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("File size too large. Max 5MB allowed.");
        return;
      }
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setError(null);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a prescription image first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // In a real app, you'd use FormData to upload the file to S3/Cloudinary
      // For this student-level project, we'll simulate the upload
      // and send the dummy URL to our backend to create a record.

      const dummyImageUrl = "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=2030&auto=format&fit=crop";

      const response = await api.post('/pharmacy/prescriptions', {
        imageUrl: dummyImageUrl,
        patientName: "Guest Patient", // Simulating user context
      });

      if (response.status === 201 || response.status === 200) {
        setSuccess(true);
        setTimeout(() => router.push('/'), 3000);
      }
    } catch (err: any) {
      console.error("Upload failed:", err);
      setError("Failed to submit prescription. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center p-6">
        <div className="bg-white p-12 rounded-[40px] shadow-2xl border border-clay text-center space-y-6 max-w-lg w-full animate-in zoom-in duration-300">
          <div className="w-24 h-24 bg-herbal/10 text-herbal rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={48} />
          </div>
          <h1 className="text-3xl font-black text-earth">Submission Successful!</h1>
          <p className="text-earth/60 text-lg">
            Your prescription has been sent to our pharmacists. We'll notify you as soon as it's priced.
          </p>
          <div className="pt-4">
            <div className="h-1 w-full bg-sand rounded-full overflow-hidden">
              <div className="h-full bg-herbal animate-[progress_3s_ease-in-out]" />
            </div>
            <p className="text-[10px] uppercase font-bold text-earth/40 mt-3 tracking-widest">Redirecting to Homepage...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-earth/60 hover:text-earth font-bold transition-all"
          >
            <ArrowLeft size={20} />
            Back to Home
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-herbal" size={20} />
            <span className="text-xs font-black text-earth/40 uppercase tracking-widest">Secure HIPAA-Compliant Portal</span>
          </div>
        </div>

        <div className="grid md:grid-cols-5 gap-12 items-start">
          {/* Instructions */}
          <div className="md:col-span-2 space-y-8">
            <h1 className="text-5xl font-black text-earth leading-tight">
              Order Your <span className="text-herbal italic">Medicines</span>
            </h1>
            <p className="text-lg text-earth/60 leading-relaxed">
              Upload a clear photo of your prescription. Our certified Ayurvedic pharmacists will review it and send you a price quote within minutes.
            </p>

            <div className="space-y-4 pt-4">
              {[
                "Ensure the doctor's seal is visible",
                "Keep the paper flat and use good lighting",
                "Handwritten or digital prescriptions accepted"
              ].map((tip, idx) => (
                <div key={idx} className="flex items-start gap-3 bg-white/50 p-4 rounded-2xl border border-clay/50">
                   <Info className="text-turmeric mt-1" size={18} />
                   <p className="text-sm font-medium text-earth/80">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Upload Form */}
          <div className="md:col-span-3">
             <form onSubmit={handleSubmit} className="bg-white p-8 md:p-12 rounded-[40px] shadow-2xl border border-clay space-y-8">
                {error && (
                  <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-800 text-sm font-bold">
                    <X size={18} className="text-red-500" />
                    {error}
                  </div>
                )}

                <div className="relative">
                  {!preview ? (
                    <label className="group relative cursor-pointer block border-4 border-dashed border-clay hover:border-earth/20 rounded-[32px] p-20 transition-all bg-sand/20 hover:bg-sand/40">
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center text-clay group-hover:text-earth transition-colors shadow-lg shadow-earth/5">
                          <Upload size={32} />
                        </div>
                        <div>
                          <p className="text-xl font-black text-earth">Drop image here</p>
                          <p className="text-earth/40 font-bold uppercase text-[10px] tracking-widest mt-1 italic">or click to browse library</p>
                        </div>
                      </div>
                    </label>
                  ) : (
                    <div className="relative rounded-[32px] overflow-hidden border border-clay shadow-2xl">
                      <img src={preview} alt="Preview" className="w-full aspect-video object-cover" />
                      <div className="absolute inset-0 bg-earth/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={removeFile}
                          className="bg-white text-red-500 p-4 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center gap-2 font-black"
                        >
                          <X size={24} />
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 bg-sand/50 p-5 rounded-3xl border border-clay">
                  <div className="bg-white p-3 rounded-2xl text-earth/40">
                    <FileText size={24} />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-bold text-earth truncate">{file ? file.name : "No file selected"}</p>
                    <p className="text-[10px] text-earth/40 uppercase font-black tracking-widest">{file ? `${(file.size / 1024).toFixed(0)} KB` : "Waiting for upload..."}</p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!file || loading}
                  className="w-full py-6 bg-earth text-white rounded-3xl font-black text-xl flex items-center justify-center gap-3 hover:bg-earth/95 shadow-2xl shadow-earth/20 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed group"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={24} />
                      Processing...
                    </>
                  ) : (
                    <>
                      Submit Prescription
                      <ArrowLeft className="rotate-180 group-hover:translate-x-2 transition-transform" size={24} />
                    </>
                  )}
                </button>
             </form>
          </div>
        </div>
      </div>
    </div>
  );
}
