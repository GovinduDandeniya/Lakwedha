"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, File, FileText, Image as ImageIcon, CheckCircle2, X } from "lucide-react";

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

  // Automatically captures the moment they use this component
  const currentDate = new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' });
  const currentTime = new Date().toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
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
    return <File className="w-5 h-5 text-green-600" />;
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
    <div className="flex bg-white rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full text-[#333]">
      
      {/* LEFT PANE: Drag and Drop Context */}
      <div className="flex-1 p-10 border-r border-gray-100 flex flex-col justify-center">
        <h2 className="text-2xl font-bold text-green-900 mb-6 tracking-tight">Record Upload</h2>
        
        {/* Title Input as Requested */}
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

        {/* Date and Time Tracker */}
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
          
          <button 
            onClick={() => inputRef.current?.click()}
            className="px-8 py-2.5 bg-green-600 hover:bg-green-700 shadow-md shadow-green-600/30 text-white rounded-full font-medium transition-all"
          >
            Browse
          </button>
          
          <input 
            ref={inputRef}
            type="file" 
            className="hidden" 
            multiple 
            onChange={handleChange} 
          />
        </div>
      </div>

      {/* RIGHT PANE: Status and List */}
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
           {selectedFiles.length > 0 && (
             <button 
               onClick={handleUploadSubmit}
               disabled={isUploading}
               className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 shadow-md shadow-green-600/30 text-white rounded-full font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {isUploading ? "Uploading Securely..." : "Upload"}
             </button>
           )}
           <button 
             onClick={onCancel}
             className="px-8 py-3 bg-white border-2 border-green-200 hover:border-green-600 text-green-700 rounded-full font-medium transition-all"
           >
             Cancel
           </button>
        </div>
      </div>

    </div>
  );
}
