import { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Box, Typography, Chip, CircularProgress, Divider, IconButton,
    Alert, Paper, Tooltip,
} from '@mui/material';
import {
    FolderOpen, Close, MedicalServices, Description,
    OpenInNew, CalendarToday, Person,
} from '@mui/icons-material';
import api from '../../services/api';

const TYPE_CONFIG = {
    prescription:   { label: 'Prescription',   color: '#1565C0', bg: '#E3F2FD' },
    file:           { label: 'Lab Report',      color: '#6A1B9A', bg: '#F3E5F5' },
    medical_record: { label: 'Medical Record',  color: '#E65100', bg: '#FFF3E0' },
    text:           { label: 'Diagnosis Note',  color: '#2E7D32', bg: '#E8F5E9' },
    camera:         { label: 'Camera Capture',  color: '#00695C', bg: '#E0F2F1' },
};

const buildDisplayName = (apt) => {
    if (apt?.patientTitle && apt?.patientFirstName && apt?.patientLastName)
        return `${apt.patientTitle} ${apt.patientFirstName} ${apt.patientLastName}`;
    return apt?.patientDisplayName || apt?.patientName || 'Patient';
};

const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
        });
    } catch { return dateStr; }
};

/* ── Single record card ──────────────────────────────────────────────────────── */
const RecordCard = ({ record }) => {
    const cfg   = TYPE_CONFIG[record.type] || TYPE_CONFIG.file;
    const date  = formatDate(record.uploadedDate || record.createdAt);
    const hasFile = Boolean(record.fileUrl);

    const openFile = async () => {
        const filename = record.fileUrl?.split('/').pop();
        if (!filename) return;

        try {
            const res = await api.get(`/emr/files/${filename}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(res.data);
            window.open(url, '_blank', 'noopener');
            // Cleanup object URL after opening.
            setTimeout(() => window.URL.revokeObjectURL(url), 10000);
        } catch {
            // Keep this intentionally silent to preserve existing dialog UX.
        }
    };

    return (
        <Paper variant="outlined" sx={{ borderRadius: 2, p: 2, mb: 1.5 }}>
            {/* Header row */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                        label={cfg.label}
                        size="small"
                        sx={{
                            bgcolor: cfg.bg, color: cfg.color,
                            fontWeight: 700, fontSize: 11, height: 22,
                            border: `1px solid ${cfg.color}44`,
                        }}
                    />
                    {record.title && (
                        <Typography variant="body2" fontWeight={700}>{record.title}</Typography>
                    )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1, flexShrink: 0 }}>
                    <CalendarToday sx={{ fontSize: 12, color: '#aaa' }} />
                    <Typography variant="caption" color="text.secondary">{date}</Typography>
                </Box>
            </Box>

            {/* Doctor info if populated */}
            {record.doctorId?.name && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                    <Person sx={{ fontSize: 13, color: '#aaa' }} />
                    <Typography variant="caption" color="text.secondary">
                        Dr. {record.doctorId.name}
                    </Typography>
                </Box>
            )}

            {/* Decrypted text fields */}
            {record.diagnosis && (
                <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" fontWeight={700} color="#1565C0"
                        sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
                        Diagnosis
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.3, whiteSpace: 'pre-wrap' }}>
                        {record.diagnosis}
                    </Typography>
                </Box>
            )}
            {record.treatment && (
                <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" fontWeight={700} color="#2E7D32"
                        sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
                        Treatment
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.3, whiteSpace: 'pre-wrap' }}>
                        {record.treatment}
                    </Typography>
                </Box>
            )}
            {record.notes && (
                <Box sx={{ mb: hasFile ? 1 : 0 }}>
                    <Typography variant="caption" fontWeight={700} color="#E65100"
                        sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
                        Notes
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.3, whiteSpace: 'pre-wrap' }}>
                        {record.notes}
                    </Typography>
                </Box>
            )}

            {/* File attachment */}
            {hasFile && (
                <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #F5F5F5' }}>
                    <Tooltip title="Open encrypted file (decrypted in new tab)">
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Description fontSize="small" />}
                            endIcon={<OpenInNew sx={{ fontSize: '13px !important' }} />}
                            onClick={openFile}
                            sx={{
                                fontSize: 12, fontWeight: 600, borderRadius: 2,
                                color: '#6A1B9A', borderColor: '#CE93D8',
                                '&:hover': { bgcolor: '#F3E5F5' },
                            }}
                        >
                            View Attached File
                        </Button>
                    </Tooltip>
                </Box>
            )}
        </Paper>
    );
};

/* ── Main Dialog ─────────────────────────────────────────────────────────────── */
const EMRViewDialog = ({ open, appointment, onClose }) => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState('');

    const patientName = buildDisplayName(appointment);
    const patientId   = appointment?.patientId;

    useEffect(() => {
        if (!open || !patientId) return;
        setLoading(true);
        setError('');
        api.get(`/emr/patient/${patientId}`)
            .then(res => setRecords(Array.isArray(res.data) ? res.data : (res.data?.emrs || [])))
            .catch(() => setError('Failed to load medical records. Please try again.'))
            .finally(() => setLoading(false));
    }, [open, patientId]);

    const handleClose = () => { setRecords([]); setError(''); onClose(); };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: { borderRadius: 3 } }}
        >
            <DialogTitle sx={{ pb: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FolderOpen sx={{ color: '#1565C0', fontSize: 22 }} />
                    <Box>
                        <Typography variant="h6" fontWeight={700} fontSize={16}>Medical Records</Typography>
                        <Typography variant="caption" color="text.secondary">{patientName}</Typography>
                    </Box>
                </Box>
                <IconButton size="small" onClick={handleClose}>
                    <Close fontSize="small" />
                </IconButton>
            </DialogTitle>

            <Divider sx={{ mt: 1.5 }} />

            <DialogContent sx={{ pt: 2, minHeight: 200 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                        <CircularProgress sx={{ color: '#1565C0' }} />
                    </Box>
                ) : error ? (
                    <Alert severity="error" sx={{ fontSize: 13 }}>{error}</Alert>
                ) : records.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                        <MedicalServices sx={{ fontSize: 48, color: '#E0E0E0', mb: 1 }} />
                        <Typography color="text.secondary" fontWeight={600}>No records found</Typography>
                        <Typography variant="caption" color="text.secondary">
                            No medical records have been uploaded for this patient yet.
                        </Typography>
                    </Box>
                ) : (
                    <>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="body2" color="text.secondary" fontWeight={600}>
                                {records.length} record{records.length !== 1 ? 's' : ''} found
                            </Typography>
                        </Box>
                        {records.map((rec, i) => (
                            <RecordCard key={rec._id || i} record={rec} />
                        ))}
                    </>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button
                    onClick={handleClose}
                    variant="outlined"
                    sx={{ borderRadius: 2, borderColor: '#ddd', color: '#555' }}
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EMRViewDialog;
