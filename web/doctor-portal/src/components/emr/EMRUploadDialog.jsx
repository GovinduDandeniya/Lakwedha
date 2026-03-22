import { useState, useRef, useCallback } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Typography, TextField, Select, MenuItem,
    FormControl, InputLabel, Tabs, Tab, CircularProgress,
    Chip, IconButton, Alert, Divider, Paper,
} from '@mui/material';
import {
    CloudUpload, CameraAlt, TextFields, Close, FolderOpen,
    MedicalServices, FlipCameraAndroid, CheckCircle,
} from '@mui/icons-material';
import api from '../../services/api';

const RECORD_TYPES = [
    { value: 'prescription',  label: 'Prescription'  },
    { value: 'file',          label: 'Lab Report'    },
    { value: 'medical_record',label: 'Medical Record'},
    { value: 'text',          label: 'Diagnosis Note'},
];

const buildDisplayName = (apt) => {
    if (apt?.patientTitle && apt?.patientFirstName && apt?.patientLastName)
        return `${apt.patientTitle} ${apt.patientFirstName} ${apt.patientLastName}`;
    return apt?.patientDisplayName || apt?.patientName || 'Patient';
};

/* ── Camera Tab ──────────────────────────────────────────────────────────────── */
const CameraTab = ({ onCapture }) => {
    const videoRef   = useRef(null);
    const canvasRef  = useRef(null);
    const streamRef  = useRef(null);
    const [active,   setActive]   = useState(false);
    const [captured, setCaptured] = useState(null);
    const [err,      setErr]      = useState('');

    const startCamera = useCallback(async () => {
        setErr('');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            streamRef.current = stream;
            videoRef.current.srcObject = stream;
            setActive(true);
            setCaptured(null);
            onCapture(null);
        } catch {
            setErr('Camera access denied. Please allow camera permission and try again.');
        }
    }, [onCapture]);

    const stopCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        setActive(false);
    }, []);

    const captureImage = useCallback(() => {
        const canvas  = canvasRef.current;
        const video   = videoRef.current;
        canvas.width  = video.videoWidth  || 640;
        canvas.height = video.videoHeight || 480;
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setCaptured(dataUrl);
        stopCamera();

        // Convert dataURL → File for form upload
        canvas.toBlob((blob) => {
            const file = new File([blob], `camera-capture-${Date.now()}.png`, { type: 'image/png' });
            onCapture(file);
        }, 'image/png');
    }, [stopCamera, onCapture]);

    const retake = () => { setCaptured(null); onCapture(null); startCamera(); };

    return (
        <Box>
            {err && <Alert severity="error" sx={{ mb: 1.5, fontSize: 13 }}>{err}</Alert>}

            <Box sx={{
                position: 'relative', width: '100%', aspectRatio: '4/3',
                bgcolor: '#000', borderRadius: 2, overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                {captured ? (
                    <img src={captured} alt="Captured" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: active ? 'block' : 'none' }}
                    />
                )}
                {!active && !captured && (
                    <Box sx={{ textAlign: 'center', color: '#888' }}>
                        <CameraAlt sx={{ fontSize: 48, mb: 1 }} />
                        <Typography variant="body2">Camera not started</Typography>
                    </Box>
                )}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
            </Box>

            <Box sx={{ display: 'flex', gap: 1, mt: 1.5, justifyContent: 'center' }}>
                {!active && !captured && (
                    <Button variant="contained" startIcon={<CameraAlt />} onClick={startCamera}
                        sx={{ bgcolor: '#1565C0', '&:hover': { bgcolor: '#0D47A1' }, borderRadius: 2 }}>
                        Start Camera
                    </Button>
                )}
                {active && (
                    <>
                        <Button variant="contained" startIcon={<CameraAlt />} onClick={captureImage}
                            sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' }, borderRadius: 2 }}>
                            Capture
                        </Button>
                        <Button variant="outlined" onClick={stopCamera}
                            sx={{ borderRadius: 2, color: '#C62828', borderColor: '#EF9A9A' }}>
                            Cancel
                        </Button>
                    </>
                )}
                {captured && (
                    <>
                        <Chip icon={<CheckCircle />} label="Image captured" color="success" variant="outlined" />
                        <Button variant="outlined" startIcon={<FlipCameraAndroid />} onClick={retake}
                            sx={{ borderRadius: 2 }}>
                            Retake
                        </Button>
                    </>
                )}
            </Box>
        </Box>
    );
};

