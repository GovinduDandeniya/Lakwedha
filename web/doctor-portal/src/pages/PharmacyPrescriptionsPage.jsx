import React, { useEffect, useState, useCallback } from 'react';
import {
    Box, Typography, Card, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, IconButton, Tooltip, CircularProgress,
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    TextField, Alert, Tabs, Tab,
} from '@mui/material';
import {
    Visibility, CheckCircle, Cancel, Refresh,
} from '@mui/icons-material';
import pharmacyApi from '../services/pharmacyApi';

const GREEN = '#0D5C3E';
const BG    = '#F8F9FA';

const STATUS_CFG = {
    pending:    { label: 'Pending',     color: '#E65100', bg: '#FFF3E0' },
    price_sent: { label: 'Price Sent',  color: '#1565C0', bg: '#E3F2FD' },
    approved:   { label: 'Approved',    color: '#2E7D32', bg: '#E8F5E9' },
    rejected:   { label: 'Rejected',    color: '#C62828', bg: '#FFEBEE' },
    paid:       { label: 'Paid',        color: '#2E7D32', bg: '#E8F5E9' },
    processing: { label: 'Processing',  color: '#6A1B9A', bg: '#F3E5F5' },
    completed:  { label: 'Completed',   color: '#00695C', bg: '#E0F2F1' },
};

const StatusChip = ({ status }) => {
    const cfg = STATUS_CFG[status] || STATUS_CFG.pending;
    return (
        <Chip label={cfg.label} size="small"
            sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: 11 }} />
    );
};

