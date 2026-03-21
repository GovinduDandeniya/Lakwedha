"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { UploadCloud, File as FileIcon, FileText, Image as ImageIcon, CheckCircle2, X, Camera, FlipHorizontal, CircleDot } from "lucide-react";

export interface EMRFileUploaderProps {
  onUpload: (files: File[], title: string) => void;
  onCancel: () => void;
  isUploading?: boolean;
}

export default function EMRFileUploader({ onUpload, onCancel, isUploading = false }: EMRFileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // --- Camera State ---
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string>("");
  const [capturedPreview, setCapturedPreview] = useState<string>("");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const currentDate = new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' });
  const currentTime = new Date().toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });

  // Start camera stream
  const startCamera = useCallback(async (facing: "user" | "environment") => {
    // Stop any existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraError("");
    setCapturedPreview("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      setCameraError("Camera access denied or not available. Please allow camera permission in your browser.");
    }
  }, []);

  // Open camera
  const openCamera = () => {
    setShowCamera(true);
    setCapturedPreview("");
  };

  useEffect(() => {
    if (showCamera) {
      startCamera(facingMode);
    }
    return () => {
      // Clean up stream when camera UI closes
      if (!showCamera && streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [showCamera, facingMode, startCamera]);

  // Stop stream when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const flipCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedPreview(dataUrl);
    // Stop live feed while previewing
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const retakePhoto = () => {
    setCapturedPreview("");
    startCamera(facingMode);
  };

  const confirmPhoto = () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob((blob) => {
      if (!blob) return;
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const file = new File([blob], `camera-capture-${timestamp}.jpg`, { type: "image/jpeg" });
      setSelectedFiles(prev => [...prev, file]);
      closeCamera();
    }, "image/jpeg", 0.92);
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
    setCapturedPreview("");
    setCameraError("");
  };

  // --- File Handlers ---
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setSelectedFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes("image")) return <ImageIcon className="w-5 h-5 text-green-600" />;
    if (type.includes("text") || type.includes("pdf")) return <FileText className="w-5 h-5 text-green-600" />;
    return <FileIcon className="w-5 h-5 text-green-600" />;
  };

  const handleUploadSubmit = () => {
    if (selectedFiles.length === 0) {
      alert("Please select at least one file to upload.");
      return;
    }
    if (!title.trim()) {
      alert("Please provide a Title for these medical records.");
      return;
    }
    onUpload(selectedFiles, title);
  };

  return (
    <>
      <div className="flex bg-white rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full text-[#333]">

        {/* LEFT PANE */}
        <div className="flex-1 p-10 border-r border-gray-100 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-green-900 mb-6 tracking-tight">Record Upload</h2>

          {/* Title Input */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-500 mb-1">Record Title</label>
            <input
              type="text"
              placeholder="e.g. Ayurvedic Initial Scan"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Date and Time */}
          <div className="flex justify-between items-center bg-green-50 px-4 py-2 rounded-lg mb-6 border border-green-100">
            <div className="flex flex-col">
              <span className="text-xs text-green-600 font-semibold uppercase">Date</span>
              <span className="text-sm font-medium text-green-900">{currentDate}</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-xs text-green-600 font-semibold uppercase">Time</span>
              <span className="text-sm font-medium text-green-900">{currentTime}</span>
            </div>
          </div>

          {/* Drag & Drop Zone */}
          <div
            className={`flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-dashed transition-all duration-200
              ${dragActive ? "border-green-500 bg-green-50" : "border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-green-300"}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <UploadCloud className="w-16 h-16 text-green-600 mb-4" />
            <p className="text-gray-700 font-medium mb-1">Drag and Drop Files</p>
            <p className="text-gray-400 text-sm mb-6">or</p>

            <div className="flex gap-3">
              {/* Browse */}
              <button
                onClick={() => inputRef.current?.click()}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 shadow-md shadow-green-600/30 text-white rounded-full font-medium transition-all"
              >
                Browse
              </button>

              {/* Camera */}
              <button
                onClick={openCamera}
                className="flex items-center gap-2 px-6 py-2.5 bg-slate-700 hover:bg-slate-800 shadow-md shadow-slate-700/30 text-white rounded-full font-medium transition-all"
              >
                <Camera className="w-4 h-4" />
                Camera
              </button>
            </div>

            <input
              ref={inputRef}
              type="file"
              className="hidden"
              multiple
              onChange={handleChange}
            />
          </div>
        </div>

        {/* RIGHT PANE */}
        <div className="flex-1 p-10 flex flex-col bg-[#F8FAFC]">
          <h2 className="text-xl font-bold text-green-900 mb-6">Uploading</h2>

          <div className="flex-1 overflow-y-auto space-y-3 min-h-[300px] pr-2">
            {selectedFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <p>No files selected yet.</p>
              </div>
            ) : (
              selectedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3 w-[80%]">
                    <div className="p-2 bg-green-50 rounded-full">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="flex flex-col overflow-hidden w-full">
                      <span className="text-sm font-semibold text-gray-800 truncate">{file.name}</span>
                      <span className="text-xs text-gray-400">{formatFileSize(file.size)}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <button onClick={() => removeFile(idx)} className="text-gray-300 hover:text-red-500 transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-between space-x-4">
            <button
              onClick={handleUploadSubmit}
              disabled={isUploading || selectedFiles.length === 0}
              className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 shadow-md shadow-green-600/30 text-white rounded-full font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? "Uploading Securely..." : "Upload Records"}
            </button>
            <button
              onClick={onCancel}
              className="px-8 py-3 bg-white border-2 border-green-200 hover:border-green-600 text-green-700 rounded-full font-medium transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* ── Camera Modal ── */}
      {showCamera && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative bg-slate-900 rounded-2xl overflow-hidden shadow-2xl w-full max-w-2xl">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-green-400" />
                <span className="text-white font-semibold">Capture Medical Record</span>
              </div>
              <button onClick={closeCamera} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Camera / Preview Area */}
            <div className="relative bg-black aspect-video flex items-center justify-center">
              {cameraError ? (
                <div className="text-center p-8">
                  <Camera className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">{cameraError}</p>
                </div>
              ) : capturedPreview ? (
                /* Show captured still */
                <img src={capturedPreview} alt="Captured" className="w-full h-full object-contain" />
              ) : (
                /* Live feed */
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              )}

              {/* Hidden canvas for capture */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Live indicator */}
              {!capturedPreview && !cameraError && (
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  LIVE
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 px-6 py-5 bg-slate-900">
              {!capturedPreview ? (
                <>
                  {/* Flip camera */}
                  <button
                    onClick={flipCamera}
                    disabled={!!cameraError}
                    className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors disabled:opacity-30"
                  >
                    <div className="w-11 h-11 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors">
                      <FlipHorizontal className="w-5 h-5" />
                    </div>
                    <span className="text-[10px]">Flip</span>
                  </button>

                  {/* Capture shutter */}
                  <button
                    onClick={capturePhoto}
                    disabled={!!cameraError}
                    className="flex flex-col items-center gap-1 text-white disabled:opacity-30"
                  >
                    <div className="w-16 h-16 rounded-full bg-white hover:bg-green-100 border-4 border-slate-400 flex items-center justify-center transition-colors shadow-lg">
                      <CircleDot className="w-8 h-8 text-slate-700" />
                    </div>
                    <span className="text-[10px] text-slate-400">Capture</span>
                  </button>

                  {/* Cancel */}
                  <button
                    onClick={closeCamera}
                    className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors"
                  >
                    <div className="w-11 h-11 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors">
                      <X className="w-5 h-5" />
                    </div>
                    <span className="text-[10px]">Cancel</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Retake */}
                  <button
                    onClick={retakePhoto}
                    className="px-6 py-2.5 rounded-full bg-slate-700 hover:bg-slate-600 text-white font-medium transition-all"
                  >
                    Retake
                  </button>

                  {/* Use Photo */}
                  <button
                    onClick={confirmPhoto}
                    className="px-8 py-2.5 rounded-full bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md shadow-green-600/30 transition-all"
                  >
                    Use Photo
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