/* ── File Upload Tab ─────────────────────────────────────────────────────────── */
const FileTab = ({ onFile }) => {
    const [file, setFile] = useState(null);
    const inputRef = useRef(null);

    const handleChange = (e) => {
        const f = e.target.files?.[0] || null;
        setFile(f);
        onFile(f);
    };

    return (
        <Box>
            <Paper
                variant="outlined"
                onClick={() => inputRef.current?.click()}
                sx={{
                    borderRadius: 2, border: '2px dashed #BDBDBD', p: 4,
                    textAlign: 'center', cursor: 'pointer',
                    '&:hover': { borderColor: '#2E7D32', bgcolor: '#F1F8F1' },
                    transition: 'all 0.2s',
                }}
            >
                <FolderOpen sx={{ fontSize: 40, color: '#E65100', mb: 1 }} />
                <Typography variant="body2" fontWeight={600}>Click to browse files</Typography>
                <Typography variant="caption" color="text.secondary">
                    Supports: JPG, PNG, PDF, TXT — Max 10 MB
                </Typography>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*,.pdf,.txt"
                    style={{ display: 'none' }}
                    onChange={handleChange}
                />
            </Paper>

            {file && (
                <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle sx={{ color: '#2E7D32', fontSize: 18 }} />
                    <Typography variant="body2" fontWeight={600} noWrap>{file.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                        ({(file.size / 1024).toFixed(1)} KB)
                    </Typography>
                    <IconButton size="small" onClick={() => { setFile(null); onFile(null); }}>
                        <Close fontSize="small" />
                    </IconButton>
                </Box>
            )}
        </Box>
    );
};

/* ── Text Tab ────────────────────────────────────────────────────────────────── */
const TextTab = ({ diagnosis, setDiagnosis, notes, setNotes }) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
            label="Diagnosis"
            multiline
            rows={3}
            value={diagnosis}
            onChange={e => setDiagnosis(e.target.value)}
            placeholder="Enter diagnosis details..."
            fullWidth
            size="small"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
        <TextField
            label="Notes / Prescription"
            multiline
            rows={4}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Enter medical notes, prescriptions, or treatment plan..."
            fullWidth
            size="small"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
    </Box>
);

