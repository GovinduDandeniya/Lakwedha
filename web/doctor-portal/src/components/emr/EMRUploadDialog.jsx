import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Typography, Button, TextField, Tabs, Tab,
    CircularProgress, Alert, IconButton, Chip, Divider,
    Paper, LinearProgress,
} from '@mui/material';
import {
    CameraAlt, CloudUpload, Notes, Close, CheckCircle,
    Description, Event, Person,
    PhotoCamera, Replay, Lock,
} from '@mui/icons-material';
import emrApi from '../../services/emrApi';

// ── Theme ─────────────────────────────────────────────────────────────────────
const BLUE   = '#1565C0';
const GREEN  = '#2E7D32';
const PURPLE = '#6A1B9A';

// ── Tab Panel helper ──────────────────────────────────────────────────────────
const TabPanel = ({ children, value, index }) =>
    value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;

// ── Secure Image Preview (no right-click / drag) ──────────────────────────────
const SecurePreview = ({ src, alt = 'Preview', height = 260 }) => (
    <Box
        sx={{
            position: 'relative',
            width: '100%',
            borderRadius: 2,
            overflow: 'hidden',
            border: '1.5px solid #90CAF9',
            userSelect: 'none',
            WebkitUserSelect: 'none',
        }}
        onContextMenu={e => e.preventDefault()}
        onDragStart={e => e.preventDefault()}
    >
        <Box
            component="img"
            src={src}
            alt={alt}
            sx={{
                width: '100%',
                maxHeight: height,
                objectFit: 'contain',
                display: 'block',
                pointerEvents: 'none',
            }}
            draggable={false}
        />
        {/* Invisible overlay blocks DevTools screenshot shortcut */}
        <Box sx={{
            position: 'absolute', inset: 0,
            background: 'transparent',
            zIndex: 1,
        }} />
        <Chip
            icon={<Lock sx={{ fontSize: 11 }} />}
            label="Secure Preview"
            size="small"
            sx={{
                position: 'absolute', bottom: 8, right: 8,
                fontSize: 10, height: 20,
                bgcolor: 'rgba(0,0,0,0.55)', color: '#fff',
                zIndex: 2,
            }}
        />
    </Box>
);

