"use client";

import React, { useEffect, useState } from "react";
import { DownloadCloud, Info, FileText, FileImage, ShieldAlert } from "lucide-react";

export interface EMRSecureViewerProps {
  records: any[];
  onClose: () => void;
  // Fallback to fetch raw file logic if available
}

export default function EMRSecureViewer({ records, onClose }: EMRSecureViewerProps) {
  const [activeRecord, setActiveRecord] = useState<any>(null);
  const [secureObjectUrl, setSecureObjectUrl] = useState<string>('');
  const [isBlurred, setIsBlurred] = useState(false);
  
  // Whenever the active record changes, if it has a fileUrl, we MUST explicitly fetch it with the JWT token
  useEffect(() => {
    let objectUrl: string = '';
    
    const fetchSecureFile = async () => {
      if (!activeRecord || !activeRecord.fileUrl) {
        setSecureObjectUrl('');
        return;
      }
      
      let source = activeRecord.fileUrl;
      if (source.startsWith('/api/emr/files/')) {
        source = `http://localhost:5000${source}`;
      }
      
      if (source.startsWith('http')) {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(source, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!res.ok) throw new Error("Failed to fetch secure file");
          const blob = await res.blob();
          objectUrl = URL.createObjectURL(blob);
          setSecureObjectUrl(objectUrl);
        } catch (err) {
          console.error("Secure fetch failed:", err);
          setSecureObjectUrl('');
        }
      } else {
        setSecureObjectUrl(source); // data url
      }
    };

    fetchSecureFile();
    
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [activeRecord]);

  // ── Multi-layer Anti-Screenshot Protection ──
  useEffect(() => {
    // 1. Disable right-click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // 2. Block keyboard shortcuts used to screenshot / save / inspect
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen key → wipe clipboard immediately
      if (e.key === 'PrintScreen') {
        navigator.clipboard.writeText('');
        setIsBlurred(true);
        setTimeout(() => setIsBlurred(false), 1500);
        return;
      }
      // Windows Snipping Tool: Win+Shift+S (fires as Meta+Shift+s)
      if (e.metaKey && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        return;
      }
      // Ctrl/Cmd combinations: P (print), S (save), U (view source), Shift+I (devtools), Shift+J, F12
      if ((e.ctrlKey || e.metaKey) && ['p', 's', 'u'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        return;
      }
      if (e.key === 'F12') {
        e.preventDefault();
        return;
      }
    };

    // 3. Blur content when window loses focus (catches Snipping Tool, Alt+Tab screenshots)
    const handleBlur = () => setIsBlurred(true);
    const handleFocus = () => setIsBlurred(false);

    // 4. Blur content when browser tab is hidden
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setIsBlurred(true);
      } else {
        setIsBlurred(false);
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const renderFilePreview = (record: any) => {
    // If no file present, return info
    if (!record.fileUrl && !record.fileData) {
      return (
         <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
           <FileText className="w-16 h-16 text-gray-300 mb-4" />
           <p className="font-medium text-lg">Text Only Record</p>
           <p className="text-sm mt-2 max-w-sm text-center">There are no physical attachments for this record. See the diagnosis notes below.</p>
         </div>
      );
    }
    
    // Determine base file URL, since backend stores relative '/api/emr/files/...' strings
    const fileSource = secureObjectUrl || record.fileData;
    if (!fileSource) return null;
    
    // Original path to guess extension
    const originalPath = record.fileUrl || "";
    const extension = originalPath?.split('.').pop()?.toLowerCase() || '';

    // Is it an image?
    if (['jpg','jpeg','png','gif','webp'].includes(extension) || fileSource.startsWith("data:image")) {
      return (
        <div className="relative w-full h-full rounded-xl overflow-hidden bg-black flex items-center justify-center">
            {/* The pointer-events-none makes it impossible to drag the image out */}
            <img 
              src={fileSource} 
              alt="Medical Record Attachment" 
              className="max-w-full max-h-full object-contain pointer-events-none select-none" 
              onDragStart={(e) => e.preventDefault()}
            />
            <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center shadow-lg backdrop-blur-md">
              <ShieldAlert className="w-3 h-3 mr-2" /> AES-256 Encrypted
            </div>
        </div>
      );
    }
    
    // Is it a Text or PDF?
    if (['txt', 'pdf'].includes(extension) || fileSource.startsWith("data:application/pdf") || fileSource.startsWith("blob:")) {
      return (
        <div className="w-full h-full bg-gray-100 rounded-xl overflow-hidden relative">
            <object 
              data={`${fileSource}#toolbar=0&navpanes=0&scrollbar=0`} // Disables native PDF toolbars which have download buttons!
              type="application/pdf"
              className="w-full h-full"
            >
              <p className="p-4 text-gray-600">Your browser does not support rendering this secure file natively without downloading. Viewing restricted.</p>
            </object>
            
            {/* Transparent overlay over the edges to block right clicking over the iframe/object padding! */}
            <div className="absolute inset-x-0 top-0 h-10 bg-transparent z-10" onContextMenu={(e) => e.preventDefault()} />
        </div>
      );
    }
    
    // Fallback for unknown
    return (
       <div className="flex flex-col items-center justify-center p-12 bg-green-50 rounded-2xl text-center">
         <Info className="w-12 h-12 text-green-600 mb-4" />
         <p className="font-semibold text-green-900">Secure Attachment Locked</p>
         <p className="text-sm text-green-700 mt-2">This native extension cannot be previewed in the secure envelope. To enforce No-Download rules, access is visually restricted.</p>
       </div>
    );
  };

  return (
    <div
      className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full flex flex-col md:flex-row overflow-hidden border border-gray-100 min-h-[600px] max-h-[85vh] text-[#333] select-none"
      style={{ filter: isBlurred ? 'blur(20px)' : 'none', transition: 'filter 0.2s ease' }}
    >
      
      {/* Sidebar - Historical Records List */}
      <div className="w-full md:w-1/3 bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden">
        <div className="p-6 bg-white border-b border-gray-200">
           <h2 className="text-2xl font-bold text-green-900 flex items-center">
             View Records
           </h2>
           <p className="text-sm text-gray-500 mt-1">Select a record to securely preview it.</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-green-200 scrollbar-track-transparent">
          {records.length === 0 ? (
             <div className="text-center py-10 text-gray-400">
               <DownloadCloud className="w-10 h-10 mx-auto text-gray-300 mb-3" />
               <p>No historical records securely found for this patient.</p>
             </div>
          ) : (
            records.map((rec, i) => (
              <div 
                key={i} 
                onClick={() => setActiveRecord(rec)}
                className={`p-4 rounded-xl cursor-pointer border-2 transition-all duration-300 
                  ${activeRecord?._id === rec._id ? "border-green-500 bg-green-50/50 shadow-md" : "border-transparent bg-white hover:border-green-200 hover:shadow-sm"}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-gray-800 text-sm">{rec.title || 'Extracted Record'}</span>
                  <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider bg-green-100 px-2 py-0.5 rounded-full">{rec.type}</span>
                </div>
                <div className="mt-3 text-[10px] text-gray-400 flex justify-between">
                  <span>{new Date(rec.createdAt).toLocaleDateString()}</span>
                  <span>{new Date(rec.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
        

      </div>

      {/* Main Secure Viewing Stage */}
      <div className="w-full md:w-2/3 p-6 flex flex-col bg-white overflow-y-auto">
        {activeRecord ? (
          <>
            <div className="mb-4 flex justify-between items-end border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">{activeRecord.title}</h3>
              </div>
            </div>
            
            <div className="flex-1 rounded-2xl overflow-hidden shadow-inner p-2 bg-gray-50 border border-gray-200 relative group">
              {renderFilePreview(activeRecord)}

              {/* Dense tiled watermark — makes screenshots clearly identifiable */}
              <div
                className="pointer-events-none absolute inset-0 overflow-hidden"
                style={{ zIndex: 10 }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `repeating-linear-gradient(
                      -45deg,
                      transparent,
                      transparent 60px,
                      rgba(0,0,0,0.03) 60px,
                      rgba(0,0,0,0.03) 61px
                    )`,
                  }}
                />
                {/* Repeating text watermark grid */}
                <div className="absolute inset-0 flex flex-wrap content-start gap-x-8 gap-y-10 p-4 overflow-hidden">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap opacity-20 rotate-[-30deg] select-none"
                    >
                      CONFIDENTIAL · LAKWEDHA
                    </span>
                  ))}
                </div>
              </div>
            </div>
            

          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center h-full text-center p-12">
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
              <ShieldAlert className="w-12 h-12 text-green-300" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Vault is Secured</h3>
            <p className="text-gray-500 max-w-sm leading-relaxed">Select any historical file from the left drawer to safely decrypt and examine it on-screen.</p>
          </div>
        )}
      </div>

    </div>
  );
}
