import { useEffect, useState, useCallback, cloneElement } from 'react';
import {
    Box, Typography, Card, CardContent, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, Button, CircularProgress,
    Alert, Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab,
    Avatar, Divider, IconButton, Tooltip,
} from '@mui/material';
import {
    Refresh, OpenInNew, Inventory2Outlined, CheckCircleOutlined,
    PaymentOutlined, AllInboxOutlined,
} from '@mui/icons-material';
import pharmacyApi from '../services/pharmacyApi';

const GREEN   = '#0D5C3E';
const BG      = '#F8F9FA';
const PURPLE  = '#6A1B9A';
const TEAL    = '#00695C';
const BLUE    = '#1565C0';

const STATUS_CFG = {
    paid:       { label: 'Paid',       color: '#2E7D32', bg: '#E8F5E9' },
    processing: { label: 'Processing', color: PURPLE,    bg: '#F3E5F5' },
    completed:  { label: 'Completed',  color: TEAL,      bg: '#E0F2F1' },
};

const TABS = [
    { value: 'all',        label: 'All Orders',  icon: <AllInboxOutlined sx={{ fontSize: 16 }} /> },
    { value: 'paid',       label: 'Paid',        icon: <PaymentOutlined  sx={{ fontSize: 16 }} /> },
    { value: 'processing', label: 'Processing',  icon: <Inventory2Outlined sx={{ fontSize: 16 }} /> },
    { value: 'completed',  label: 'Completed',   icon: <CheckCircleOutlined sx={{ fontSize: 16 }} /> },
];

function StatusBadge({ status }) {
    const cfg = STATUS_CFG[status] || { label: status, color: '#555', bg: '#F5F5F5' };
    return (
        <Chip
            label={cfg.label}
            size="small"
            sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: 11 }}
        />
    );
}