export default function PharmacyPrescriptionsPage() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [tab, setTab]           = useState('pending');
    const [selected, setSelected] = useState(null);
    const [action, setAction]     = useState(null); // 'approve' | 'reject'
    const [price, setPrice]       = useState('');
    const [reason, setReason]     = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError]       = useState('');
    const [success, setSuccess]   = useState('');

    const fetchRequests = useCallback(() => {
        setLoading(true);
        pharmacyApi.get('/pharmacy/pharmacy-requests')
            .then((r) => setRequests(r.data?.data || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { fetchRequests(); }, [fetchRequests]);

    const filtered = tab === 'all'
        ? requests
        : requests.filter((r) => r.status === tab);

    const openAction = (req, type) => {
        setSelected(req);
        setAction(type);
        setPrice('');
        setReason('');
        setError('');
    };

    const closeAction = () => {
        setSelected(null);
        setAction(null);
        setError('');
    };

    const handleSubmit = async () => {
        setError('');
        if (action === 'approve' && (!price || Number(price) <= 0)) {
            setError('Enter a valid price.');
            return;
        }
        if (action === 'reject' && reason.trim().length < 5) {
            setError('Reason must be at least 5 characters.');
            return;
        }
        setSubmitting(true);
        try {
            await pharmacyApi.post('/pharmacy/respond', {
                requestId: selected._id,
                status: action === 'approve' ? 'approved' : 'rejected',
                ...(action === 'approve' ? { price: Number(price) } : { reason }),
            });
            setSuccess(action === 'approve' ? 'Price sent to patient.' : 'Request rejected.');
            closeAction();
            fetchRequests();
        } catch (e) {
            setError(e.response?.data?.message || 'Action failed.');
        } finally {
            setSubmitting(false);
        }
    };

    const tabs = ['pending', 'price_sent', 'paid', 'processing', 'completed', 'rejected', 'all'];

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: BG, minHeight: '100vh' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                    <Typography variant="h5" fontWeight={800} color={GREEN}>Prescription Requests</Typography>
                    <Typography variant="body2" color="text.secondary">Review and respond to patient prescription requests</Typography>
                </Box>
                <IconButton onClick={fetchRequests} sx={{ color: GREEN }}>
                    <Refresh />
                </IconButton>
            </Box>

            {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>{success}</Alert>}

            {/* Tabs */}
            <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                sx={{ mb: 2, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: 13 } }}
                textColor="inherit"
                TabIndicatorProps={{ style: { backgroundColor: GREEN } }}
            >
                {tabs.map((t) => {
                    const label = t === 'all' ? 'All' : (STATUS_CFG[t]?.label || t);
                    const cnt   = t === 'all' ? requests.length : requests.filter((r) => r.status === t).length;
                    return (
                        <Tab key={t} value={t}
                            label={`${label} (${cnt})`}
                            sx={{ color: tab === t ? GREEN : '#555' }}
                        />
                    );
                })}
            </Tabs>

            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #E8EDF2' }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                        <CircularProgress sx={{ color: GREEN }} />
                    </Box>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#F8FAF8' }}>
                                    {['Patient', 'Mobile', 'Address', 'Location', 'Date', 'Status', 'Actions'].map((h) => (
                                        <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: '#555' }}>{h}</TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filtered.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 5, color: '#888' }}>
                                            No requests found
                                        </TableCell>
                                    </TableRow>
                                )}
                                {filtered.map((req) => {
                                    const pd  = req.patientDetails || {};
                                    const loc = req.location || {};
                                    return (
                                        <TableRow key={req._id} hover>
                                            <TableCell sx={{ fontWeight: 600 }}>{pd.firstName} {pd.lastName}</TableCell>
                                            <TableCell sx={{ fontSize: 13 }}>{pd.mobile || '—'}</TableCell>
                                            <TableCell sx={{ fontSize: 12, color: '#666', maxWidth: 160 }}>
                                                <Tooltip title={pd.address || ''}>
                                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: 140 }}>
                                                        {pd.address || '—'}
                                                    </span>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell sx={{ fontSize: 13 }}>
                                                {[loc.city, loc.district].filter(Boolean).join(', ') || '—'}
                                            </TableCell>
                                            <TableCell sx={{ fontSize: 12, color: '#888' }}>
                                                {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : '—'}
                                            </TableCell>
                                            <TableCell><StatusChip status={req.status} /></TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                    {/* View prescription */}
                                                    {req.prescriptionFileUrl && (
                                                        <Tooltip title="View Prescription">
                                                            <IconButton size="small" onClick={() => setSelected(req)}>
                                                                <Visibility fontSize="small" sx={{ color: '#1565C0' }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                    {/* Approve / Reject only for pending */}
                                                    {req.status === 'pending' && (
                                                        <>
                                                            <Tooltip title="Approve & Set Price">
                                                                <IconButton size="small" onClick={() => openAction(req, 'approve')}>
                                                                    <CheckCircle fontSize="small" sx={{ color: '#2E7D32' }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Reject">
                                                                <IconButton size="small" onClick={() => openAction(req, 'reject')}>
                                                                    <Cancel fontSize="small" sx={{ color: '#C62828' }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </>
                                                    )}
                                                    {req.status === 'price_sent' && (
                                                        <Typography variant="caption" sx={{ color: '#1565C0', fontWeight: 700, pl: 0.5 }}>
                                                            LKR {req.price}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Card>

            {/* View Prescription Dialog */}
            <Dialog open={!!selected && !action} onClose={() => setSelected(null)} maxWidth="sm" fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 800, color: GREEN }}>Prescription Details</DialogTitle>
                <DialogContent>
                    {selected && (
                        <Box>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Patient:</strong> {selected.patientDetails?.firstName} {selected.patientDetails?.lastName}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Mobile:</strong> {selected.patientDetails?.mobile}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                <strong>Address:</strong> {selected.patientDetails?.address}
                            </Typography>
                            {selected.prescriptionFileUrl && (
                                <Box sx={{ mt: 2, textAlign: 'center' }}>
                                    {selected.prescriptionFileUrl.match(/\.(jpg|jpeg|png)$/i) ? (
                                        <img
                                            src={selected.prescriptionFileUrl.startsWith('http') ? selected.prescriptionFileUrl : `https://lakwedha.onrender.com${selected.prescriptionFileUrl}`}
                                            alt="Prescription"
                                            style={{ maxWidth: '100%', borderRadius: 12, pointerEvents: 'none' }}
                                            onContextMenu={(e) => e.preventDefault()}
                                        />
                                    ) : (
                                        <Alert severity="info">
                                            Prescription file: {selected.prescriptionFileUrl.split('/').pop()}
                                        </Alert>
                                    )}
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setSelected(null)} sx={{ color: '#555' }}>Close</Button>
                    {selected?.status === 'pending' && (
                        <>
                            <Button onClick={() => openAction(selected, 'reject')} sx={{ color: '#C62828' }}>Reject</Button>
                            <Button onClick={() => openAction(selected, 'approve')} variant="contained"
                                sx={{ bgcolor: GREEN, '&:hover': { bgcolor: '#0A4A30' } }}>
                                Approve & Set Price
                            </Button>
                        </>
                    )}
                </DialogActions>
            </Dialog>

            {/* Approve / Reject Action Dialog */}
            <Dialog open={!!action} onClose={closeAction} maxWidth="xs" fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 800, color: action === 'approve' ? GREEN : '#C62828' }}>
                    {action === 'approve' ? 'Approve & Send Price' : 'Reject Request'}
                </DialogTitle>
                <DialogContent>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    {action === 'approve' ? (
                        <TextField
                            label="Total Price (LKR)"
                            type="number"
                            fullWidth
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            inputProps={{ min: 1 }}
                            sx={{ mt: 1 }}
                        />
                    ) : (
                        <TextField
                            label="Rejection Reason"
                            multiline
                            rows={3}
                            fullWidth
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g. Out of stock, prescription unclear..."
                            sx={{ mt: 1 }}
                        />
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={closeAction} disabled={submitting} sx={{ color: '#555' }}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={submitting}
                        variant="contained"
                        sx={{
                            bgcolor: action === 'approve' ? GREEN : '#C62828',
                            '&:hover': { bgcolor: action === 'approve' ? '#0A4A30' : '#8B0000' },
                        }}
                    >
                        {submitting
                            ? <CircularProgress size={18} color="inherit" />
                            : action === 'approve' ? 'Send Price' : 'Reject'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