// ── Main Component ────────────────────────────────────────────────────────────
const EMRUploadDialog = ({
    open,
    onClose,
    patientId,
    patientName,
    appointmentId,
    appointmentNumber,
}) => {
    const [tab, setTab]               = useState(0); // 0=Camera 1=File 2=Text
    const [title, setTitle]           = useState('');
    const [text, setText]             = useState('');
    const [file, setFile]             = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [cameraActive, setCameraActive]   = useState(false);
    const [cameraError, setCameraError]     = useState('');
    const [uploading, setUploading]   = useState(false);
    const [progress, setProgress]     = useState(0);
    const [error, setError]           = useState('');
    const [success, setSuccess]       = useState('');

    const videoRef  = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const fileInputRef = useRef(null);

    // ── Reset on open ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (open) {
            setTab(0);
            setTitle('');
            setText('');
            setFile(null);
            setFilePreview(null);
            setCapturedImage(null);
            setCameraActive(false);
            setCameraError('');
            setError('');
            setSuccess('');
            setProgress(0);
        } else {
            stopCamera();
        }
    }, [open]);

    // ── Stop camera when switching away from Camera tab ───────────────────────
    useEffect(() => {
        if (tab !== 0) stopCamera();
    }, [tab]);

    // ── Attach stream to video element once it is in the DOM ─────────────────
    useEffect(() => {
        if (cameraActive && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
            videoRef.current.play().catch(() => {});
        }
    }, [cameraActive]);

    // ── Camera helpers ────────────────────────────────────────────────────────
    const startCamera = useCallback(async () => {
        setCameraError('');
        setCapturedImage(null);
        try {
            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
                    audio: false,
                });
            } catch {
                stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            }
            streamRef.current = stream;
            setCameraActive(true); // triggers re-render → video element mounts → useEffect assigns srcObject
        } catch (err) {
            setCameraError(
                err.name === 'NotAllowedError'
                    ? 'Camera permission denied. Please allow camera access in your browser and try again.'
                    : 'Camera not available. Please check your device and try again.'
            );
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        setCameraActive(false);
    }, []);

    const capturePhoto = useCallback(() => {
        const video  = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;
        canvas.width  = video.videoWidth  || 1280;
        canvas.height = video.videoHeight || 720;
        canvas.getContext('2d').drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        setCapturedImage(dataUrl);
        stopCamera();
    }, [stopCamera]);

    // ── File helpers ──────────────────────────────────────────────────────────
    const handleFileChange = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setFile(f);
        setError('');
        if (f.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (ev) => setFilePreview(ev.target.result);
            reader.readAsDataURL(f);
        } else {
            setFilePreview(null);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0];
        if (f) {
            setFile(f);
            if (f.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (ev) => setFilePreview(ev.target.result);
                reader.readAsDataURL(f);
            }
        }
    };

    // ── Convert base64 data-URL to File ──────────────────────────────────────
    const dataUrlToFile = (dataUrl, filename) => {
        const [header, base64] = dataUrl.split(',');
        const mime   = header.match(/:(.*?);/)[1];
        const binary = atob(base64);
        const arr    = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
        return new File([arr], filename, { type: mime });
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!patientId) { setError('No patient linked to this upload.'); return; }

        const uploadDate  = new Date().toISOString().slice(0, 10);
        const typeLabel   = ['Camera Photo', 'File', 'Text Note'][tab];
        const finalTitle  = title.trim() || `${typeLabel} — ${uploadDate}`;

        // Validate per tab
        if (tab === 0 && !capturedImage) { setError('Please capture a photo first.'); return; }
        if (tab === 1 && !file)          { setError('Please select a file to upload.'); return; }
        if (tab === 2 && !text.trim())   { setError('Please enter some text or prescription notes.'); return; }

        setError('');
        setUploading(true);
        setProgress(10);

        try {
            const formData = new FormData();
            formData.append('patientId',    String(patientId));
            formData.append('title',        finalTitle);
            formData.append('type',         ['camera', 'file', 'text'][tab]);
            formData.append('uploadedDate', uploadDate);
            if (appointmentId) formData.append('appointmentId', String(appointmentId));

            setProgress(30);

            if (tab === 0) {
                // Camera — convert dataURL to JPEG file
                const imgFile = dataUrlToFile(capturedImage, `photo_${Date.now()}.jpg`);
                formData.append('file', imgFile);
            } else if (tab === 1) {
                formData.append('file', file);
            } else {
                // Text — send as plain-text file
                const blob    = new Blob([text], { type: 'text/plain' });
                const txtFile = new File([blob], `note_${Date.now()}.txt`, { type: 'text/plain' });
                formData.append('file', txtFile);
            }

            setProgress(60);
            await emrApi.upload(formData);
            setProgress(100);
            setSuccess(`Record saved successfully for ${patientName} on ${uploadDate}`);

            // Reset fields but keep dialog open to show success
            setTitle('');
            setText('');
            setFile(null);
            setFilePreview(null);
            setCapturedImage(null);
        } catch (err) {
            setError(err.message || 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        stopCamera();
        onClose();
    };

    const uploadDate = new Date().toISOString().slice(0, 10);

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
        >
            {/* ── Header ── */}
            <DialogTitle sx={{ p: 0 }}>
                <Box sx={{
                    background: `linear-gradient(135deg, ${BLUE}, #1976D2)`,
                    px: 3, py: 2,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{
                            width: 40, height: 40, borderRadius: 2,
                            bgcolor: 'rgba(255,255,255,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Description sx={{ color: '#fff', fontSize: 22 }} />
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight={800} color="#fff">
                                Upload Medical Record
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                Encrypted &amp; secured storage
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={handleClose} size="small" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        <Close />
                    </IconButton>
                </Box>

                {/* Patient + Appointment info strip */}
                <Box sx={{
                    px: 3, py: 1.5,
                    bgcolor: '#F0F4FF',
                    borderBottom: '1px solid #E3E8F0',
                    display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <Person sx={{ fontSize: 16, color: BLUE }} />
                        <Typography variant="body2" fontWeight={700} color={BLUE}>
                            {patientName || 'Unknown Patient'}
                        </Typography>
                    </Box>
                    {appointmentNumber && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                            <Event sx={{ fontSize: 16, color: PURPLE }} />
                            <Typography variant="body2" fontWeight={600} color={PURPLE}>
                                Appointment #{appointmentNumber}
                            </Typography>
                        </Box>
                    )}
                    <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Lock sx={{ fontSize: 13, color: '#888' }} />
                        <Typography variant="caption" color="text.secondary">{uploadDate}</Typography>
                    </Box>
                </Box>
            </DialogTitle>

            {/* ── Upload progress bar ── */}
            {uploading && (
                <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{ height: 3, bgcolor: '#E3F2FD', '& .MuiLinearProgress-bar': { bgcolor: BLUE } }}
                />
            )}

            <DialogContent sx={{ pt: 2, pb: 1 }}>
                {/* Title field */}
                <TextField
                    label="Record Title (optional)"
                    fullWidth
                    size="small"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder={`e.g. Blood Test Results, X-Ray, Prescription — ${uploadDate}`}
                    sx={{ mb: 2 }}
                    disabled={uploading}
                />

                {/* ── Tab selector ── */}
                <Tabs
                    value={tab}
                    onChange={(_, v) => { setTab(v); setError(''); setSuccess(''); }}
                    sx={{
                        mb: 0,
                        borderBottom: '1px solid #E8EDF2',
                        '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 44, fontSize: 13 },
                        '& .Mui-selected': { color: BLUE },
                    }}
                    TabIndicatorProps={{ sx: { bgcolor: BLUE } }}
                >
                    <Tab icon={<PhotoCamera fontSize="small" />} iconPosition="start" label="Camera"      disabled={uploading} />
                    <Tab icon={<CloudUpload  fontSize="small" />} iconPosition="start" label="File Upload" disabled={uploading} />
                    <Tab icon={<Notes        fontSize="small" />} iconPosition="start" label="Text / Rx"   disabled={uploading} />
                </Tabs>

                {/* ── TAB 0: Camera ── */}
                <TabPanel value={tab} index={0}>
                    <canvas ref={canvasRef} style={{ display: 'none' }} />

                    {cameraError && (
                        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2, fontSize: 13 }}>
                            {cameraError}
                        </Alert>
                    )}

                    {capturedImage ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <SecurePreview src={capturedImage} alt="Captured photo" />
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                <Button
                                    startIcon={<Replay />}
                                    variant="outlined"
                                    size="small"
                                    onClick={() => { setCapturedImage(null); startCamera(); }}
                                    sx={{ textTransform: 'none', borderColor: BLUE, color: BLUE }}
                                    disabled={uploading}
                                >
                                    Retake
                                </Button>
                                <Chip
                                    icon={<CheckCircle sx={{ fontSize: 14 }} />}
                                    label="Photo ready to upload"
                                    size="small"
                                    sx={{ bgcolor: '#E8F5E9', color: GREEN, fontWeight: 600 }}
                                />
                            </Box>
                        </Box>
                    ) : cameraActive ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: 'center' }}>
                            <Box sx={{
                                width: '100%', borderRadius: 2, overflow: 'hidden',
                                border: `2px solid ${BLUE}`, bgcolor: '#000',
                            }}>
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    style={{ width: '100%', maxHeight: 300, objectFit: 'cover', display: 'block' }}
                                />
                            </Box>
                            <Button
                                variant="contained"
                                startIcon={<CameraAlt />}
                                onClick={capturePhoto}
                                sx={{
                                    bgcolor: BLUE, '&:hover': { bgcolor: '#0D47A1' },
                                    textTransform: 'none', fontWeight: 700, px: 4,
                                }}
                                disabled={uploading}
                            >
                                Capture Photo
                            </Button>
                        </Box>
                    ) : (
                        <Box
                            onClick={startCamera}
                            sx={{
                                height: 200, border: `2px dashed ${BLUE}`, borderRadius: 2,
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                gap: 1.5, bgcolor: '#F0F4FF', cursor: 'pointer',
                                transition: 'all 0.15s',
                                '&:hover': { bgcolor: '#E3EEFF', borderColor: '#0D47A1' },
                            }}
                        >
                            <Box sx={{
                                width: 64, height: 64, borderRadius: '50%',
                                bgcolor: `${BLUE}18`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <CameraAlt sx={{ fontSize: 34, color: BLUE }} />
                            </Box>
                            <Typography variant="body2" fontWeight={700} color={BLUE}>
                                Click to Start Camera
                            </Typography>
                            <Typography variant="caption" color="text.secondary" textAlign="center">
                                Browser will ask for camera permission.<br />
                                Works with webcam and mobile cameras.
                            </Typography>
                        </Box>
                    )}
                </TabPanel>

                {/* ── TAB 1: File Upload ── */}
                <TabPanel value={tab} index={1}>
                    <Box
                        onDrop={handleDrop}
                        onDragOver={e => e.preventDefault()}
                        onClick={() => fileInputRef.current?.click()}
                        sx={{
                            border: `2px dashed ${file ? GREEN : '#90CAF9'}`,
                            borderRadius: 2, p: 3, cursor: 'pointer',
                            bgcolor: file ? '#F0FFF4' : '#F8FBFF',
                            textAlign: 'center',
                            transition: 'all 0.15s',
                            '&:hover': { bgcolor: file ? '#E8F5E9' : '#E8F3FF' },
                        }}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            hidden
                            accept="image/*,application/pdf,.doc,.docx,.txt"
                            onChange={handleFileChange}
                        />
                        {file ? (
                            <>
                                <CheckCircle sx={{ fontSize: 40, color: GREEN, mb: 1 }} />
                                <Typography variant="body2" fontWeight={700} color={GREEN}>
                                    {file.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {(file.size / 1024).toFixed(1)} KB — click to change
                                </Typography>
                            </>
                        ) : (
                            <>
                                <CloudUpload sx={{ fontSize: 40, color: '#90CAF9', mb: 1 }} />
                                <Typography variant="body2" fontWeight={700}>
                                    Click or drag a file here
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    PDF, Image (JPG/PNG), Word, or Text file
                                </Typography>
                            </>
                        )}
                    </Box>

                    {/* Image preview */}
                    {filePreview && (
                        <Box sx={{ mt: 2 }}>
                            <SecurePreview src={filePreview} alt="File preview" height={200} />
                        </Box>
                    )}

                    {/* PDF / doc indicator */}
                    {file && !filePreview && (
                        <Paper elevation={0} sx={{
                            mt: 2, p: 2, borderRadius: 2, bgcolor: '#F8FAF8',
                            border: '1px solid #E0EFE0',
                            display: 'flex', alignItems: 'center', gap: 1.5,
                        }}>
                            <Description sx={{ color: PURPLE, fontSize: 28 }} />
                            <Box>
                                <Typography variant="body2" fontWeight={700}>{file.name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {file.type || 'Document'} · {(file.size / 1024).toFixed(1)} KB
                                </Typography>
                            </Box>
                        </Paper>
                    )}
                </TabPanel>

                {/* ── TAB 2: Text / Prescription ── */}
                <TabPanel value={tab} index={2}>
                    <TextField
                        label="Medical Notes / Prescription"
                        multiline
                        rows={7}
                        fullWidth
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder={`Write diagnosis, prescription, dosage instructions, clinical notes…\n\nPatient: ${patientName}\nDate: ${uploadDate}`}
                        size="small"
                        disabled={uploading}
                        InputProps={{ sx: { fontFamily: 'monospace', fontSize: 13, lineHeight: 1.7 } }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {text.length} characters · Saved as encrypted text file
                    </Typography>
                </TabPanel>

                {/* ── Feedback ── */}
                {error && (
                    <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}
                {success && (
                    <Alert
                        severity="success"
                        icon={<CheckCircle />}
                        sx={{ mt: 2, borderRadius: 2, fontWeight: 600 }}
                    >
                        {success}
                    </Alert>
                )}
            </DialogContent>

            <Divider />

            {/* ── Actions ── */}
            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
                <Button
                    onClick={handleClose}
                    sx={{ textTransform: 'none', fontWeight: 600, color: '#666' }}
                    disabled={uploading}
                >
                    {success ? 'Close' : 'Cancel'}
                </Button>

                {!success && (
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={uploading}
                        startIcon={
                            uploading
                                ? <CircularProgress size={16} color="inherit" />
                                : <CloudUpload />
                        }
                        sx={{
                            bgcolor: BLUE,
                            '&:hover': { bgcolor: '#0D47A1' },
                            textTransform: 'none',
                            fontWeight: 700,
                            borderRadius: 2,
                            px: 3,
                            minWidth: 140,
                        }}
                    >
                        {uploading ? `Uploading… ${progress}%` : 'Save Record'}
                    </Button>
                )}

                {success && (
                    <Button
                        variant="outlined"
                        onClick={() => { setSuccess(''); setTab(0); }}
                        sx={{ textTransform: 'none', fontWeight: 600, borderColor: BLUE, color: BLUE }}
                    >
                        Upload Another
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default EMRUploadDialog;
