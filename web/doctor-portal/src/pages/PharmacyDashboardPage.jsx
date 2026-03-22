import React, { useEffect, useState } from 'react';
import {
    Box, Grid, Card, CardContent, Typography, CircularProgress,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Chip, Button,
} from '@mui/material';
import {
    HourglassEmpty, CheckCircle, Cancel, LocalShipping,
    Inventory, MonetizationOn,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import pharmacyApi from '../services/pharmacyApi';

const GREEN  = '#0D5C3E';
const GOLD   = '#D4AF37';
const BG     = '#F8F9FA';

const STATUS_CFG = {
    pending:    { label: 'Pending',      color: '#E65100', bg: '#FFF3E0', icon: <HourglassEmpty sx={{ fontSize: 14 }} /> },
    price_sent: { label: 'Price Ready',  color: '#1565C0', bg: '#E3F2FD', icon: <MonetizationOn sx={{ fontSize: 14 }} /> },
    approved:   { label: 'Approved',     color: '#2E7D32', bg: '#E8F5E9', icon: <CheckCircle sx={{ fontSize: 14 }} /> },
    rejected:   { label: 'Rejected',     color: '#C62828', bg: '#FFEBEE', icon: <Cancel sx={{ fontSize: 14 }} /> },
    paid:       { label: 'Paid',         color: '#2E7D32', bg: '#E8F5E9', icon: <CheckCircle sx={{ fontSize: 14 }} /> },
    processing: { label: 'Processing',   color: '#6A1B9A', bg: '#F3E5F5', icon: <Inventory sx={{ fontSize: 14 }} /> },
    completed:  { label: 'Completed',    color: '#00695C', bg: '#E0F2F1', icon: <LocalShipping sx={{ fontSize: 14 }} /> },
};

const StatusChip = ({ status }) => {
    const cfg = STATUS_CFG[status] || STATUS_CFG.pending;
    return (
        <Chip
            icon={cfg.icon}
            label={cfg.label}
            size="small"
            sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: 11, border: `1px solid ${cfg.color}22` }}
        />
    );
};

const StatCard = ({ title, value, icon, color }) => (
    <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #E8EDF2', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>{title}</Typography>
                    <Typography variant="h4" fontWeight={800} sx={{ color, mt: 0.5, lineHeight: 1 }}>{value}</Typography>
                </Box>
                <Box sx={{
                    width: 48, height: 48, borderRadius: '50%',
                    bgcolor: `${color}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    {React.cloneElement(icon, { sx: { color, fontSize: 24 } })}
                </Box>
            </Box>
        </CardContent>
    </Card>
);

export default function PharmacyDashboardPage() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading]   = useState(true);
    const navigate = useNavigate();

    const pharmacy = (() => {
        try { return JSON.parse(localStorage.getItem('pharmacy_user') || '{}'); } catch { return {}; }
    })();

    useEffect(() => {
        pharmacyApi.get('/pharmacy/pharmacy-requests')
            .then((r) => setRequests(r.data?.data || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const count = (status) => requests.filter((r) => r.status === status).length;
    const recent = [...requests].slice(0, 8);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
                <CircularProgress sx={{ color: GREEN }} />
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: BG, minHeight: '100vh' }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" fontWeight={800} color={GREEN}>
                    Welcome, {pharmacy.pharmacyName || 'Pharmacy'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {pharmacy.city || ''}{pharmacy.city ? ', ' : ''}{pharmacy.district || ''}
                </Typography>
            </Box>

            {/* Stats */}
            <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid item xs={6} md={3}>
                    <StatCard title="Pending Requests" value={count('pending')} icon={<HourglassEmpty />} color="#E65100" />
                </Grid>
                <Grid item xs={6} md={3}>
                    <StatCard title="Price Sent" value={count('price_sent')} icon={<MonetizationOn />} color="#1565C0" />
                </Grid>
                <Grid item xs={6} md={3}>
                    <StatCard title="Paid Orders" value={count('paid') + count('processing')} icon={<Inventory />} color="#6A1B9A" />
                </Grid>
                <Grid item xs={6} md={3}>
                    <StatCard title="Completed" value={count('completed')} icon={<LocalShipping />} color="#00695C" />
                </Grid>
            </Grid>

            {/* Recent requests table */}
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #E8EDF2' }}>
                <Box sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E8EDF2' }}>
                    <Typography variant="subtitle1" fontWeight={800} color={GREEN}>
                        Recent Prescription Requests
                    </Typography>
                    <Button size="small" onClick={() => navigate('/pharmacy/prescriptions')}
                        sx={{ color: GREEN, fontWeight: 700 }}>
                        View All
                    </Button>
                </Box>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#F8FAF8' }}>
                                {['Patient', 'Mobile', 'Location', 'Date', 'Status'].map((h) => (
                                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: '#555' }}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {recent.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: '#888' }}>
                                        No prescription requests yet
                                    </TableCell>
                                </TableRow>
                            )}
                            {recent.map((req) => {
                                const pd = req.patientDetails || {};
                                const loc = req.location || {};
                                return (
                                    <TableRow key={req._id} hover sx={{ cursor: 'pointer' }}
                                        onClick={() => navigate('/pharmacy/prescriptions')}>
                                        <TableCell sx={{ fontWeight: 600 }}>
                                            {pd.firstName} {pd.lastName}
                                        </TableCell>
                                        <TableCell sx={{ color: '#555', fontSize: 13 }}>{pd.mobile || '—'}</TableCell>
                                        <TableCell sx={{ color: '#555', fontSize: 13 }}>
                                            {[loc.city, loc.district].filter(Boolean).join(', ') || '—'}
                                        </TableCell>
                                        <TableCell sx={{ color: '#888', fontSize: 12 }}>
                                            {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : '—'}
                                        </TableCell>
                                        <TableCell><StatusChip status={req.status} /></TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* Quick actions */}
            <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button variant="contained" onClick={() => navigate('/pharmacy/prescriptions')}
                    sx={{ bgcolor: GREEN, '&:hover': { bgcolor: '#0A4A30' }, fontWeight: 700, borderRadius: 2 }}>
                    Review Prescriptions
                </Button>
                <Button variant="outlined" onClick={() => navigate('/pharmacy/orders')}
                    sx={{ borderColor: GOLD, color: GOLD, '&:hover': { borderColor: '#B8960F' }, fontWeight: 700, borderRadius: 2 }}>
                    Manage Orders
                </Button>
            </Box>
        </Box>
    );
}
