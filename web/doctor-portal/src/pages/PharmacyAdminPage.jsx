import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Container, Paper, Typography, Button, Chip, CircularProgress,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Tab, Tabs,
} from '@mui/material';
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import axios from 'axios';

const PHARMACY_API = 'http://localhost:5000/api/pharmacy-registration';
const ADMIN_LOGIN_API = 'http://localhost:5000/api/users/login';

const STATUS_COLORS = { pending: 'warning', approved: 'success', rejected: 'error' };

const PharmacyAdminPage = () => {
    const [tab, setTab] = useState('pending');
    const [pharmacies, setPharmacies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [token, setToken] = useState(() => localStorage.getItem('admin_token') || '');
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);

    const [rejectDialog, setRejectDialog] = useState({ open: false, id: null });
    const [rejectReason, setRejectReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const fetchPharmacies = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setError('');
        try {
            const res = await axios.get(`${PHARMACY_API}/all?status=${tab}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setPharmacies(res.data.data || []);
        } catch (err) {
            if (err?.response?.status === 401 || err?.response?.status === 403) {
                setToken('');
                localStorage.removeItem('admin_token');
                setError('Session expired. Please log in again.');
            } else {
                setError('Failed to load pharmacies.');
            }
        } finally {
            setLoading(false);
        }
    }, [token, tab]);

    useEffect(() => { fetchPharmacies(); }, [fetchPharmacies]);

    const handleAdminLogin = async (e) => {
        e.preventDefault();
        setLoginError('');
        setLoginLoading(true);
        try {
            const res = await axios.post(ADMIN_LOGIN_API, { email: loginEmail, password: loginPassword });
            const { token: jwt, user } = res.data;
            if (user?.role !== 'admin') {
                setLoginError('Access denied. Admin accounts only.');
                return;
            }
            localStorage.setItem('admin_token', jwt);
            setToken(jwt);
        } catch (err) {
            setLoginError(err?.response?.data?.message || 'Invalid credentials.');
        } finally {
            setLoginLoading(false);
        }
    };

    const handleApprove = async (id) => {
        setActionLoading(true);
        try {
            await axios.put(`${PHARMACY_API}/approve/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
            fetchPharmacies();
        } catch {
            setError('Failed to approve pharmacy.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRejectConfirm = async () => {
        if (!rejectReason.trim()) return;
        setActionLoading(true);
        try {
            await axios.put(`${PHARMACY_API}/reject/${rejectDialog.id}`,
                { reason: rejectReason },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setRejectDialog({ open: false, id: null });
            setRejectReason('');
            fetchPharmacies();
        } catch {
            setError('Failed to reject pharmacy.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        setToken('');
    };

    if (!token) {
        return (
            <Box sx={{ minHeight: '100vh', bgcolor: '#F0F4F8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Container maxWidth="xs">
                    <Paper elevation={4} sx={{ p: 4, borderRadius: 3 }}>
                        <Box sx={{ textAlign: 'center', mb: 3 }}>
                            <Box sx={{
                                width: 56, height: 56, borderRadius: '50%', bgcolor: '#E3F2FD',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5,
                            }}>
                                <LocalPharmacyIcon sx={{ color: '#1565C0', fontSize: 28 }} />
                            </Box>
                            <Typography variant="h6" fontWeight={700}>Admin — Pharmacy Panel</Typography>
                            <Typography variant="body2" color="text.secondary">Sign in with your admin account</Typography>
                        </Box>

                        {loginError && <Alert severity="error" sx={{ mb: 2 }}>{loginError}</Alert>}

                        <form onSubmit={handleAdminLogin} noValidate>
                            <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>Email</Typography>
                            <TextField fullWidth size="small" type="email" placeholder="admin@lakwedha.com"
                                value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} sx={{ mb: 2 }} />
                            <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>Password</Typography>
                            <TextField fullWidth size="small" type="password" placeholder="Password"
                                value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} sx={{ mb: 3 }} />
                            <Button type="submit" fullWidth variant="contained" disabled={loginLoading}
                                sx={{ py: 1.3, bgcolor: '#1565C0', '&:hover': { bgcolor: '#0D47A1' } }}>
                                {loginLoading ? <CircularProgress size={20} color="inherit" /> : 'Sign In'}
                            </Button>
                        </form>
                    </Paper>
                </Container>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#F0F4F8' }}>
            <Box sx={{ bgcolor: '#1565C0', color: '#fff', px: 4, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <LocalPharmacyIcon />
                    <Typography variant="h6" fontWeight={700}>Pharmacy Registrations — Admin</Typography>
                </Box>
                <Button variant="outlined" size="small" onClick={handleLogout}
                    sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: '#fff' } }}>
                    Logout
                </Button>
            </Box>

            <Container maxWidth="lg" sx={{ mt: 4 }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Paper elevation={1} sx={{ borderRadius: 2, mb: 3 }}>
                    <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="primary" indicatorColor="primary">
                        <Tab label="Pending" value="pending" />
                        <Tab label="Approved" value="approved" />
                        <Tab label="Rejected" value="rejected" />
                    </Tabs>
                </Paper>

                <Paper elevation={2} sx={{ borderRadius: 2 }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                            <CircularProgress />
                        </Box>
                    ) : pharmacies.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 6 }}>
                            <Typography color="text.secondary">No {tab} registrations found.</Typography>
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#F5F7FA' }}>
                                        <TableCell sx={{ fontWeight: 700 }}>Pharmacy</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Owner</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Reg. No.</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                        {tab === 'pending' && <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>}
                                        {tab === 'rejected' && <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {pharmacies.map((p) => (
                                        <TableRow key={p._id} hover>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600}>{p.pharmacyName}</Typography>
                                                <Typography variant="caption" color="text.secondary">{p.permitNumber}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">{p.ownerName}</Typography>
                                                <Typography variant="caption" color="text.secondary">{p.ownerNIC}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">{p.city}</Typography>
                                                <Typography variant="caption" color="text.secondary">{p.district}, {p.province}</Typography>
                                            </TableCell>
                                            <TableCell><Typography variant="body2">{p.email}</Typography></TableCell>
                                            <TableCell><Typography variant="body2">{p.businessRegNumber}</Typography></TableCell>
                                            <TableCell>
                                                <Chip label={p.status} color={STATUS_COLORS[p.status]} size="small"
                                                    sx={{ fontWeight: 600, textTransform: 'capitalize' }} />
                                            </TableCell>
                                            {tab === 'pending' && (
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                                        <Button size="small" variant="contained" startIcon={<CheckCircleIcon />}
                                                            disabled={actionLoading} onClick={() => handleApprove(p._id)}
                                                            sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' }, fontSize: 12 }}>
                                                            Approve
                                                        </Button>
                                                        <Button size="small" variant="outlined" startIcon={<CancelIcon />}
                                                            disabled={actionLoading}
                                                            onClick={() => setRejectDialog({ open: true, id: p._id })}
                                                            sx={{ borderColor: '#C62828', color: '#C62828', '&:hover': { bgcolor: '#FFF5F5' }, fontSize: 12 }}>
                                                            Reject
                                                        </Button>
                                                    </Box>
                                                </TableCell>
                                            )}
                                            {tab === 'rejected' && (
                                                <TableCell>
                                                    <Typography variant="body2" color="error">{p.rejectionReason || '—'}</Typography>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Paper>
            </Container>

            <Dialog open={rejectDialog.open} onClose={() => setRejectDialog({ open: false, id: null })} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Reject Pharmacy Registration</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Please provide a reason for rejection. This will be shown to the pharmacy owner.
                    </Typography>
                    <TextField fullWidth multiline rows={3} label="Rejection Reason"
                        value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="e.g. Incomplete documentation, invalid permit number..." />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                    <Button onClick={() => { setRejectDialog({ open: false, id: null }); setRejectReason(''); }}
                        variant="outlined">Cancel</Button>
                    <Button onClick={handleRejectConfirm} variant="contained"
                        disabled={!rejectReason.trim() || actionLoading}
                        sx={{ bgcolor: '#C62828', '&:hover': { bgcolor: '#B71C1C' } }}>
                        {actionLoading ? <CircularProgress size={18} color="inherit" /> : 'Confirm Reject'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PharmacyAdminPage;