/* ── Main Dialog ─────────────────────────────────────────────────────────────── */
const EMRUploadDialog = ({ open, appointment, onClose, onSuccess }) => {
    const [tab,        setTab]        = useState(0);
    const [recordType, setRecordType] = useState('file');
    const [title,      setTitle]      = useState('');
    const [diagnosis,  setDiagnosis]  = useState('');
    const [notes,      setNotes]      = useState('');
    const [camFile,    setCamFile]    = useState(null);
    const [uploadFile, setUploadFile] = useState(null);
    const [loading,    setLoading]    = useState(false);
    const [error,      setError]      = useState('');
    const [success,    setSuccess]    = useState(false);

    const patientName = buildDisplayName(appointment);
    const patientId   = appointment?.patientId;

    const reset = () => {
        setTab(0); setRecordType('file'); setTitle('');
        setDiagnosis(''); setNotes(''); setCamFile(null);
        setUploadFile(null); setLoading(false); setError(''); setSuccess(false);
    };

    const handleClose = () => { reset(); onClose(); };

    const handleSubmit = async () => {
        setError('');
        if (!patientId) { setError('No patient linked to this appointment.'); return; }

        const fileToUpload = tab === 0 ? camFile : tab === 1 ? uploadFile : null;
        const hasText      = diagnosis.trim() || notes.trim();

        if (!fileToUpload && !hasText) {
            setError('Please capture an image, select a file, or enter text before uploading.');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('patientId',    patientId);
            formData.append('type',         recordType);
            formData.append('title',        title.trim() || recordType);
            formData.append('uploadedDate', new Date().toISOString().slice(0, 10));

            if (appointment?.id)      formData.append('appointmentId', appointment.id);
            if (diagnosis.trim())     formData.append('diagnosis',     diagnosis.trim());
            if (notes.trim())         formData.append('notes',         notes.trim());
            if (fileToUpload)         formData.append('file',          fileToUpload);

            await api.post('/emr/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setSuccess(true);
            setTimeout(() => { handleClose(); onSuccess?.(); }, 1400);
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.message || 'Upload failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={loading ? undefined : handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: { borderRadius: 3 } }}
        >
            {/* Title */}
            <DialogTitle sx={{ pb: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MedicalServices sx={{ color: '#E65100', fontSize: 22 }} />
                    <Box>
                        <Typography variant="h6" fontWeight={700} fontSize={16}>Upload Medical Record</Typography>
                        <Typography variant="caption" color="text.secondary">{patientName}</Typography>
                    </Box>
                </Box>
                {!loading && (
                    <IconButton size="small" onClick={handleClose}>
                        <Close fontSize="small" />
                    </IconButton>
                )}
            </DialogTitle>

            <Divider sx={{ mt: 1.5 }} />

            <DialogContent sx={{ pt: 2 }}>
                {success ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <CheckCircle sx={{ fontSize: 56, color: '#2E7D32', mb: 1 }} />
                        <Typography variant="h6" fontWeight={700} color="#2E7D32">Record Uploaded</Typography>
                        <Typography variant="body2" color="text.secondary">Encrypted and saved securely.</Typography>
                    </Box>
                ) : (
                    <>
                        {error && <Alert severity="error" sx={{ mb: 2, fontSize: 13 }}>{error}</Alert>}

                        {/* Metadata row */}
                        <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5 }}>
                            <TextField
                                label="Record Title"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="e.g. Blood Test Results"
                                size="small"
                                sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                            <FormControl size="small" sx={{ minWidth: 160 }}>
                                <InputLabel>Type</InputLabel>
                                <Select
                                    value={recordType}
                                    label="Type"
                                    onChange={e => setRecordType(e.target.value)}
                                    sx={{ borderRadius: 2 }}
                                >
                                    {RECORD_TYPES.map(r => (
                                        <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Input method tabs */}
                        <Tabs
                            value={tab}
                            onChange={(_, v) => setTab(v)}
                            variant="fullWidth"
                            TabIndicatorProps={{ style: { backgroundColor: '#2E7D32', height: 3 } }}
                            sx={{ mb: 2, borderBottom: '1px solid #F0F0F0' }}
                        >
                            <Tab
                                icon={<CameraAlt fontSize="small" />}
                                iconPosition="start"
                                label="Camera"
                                sx={{ textTransform: 'none', fontWeight: 600, fontSize: 13, minHeight: 44 }}
                            />
                            <Tab
                                icon={<CloudUpload fontSize="small" />}
                                iconPosition="start"
                                label="File Upload"
                                sx={{ textTransform: 'none', fontWeight: 600, fontSize: 13, minHeight: 44 }}
                            />
                            <Tab
                                icon={<TextFields fontSize="small" />}
                                iconPosition="start"
                                label="Text Input"
                                sx={{ textTransform: 'none', fontWeight: 600, fontSize: 13, minHeight: 44 }}
                            />
                        </Tabs>

                        {tab === 0 && <CameraTab onCapture={setCamFile} />}
                        {tab === 1 && <FileTab onFile={setUploadFile} />}
                        {tab === 2 && (
                            <TextTab
                                diagnosis={diagnosis} setDiagnosis={setDiagnosis}
                                notes={notes}         setNotes={setNotes}
                            />
                        )}
                    </>
                )}
            </DialogContent>

            {!success && (
                <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                    <Button
                        onClick={handleClose}
                        disabled={loading}
                        variant="outlined"
                        sx={{ borderRadius: 2, borderColor: '#ddd', color: '#555' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        variant="contained"
                        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <CloudUpload />}
                        sx={{
                            borderRadius: 2, bgcolor: '#E65100',
                            '&:hover': { bgcolor: '#BF360C' },
                            minWidth: 140,
                        }}
                    >
                        {loading ? 'Uploading…' : 'Upload Record'}
                    </Button>
                </DialogActions>
            )}
        </Dialog>
    );
};

export default EMRUploadDialog;
