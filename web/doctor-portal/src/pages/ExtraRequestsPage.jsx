import { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, Chip, Button, Divider,
    CircularProgress, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, Avatar, Alert, Snackbar,
    Tab, Tabs, List, ListItem, ListItemText,
} from '@mui/material';
import {
    EventAvailable, Person, MedicalServices,
    CheckCircle, Cancel, AccessTime, Description,
} from '@mui/icons-material';
import api from '../services/api';

const STATUS_COLORS = {
    pending:  { color: '#F57C00', bg: '#FFF3E0', label: 'Pending' },
    accepted: { color: '#2E7D32', bg: '#E8F5E9', label: 'Accepted' },
    rejected: { color: '#C62828', bg: '#FFEBEE', label: 'Rejected' },
};

const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// ── Respond Modal ─────────────────────────────────────────────────────────────
const RespondModal = ({ open, onClose, request, onConfirm, saving }) => {
    const [response, setResponse] = useState('');
    useEffect(() => { if (open) setResponse(''); }, [open]);
    if (!request) return null;
    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ fontWeight: 700, fontSize: 16 }}>
                {request._action === 'accepted' ? 'Accept Request' : 'Reject Request'}
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ pt: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {request._action === 'accepted'
                        ? 'Optionally include a message for the patient (e.g. appointment time).'
                        : 'Optionally explain the reason for rejection.'}
                </Typography>
                <TextField
                    fullWidth multiline rows={3} size="small"
                    label="Message to patient (optional)"
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    inputProps={{ maxLength: 300 }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} disabled={saving} sx={{ color: '#666' }}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={() => onConfirm(response)}
                    disabled={saving}
                    sx={{
                        bgcolor: request._action === 'accepted' ? '#2E7D32' : '#C62828',
                        borderRadius: 2,
                        '&:hover': { bgcolor: request._action === 'accepted' ? '#1B5E20' : '#B71C1C' },
                    }}
                >
                    {saving ? <CircularProgress size={18} color="inherit" /> : (request._action === 'accepted' ? 'Accept' : 'Reject')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// ── Request Card ──────────────────────────────────────────────────────────────
const RequestCard = ({ request, onRespond, onViewMedicalRecords }) => {
    const sc = STATUS_COLORS[request.status] || STATUS_COLORS.pending;
    return (
        <Paper elevation={0} sx={{ border: '1px solid #E8EDF2', borderRadius: 2.5, p: 2.5, mb: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: '#E8F5E9', color: '#2E7D32', width: 40, height: 40 }}>
                        <Person fontSize="small" />
                    </Avatar>
                    <Box>
                        <Typography variant="subtitle2" fontWeight={700}>{request.patient?.name || 'Unknown Patient'}</Typography>
                        <Typography variant="caption" color="text.secondary">
                            Age {request.patient?.age} · {request.patient?.gender} · {request.patient?.phone}
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                        label={sc.label}
                        size="small"
                        sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 700, fontSize: 11 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                        <AccessTime sx={{ fontSize: 13 }} />{formatDate(request.createdAt)}
                    </Typography>
                </Box>
            </Box>

            <Divider sx={{ my: 1.5 }} />

            <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Reason:</strong> {request.reason}</Typography>
            {request.urgencyNote && (
                <Typography variant="body2" color="warning.dark" sx={{ mb: 0.5 }}><strong>Urgency note:</strong> {request.urgencyNote}</Typography>
            )}
            {request.doctorResponse && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}><strong>Your response:</strong> {request.doctorResponse}</Typography>
            )}

            <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
                <Button
                    size="small" variant="outlined"
                    startIcon={<MedicalServices />}
                    onClick={() => onViewMedicalRecords(request)}
                    sx={{ borderRadius: 2, borderColor: '#2E7D32', color: '#2E7D32', fontSize: 12 }}
                >
                    View Medical Records
                </Button>
                {request.status === 'pending' && (
                    <>
                        <Button
                            size="small" variant="contained"
                            startIcon={<CheckCircle />}
                            onClick={() => onRespond(request, 'accepted')}
                            sx={{ borderRadius: 2, bgcolor: '#2E7D32', fontSize: 12, '&:hover': { bgcolor: '#1B5E20' } }}
                        >
                            Accept
                        </Button>
                        <Button
                            size="small" variant="outlined"
                            startIcon={<Cancel />}
                            onClick={() => onRespond(request, 'rejected')}
                            sx={{ borderRadius: 2, borderColor: '#C62828', color: '#C62828', fontSize: 12 }}
                        >
                            Reject
                        </Button>
                    </>
                )}
            </Box>
        </Paper>
    );
};