function StatCard({ icon, label, value, color }) {
    return (
        <Card elevation={0} sx={{ flex: 1, borderRadius: 3, border: '1px solid #E8EDF2', minWidth: 120 }}>
            <CardContent sx={{ p: '14px !important' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                        width: 40, height: 40, borderRadius: 2,
                        bgcolor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {cloneElement(icon, { sx: { color, fontSize: 20 } })}
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight={800} color={color} lineHeight={1}>{value}</Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
}

export default function PharmacyOrdersPage() {
    const [orders, setOrders]       = useState([]);
    const [loading, setLoading]     = useState(true);
    const [updating, setUpdating]   = useState(null);
    const [success, setSuccess]     = useState('');
    const [error, setError]         = useState('');
    const [confirm, setConfirm]     = useState(null);   // { orderId, status }
    const [tab, setTab]             = useState('all');
    const [rxDialog, setRxDialog]   = useState(null);   // prescription URL

    const fetchOrders = useCallback(() => {
        setLoading(true);
        pharmacyApi.get('/pharmacy/pharmacy-requests')
            .then((r) => {
                const all = r.data?.data || [];
                setOrders(all.filter((o) => ['paid', 'processing', 'completed'].includes(o.status)));
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const handleUpdate = async (orderId, newStatus) => {
        setUpdating(orderId);
        setError('');
        try {
            await pharmacyApi.put(`/pharmacy/orders/${orderId}/status`, { status: newStatus });
            setSuccess(`Order marked as ${newStatus}.`);
            fetchOrders();
        } catch (e) {
            setError(e.response?.data?.message || 'Update failed.');
        } finally {
            setUpdating(null);
            setConfirm(null);
        }
    };

    const filtered = tab === 'all' ? orders : orders.filter((o) => o.status === tab);

    const counts = {
        all:       orders.length,
        paid:      orders.filter((o) => o.status === 'paid').length,
        processing:orders.filter((o) => o.status === 'processing').length,
        completed: orders.filter((o) => o.status === 'completed').length,
    };

    const formatDate = (iso) => {
        if (!iso) return '—';
        return new Date(iso).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
        });
    };

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: BG, minHeight: '100vh' }}>

            {/* ── Header ── */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                    <Typography variant="h5" fontWeight={800} color={GREEN}>Order Management</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Track and manage paid prescription orders
                    </Typography>
                </Box>
                <Button
                    onClick={fetchOrders}
                    startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <Refresh />}
                    disabled={loading}
                    sx={{ color: GREEN, fontWeight: 700 }}
                >
                    Refresh
                </Button>
            </Box>

            {/* ── Stat Cards ── */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <StatCard icon={<AllInboxOutlined />}      label="Total Orders"  value={counts.all}        color={GREEN}  />
                <StatCard icon={<PaymentOutlined />}       label="Paid"          value={counts.paid}       color={BLUE}   />
                <StatCard icon={<Inventory2Outlined />}    label="Processing"    value={counts.processing}  color={PURPLE} />
                <StatCard icon={<CheckCircleOutlined />}   label="Completed"     value={counts.completed}  color={TEAL}   />
            </Box>

            {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>{success}</Alert>}
            {error   && <Alert severity="error"   onClose={() => setError('')}   sx={{ mb: 2 }}>{error}</Alert>}

            {/* ── Main Card ── */}
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #E8EDF2' }}>

                {/* Filter Tabs */}
                <Box sx={{ borderBottom: '1px solid #E8EDF2', px: 2 }}>
                    <Tabs
                        value={tab}
                        onChange={(_, v) => setTab(v)}
                        textColor="inherit"
                        TabIndicatorProps={{ style: { backgroundColor: GREEN } }}
                        sx={{ minHeight: 44 }}
                    >
                        {TABS.map((t) => (
                            <Tab
                                key={t.value}
                                value={t.value}
                                icon={t.icon}
                                iconPosition="start"
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                        {t.label}
                                        <Chip
                                            label={counts[t.value]}
                                            size="small"
                                            sx={{
                                                height: 18, fontSize: 10, fontWeight: 700,
                                                bgcolor: tab === t.value ? GREEN : '#E8EDF2',
                                                color:   tab === t.value ? '#fff' : '#555',
                                            }}
                                        />
                                    </Box>
                                }
                                sx={{
                                    minHeight: 44, textTransform: 'none', fontSize: 13, fontWeight: 600,
                                    color: tab === t.value ? GREEN : '#666',
                                }}
                            />
                        ))}
                    </Tabs>
                </Box>

                {/* Table */}
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress sx={{ color: GREEN }} />
                    </Box>
                ) : filtered.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8, color: '#aaa' }}>
                        <Inventory2Outlined sx={{ fontSize: 44, mb: 1 }} />
                        <Typography fontWeight={600}>No orders in this category</Typography>
                    </Box>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#F8FAF8' }}>
                                    {['#', 'Patient', 'Contact', 'Address', 'Prescription', 'Amount (LKR)', 'Paid On', 'Status', 'Action'].map((h) => (
                                        <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, color: '#666', py: 1.5 }}>{h}</TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filtered.map((order, idx) => {
                                    const pd = order.patientDetails || {};
                                    const initials = `${pd.firstName?.[0] ?? ''}${pd.lastName?.[0] ?? ''}`.toUpperCase();
                                    return (
                                        <TableRow key={order._id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                            {/* Index */}
                                            <TableCell sx={{ color: '#aaa', fontSize: 12, width: 36 }}>
                                                {idx + 1}
                                            </TableCell>

                                            {/* Patient name */}
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                                                    <Avatar sx={{ width: 32, height: 32, bgcolor: `${GREEN}22`, color: GREEN, fontSize: 12, fontWeight: 800 }}>
                                                        {initials || '?'}
                                                    </Avatar>
                                                    <Typography sx={{ fontWeight: 700, fontSize: 13 }}>
                                                        {pd.firstName} {pd.lastName}
                                                    </Typography>
                                                </Box>
                                            </TableCell>

                                            {/* Mobile */}
                                            <TableCell sx={{ fontSize: 13, color: '#555' }}>
                                                {pd.mobile || '—'}
                                            </TableCell>

                                            {/* Address */}
                                            <TableCell sx={{ fontSize: 12, color: '#777', maxWidth: 160 }}>
                                                <Tooltip title={pd.address || ''} placement="top">
                                                    <span style={{
                                                        display: 'block', overflow: 'hidden',
                                                        textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150,
                                                    }}>
                                                        {pd.address || '—'}
                                                    </span>
                                                </Tooltip>
                                            </TableCell>

                                            {/* Prescription link */}
                                            <TableCell>
                                                {order.prescriptionFileUrl ? (
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => setRxDialog(order.prescriptionFileUrl)}
                                                        sx={{ color: BLUE }}
                                                    >
                                                        <Tooltip title="View Prescription">
                                                            <OpenInNew sx={{ fontSize: 18 }} />
                                                        </Tooltip>
                                                    </IconButton>
                                                ) : (
                                                    <Typography variant="caption" color="text.disabled">—</Typography>
                                                )}
                                            </TableCell>

                                            {/* Price */}
                                            <TableCell>
                                                <Typography fontWeight={800} color={GREEN} fontSize={14}>
                                                    {order.price != null ? `LKR ${order.price}` : '—'}
                                                </Typography>
                                            </TableCell>

                                            {/* Paid on */}
                                            <TableCell sx={{ fontSize: 12, color: '#888' }}>
                                                {formatDate(order.paidAt || order.createdAt)}
                                            </TableCell>

                                            {/* Status */}
                                            <TableCell>
                                                <StatusBadge status={order.status} />
                                            </TableCell>

                                            {/* Action */}
                                            <TableCell sx={{ minWidth: 140 }}>
                                                {order.status === 'paid' && (
                                                    <Button
                                                        size="small" variant="contained"
                                                        disabled={updating === order._id}
                                                        onClick={() => setConfirm({ orderId: order._id, status: 'processing' })}
                                                        sx={{ bgcolor: PURPLE, '&:hover': { bgcolor: '#4A0072' }, fontSize: 11, py: 0.5, borderRadius: 2 }}
                                                    >
                                                        {updating === order._id
                                                            ? <CircularProgress size={13} color="inherit" />
                                                            : 'Mark Processing'}
                                                    </Button>
                                                )}
                                                {order.status === 'processing' && (
                                                    <Button
                                                        size="small" variant="contained"
                                                        disabled={updating === order._id}
                                                        onClick={() => setConfirm({ orderId: order._id, status: 'completed' })}
                                                        sx={{ bgcolor: TEAL, '&:hover': { bgcolor: '#004D40' }, fontSize: 11, py: 0.5, borderRadius: 2 }}
                                                    >
                                                        {updating === order._id
                                                            ? <CircularProgress size={13} color="inherit" />
                                                            : 'Mark Completed'}
                                                    </Button>
                                                )}
                                                {order.status === 'completed' && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <CheckCircleOutlined sx={{ color: TEAL, fontSize: 16 }} />
                                                        <Typography variant="caption" sx={{ color: TEAL, fontWeight: 700 }}>Done</Typography>
                                                    </Box>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Card>

            {/* ── Confirm Status Update Dialog ── */}
            <Dialog open={!!confirm} onClose={() => setConfirm(null)} PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle fontWeight={800}>Confirm Update</DialogTitle>
                <Divider />
                <DialogContent sx={{ pt: 2 }}>
                    <Typography>
                        Mark this order as{' '}
                        <strong style={{ color: confirm?.status === 'processing' ? PURPLE : TEAL }}>
                            {confirm?.status}
                        </strong>
                        ?
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button onClick={() => setConfirm(null)} sx={{ color: '#555' }}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={() => handleUpdate(confirm.orderId, confirm.status)}
                        sx={{ bgcolor: GREEN, '&:hover': { bgcolor: '#0A4A30' }, borderRadius: 2 }}
                    >
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Prescription Preview Dialog ── */}
            <Dialog
                open={!!rxDialog}
                onClose={() => setRxDialog(null)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle fontWeight={800} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Prescription
                    <Button onClick={() => setRxDialog(null)} sx={{ color: '#555', minWidth: 0 }}>✕</Button>
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ p: 2, textAlign: 'center' }}>
                    {rxDialog && (
                        rxDialog.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <img
                                src={rxDialog}
                                alt="Prescription"
                                style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 8 }}
                            />
                        ) : (
                            <Box sx={{ py: 4 }}>
                                <Typography sx={{ mb: 2, color: '#555' }}>
                                    This prescription is a PDF or non-image file.
                                </Typography>
                                <Button
                                    variant="contained"
                                    href={rxDialog}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    startIcon={<OpenInNew />}
                                    sx={{ bgcolor: GREEN, '&:hover': { bgcolor: '#0A4A30' } }}
                                >
                                    Open Prescription
                                </Button>
                            </Box>
                        )
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
}