// ── Medical Records Dialog ────────────────────────────────────────────────────
const MedicalRecordsDialog = ({ open, onClose, patient, patientId }) => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open || !patientId) return;
        setLoading(true);
        api.get(`/emr/patient/${patientId}`)
            .then(res => setRecords(res.data || []))
            .catch(() => setRecords([]))
            .finally(() => setLoading(false));
    }, [open, patientId]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Description sx={{ color: '#2E7D32', fontSize: 20 }} />
                Medical Records — {patient?.name || 'Patient'}
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ pt: 2, minHeight: 160 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={28} sx={{ color: '#2E7D32' }} />
                    </Box>
                ) : records.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <MedicalServices sx={{ fontSize: 40, color: '#C8D8C8', mb: 1 }} />
                        <Typography color="text.secondary" variant="body2">No medical records found for this patient.</Typography>
                    </Box>
                ) : (
                    <List disablePadding>
                        {records.map((r, i) => (
                            <Paper key={r._id || i} elevation={0} sx={{ border: '1px solid #E8EDF2', borderRadius: 2, mb: 1.5 }}>
                                <ListItem alignItems="flex-start" sx={{ px: 2, py: 1.5 }}>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                <Typography variant="subtitle2" fontWeight={700}>{r.title || r.type || 'Record'}</Typography>
                                                {r.type && <Chip label={r.type} size="small" sx={{ fontSize: 10, height: 18 }} />}
                                            </Box>
                                        }
                                        secondary={
                                            <Box>
                                                {r.diagnosis && <Typography variant="body2" sx={{ mb: 0.3 }}><strong>Diagnosis:</strong> {r.diagnosis}</Typography>}
                                                {r.notes && <Typography variant="body2" color="text.secondary">{r.notes}</Typography>}
                                                <Typography variant="caption" color="text.disabled">
                                                    {r.uploadedDate || r.createdAt ? new Date(r.uploadedDate || r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                </ListItem>
                            </Paper>
                        ))}
                    </List>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} sx={{ color: '#666' }}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const ExtraRequestsPage = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState(0); // 0=pending, 1=all
    const [respondTarget, setRespondTarget] = useState(null);
    const [saving, setSaving] = useState(false);
    const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
    const [medicalTarget, setMedicalTarget] = useState(null); // { patientId, patient }

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/doctor-channeling/appointments/extra-requests');
            setRequests(res.data?.data || []);
        } catch {
            setRequests([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchRequests(); }, [fetchRequests]);

    const handleViewMedicalRecords = (request) => {
        setMedicalTarget({ patientId: request.patientId?._id || request.patientId, patient: request.patient });
    };

    const handleRespond = (request, action) => {
        setRespondTarget({ ...request, _action: action });
    };

    const handleConfirmRespond = async (doctorResponse) => {
        setSaving(true);
        try {
            await api.patch(
                `/doctor-channeling/appointments/extra-requests/${respondTarget._id}/respond`,
                { action: respondTarget._action, doctorResponse }
            );
            setRequests(prev => prev.map(r =>
                r._id === respondTarget._id
                    ? { ...r, status: respondTarget._action, doctorResponse }
                    : r
            ));
            setSnack({ open: true, msg: `Request ${respondTarget._action} successfully.`, severity: 'success' });
        } catch {
            setSnack({ open: true, msg: 'Failed to save response.', severity: 'error' });
        } finally {
            setSaving(false);
            setRespondTarget(null);
        }
    };

    const displayed = tab === 0
        ? requests.filter(r => r.status === 'pending')
        : requests;

    const pendingCount = requests.filter(r => r.status === 'pending').length;

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#F0F4F8', minHeight: '100vh' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <EventAvailable sx={{ color: '#2E7D32', fontSize: 28 }} />
                <Box>
                    <Typography variant="h5" fontWeight={700}>Extra Appointment Requests</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Patients requesting urgent sessions when all slots are fully booked
                    </Typography>
                </Box>
                {pendingCount > 0 && (
                    <Chip label={`${pendingCount} pending`} size="small" sx={{ bgcolor: '#FFF3E0', color: '#F57C00', fontWeight: 700, ml: 'auto' }} />
                )}
            </Box>

            {/* Tabs */}
            <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                sx={{ mb: 2, '& .MuiTab-root': { fontWeight: 600, textTransform: 'none' }, '& .Mui-selected': { color: '#2E7D32' }, '& .MuiTabs-indicator': { bgcolor: '#2E7D32' } }}
            >
                <Tab label={`Pending (${pendingCount})`} />
                <Tab label={`All Requests (${requests.length})`} />
            </Tabs>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                    <CircularProgress sx={{ color: '#2E7D32' }} />
                </Box>
            ) : displayed.length === 0 ? (
                <Paper elevation={0} sx={{ border: '1px solid #E8EDF2', borderRadius: 3, p: 5, textAlign: 'center' }}>
                    <EventAvailable sx={{ fontSize: 48, color: '#C8D8C8', mb: 1 }} />
                    <Typography color="text.secondary">
                        {tab === 0 ? 'No pending requests at the moment.' : 'No extra appointment requests yet.'}
                    </Typography>
                </Paper>
            ) : (
                displayed.map(r => (
                    <RequestCard
                        key={r._id}
                        request={r}
                        onViewMedicalRecords={handleViewMedicalRecords}
                        onRespond={handleRespond}
                    />
                ))
            )}

            <RespondModal
                open={!!respondTarget}
                onClose={() => setRespondTarget(null)}
                request={respondTarget}
                onConfirm={handleConfirmRespond}
                saving={saving}
            />

            <MedicalRecordsDialog
                open={!!medicalTarget}
                onClose={() => setMedicalTarget(null)}
                patientId={medicalTarget?.patientId}
                patient={medicalTarget?.patient}
            />

            <Snackbar
                open={snack.open}
                autoHideDuration={3500}
                onClose={() => setSnack(s => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snack.severity} sx={{ borderRadius: 2 }}>{snack.msg}</Alert>
            </Snackbar>
        </Box>
    );
};

export default ExtraRequestsPage;
