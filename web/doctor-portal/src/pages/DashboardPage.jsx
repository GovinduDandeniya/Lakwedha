import React, { useState, useEffect, useCallback } from 'react';
import {
    Grid, Paper, Typography, Box, Card, CardContent,
    Avatar, Chip, Button, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton,
    List, ListItem, ListItemText, ListItemAvatar,
    ListItemIcon, Divider, Tooltip, CircularProgress,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Alert, Snackbar, InputAdornment,
} from '@mui/material';
import {
    CalendarToday, People, EventAvailable,
    CheckCircle, Schedule, LocalHospital,
    NotificationsActive, Payment,
    EventNote, ManageAccounts, TrendingUp, PersonAdd,
    Cancel, Event, Today, Warning, Edit, AttachMoney, Save,
    Description,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AppointmentChart from '../components/dashboard/AppointmentChart';
import EMRUploadDialog from '../components/emr/EMRUploadDialog';

// ── Theme tokens ──────────────────────────────────────────────────────────────
const GREEN      = '#2E7D32';
const BLUE       = '#1565C0';
const LIGHT_BLUE = '#1976D2';
const ORANGE     = '#E65100';
const PURPLE     = '#6A1B9A';
const BG         = '#F0F4F8';

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS = {
    upcoming:  { color: BLUE,     bg: '#E3F2FD', label: 'Upcoming'  },
    confirmed: { color: BLUE,     bg: '#E3F2FD', label: 'Upcoming'  },
    completed: { color: GREEN,    bg: '#E8F5E9', label: 'Completed' },
    cancelled: { color: '#C62828',bg: '#FFEBEE', label: 'Cancelled' },
};

const StatusChip = ({ status }) => {
    const cfg = STATUS[status] || STATUS.upcoming;
    return (
        <Chip label={cfg.label} size="small" sx={{
            bgcolor: cfg.bg, color: cfg.color,
            fontWeight: 700, fontSize: 11, height: 22,
            border: `1px solid ${cfg.color}22`,
        }} />
    );
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ title, value, subtitle, icon, gradient }) => (
    <Card elevation={0} sx={{
        borderRadius: 3, height: '100%',
        background: gradient,
        position: 'relative', overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.3)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    }}>
        <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 500, mb: 0.5 }}>
                        {title}
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#fff', fontWeight: 800, lineHeight: 1 }}>
                        {value}
                    </Typography>
                    {subtitle && (
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.5, display: 'block' }}>
                            {subtitle}
                        </Typography>
                    )}
                </Box>
                <Box sx={{
                    width: 52, height: 52, borderRadius: '50%',
                    bgcolor: 'rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    {React.cloneElement(icon, { sx: { color: '#fff', fontSize: 26 } })}
                </Box>
            </Box>
        </CardContent>
        <Box sx={{
            position: 'absolute', right: -20, bottom: -20,
            width: 100, height: 100, borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.08)',
        }} />
    </Card>
);

// ── Colour palette for hospital cards ─────────────────────────────────────────
const HOSP_GRADIENTS = [
    'linear-gradient(135deg,#1565C0,#1976D2)',
    'linear-gradient(135deg,#6A1B9A,#7B1FA2)',
    'linear-gradient(135deg,#E65100,#F57C00)',
    'linear-gradient(135deg,#00695C,#00796B)',
];

// ── Today's summary info strip ────────────────────────────────────────────────
const TodaySummary = ({ todayApts, sessionHospitals }) => {
    // Use session-info hospitals if available; otherwise fall back to unique hospital names
    const hospitals = (sessionHospitals && sessionHospitals.length > 0)
        ? sessionHospitals
        : [...new Set(todayApts.map(a => a.hospital).filter(Boolean))].map(name => ({
            name, earliestTime: null,
            appointmentCount: todayApts.filter(a => a.hospital === name).length,
        }));

    const totalCols = hospitals.length + 1;
    const mdSize = Math.max(2, Math.floor(12 / totalCols));

    return (
        <Grid container spacing={2} sx={{ mb: 3 }}>
            {hospitals.map((h, idx) => (
                <Grid item xs={12} sm={6} md={mdSize} key={h.name}>
                    <Paper elevation={0} sx={{
                        p: 2, borderRadius: 3,
                        background: HOSP_GRADIENTS[idx % HOSP_GRADIENTS.length],
                        boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                    }}>
                        {/* Hospital name row */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                            <LocalHospital sx={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', flexShrink: 0 }} />
                            <Typography variant="caption"
                                sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 700, lineHeight: 1.25 }}
                                noWrap title={h.name}>
                                {h.name}
                            </Typography>
                        </Box>

                        {/* Session start time */}
                        {h.earliestTime ? (
                            <>
                                <Typography variant="caption"
                                    sx={{ color: 'rgba(255,255,255,0.65)', fontSize: 10, display: 'block', mb: 0.2 }}>
                                    Session starts
                                </Typography>
                                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.5px' }}>
                                    {h.earliestTime}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)', display: 'block', mt: 0.5 }}>
                                    {h.appointmentCount} appointment{h.appointmentCount !== 1 ? 's' : ''}
                                </Typography>
                            </>
                        ) : (
                            <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, lineHeight: 1.1 }}>
                                {h.appointmentCount || '—'}
                            </Typography>
                        )}
                    </Paper>
                </Grid>
            ))}

            {/* Total appointments card */}
            <Grid item xs={12} sm={6} md={mdSize}>
                <Paper elevation={0} sx={{
                    p: 2, borderRadius: 3,
                    background: 'linear-gradient(135deg,#1B5E20,#2E7D32)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                        <CalendarToday sx={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }} />
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 700 }}>
                            Total Appointments
                        </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)', fontSize: 10, display: 'block', mb: 0.2 }}>
                        Today
                    </Typography>
                    <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, lineHeight: 1.1 }}>
                        {todayApts.length}
                    </Typography>
                </Paper>
            </Grid>
        </Grid>
    );
};

// ── Notification type icons ───────────────────────────────────────────────────
const NOTIF_ICON = {
    booking:      <Event fontSize="small" sx={{ color: LIGHT_BLUE }} />,
    cancellation: <Cancel fontSize="small" sx={{ color: '#C62828' }} />,
    payment:      <Payment fontSize="small" sx={{ color: GREEN }} />,
};

// ── Patient display name helper ───────────────────────────────────────────────
const patientDisplayName = (apt) => {
    if (apt.patientTitle && apt.patientFirstName && apt.patientLastName) {
        return `${apt.patientTitle} ${apt.patientFirstName} ${apt.patientLastName}`;
    }
    return apt.patientDisplayName || apt.patientName || '—';
};

// ── Main Dashboard ────────────────────────────────────────────────────────────
const DashboardPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [stats, setStats]               = useState(null);
    const [todayApts, setTodayApts]       = useState([]);
    const [upcoming, setUpcoming]         = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [earnings, setEarnings]         = useState(null);
    const [loading, setLoading]           = useState(true);
    const [todaySessionInfo, setTodaySessionInfo] = useState(null);

    // Fee management
    const [consultationFee, setConsultationFee] = useState('');
    const [hospitalCharge, setHospitalCharge]   = useState(0);
    const [feeEditing, setFeeEditing]           = useState(false);
    const [feeInput, setFeeInput]               = useState('');
    const [feeSaving, setFeeSaving]             = useState(false);
    const [feeError, setFeeError]               = useState('');
    const CHANNELING_RATE = 0.10;

    // Medical records upload
    const [medDialogOpen, setMedDialogOpen]         = useState(false);
    const [medPatientId, setMedPatientId]           = useState('');
    const [medPatientName, setMedPatientName]       = useState('');
    const [medAppointmentId, setMedAppointmentId]   = useState('');
    const [medAppointmentNum, setMedAppointmentNum] = useState('');

    // Cancel session dialog
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [cancelStep, setCancelStep]             = useState(1); // 1 = select, 2 = confirm
    const [cancelDate, setCancelDate]             = useState(new Date().toISOString().slice(0, 10));
    const [cancelHospital, setCancelHospital]     = useState('ALL');
    const [cancelReason, setCancelReason]         = useState('');
    const [cancelLoading, setCancelLoading]       = useState(false);
    const [sessionInfo, setSessionInfo]           = useState(null);
    const [sessionInfoLoading, setSessionInfoLoading] = useState(false);
    const [snackbar, setSnackbar]                 = useState({ open: false, message: '', severity: 'success' });

    // ── Medical Records handlers ───────────────────────────────────────────────
    const openMedDialog = (apt) => {
        const pid = apt.patientId?._id || apt.patientId;
        setMedPatientId(String(pid));
        setMedPatientName(apt.patientId?.name || patientDisplayName(apt));
        setMedAppointmentId(String(apt.id || apt._id || ''));
        setMedAppointmentNum(String(apt.appointmentNumber || ''));
        setMedDialogOpen(true);
    };

    const fetchAll = useCallback(async () => {
        const todayStr = new Date().toISOString().slice(0, 10);
        try {
            const [sRes, tRes, uRes, nRes, eRes, siRes, feeRes] = await Promise.all([
                api.get('/dashboard/stats'),
                api.get('/dashboard/today-appointments'),
                api.get('/dashboard/upcoming'),
                api.get('/dashboard/notifications'),
                api.get('/dashboard/earnings'),
                api.get(`/dashboard/session-info?date=${todayStr}`),
                api.get('/doctor-channeling/doctors/me/fee').catch(() => ({ data: { consultationFee: 0 } })),
            ]);
            setStats(sRes.data);
            setTodayApts((tRes.data.data || []).filter(a => a.status !== 'pending'));
            setUpcoming((uRes.data.data || []).filter(a => a.status !== 'pending'));
            setNotifications(nRes.data.data || []);
            setEarnings(eRes.data.data || null);
            setTodaySessionInfo(siRes.data || null);
            const fee = feeRes.data?.consultationFee ?? 0;
            setConsultationFee(fee);
            setFeeInput(String(fee));
            setHospitalCharge(feeRes.data?.hospitalCharge ?? 0);
        } catch (err) {
            console.error('Dashboard fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSaveFee = async () => {
        const val = Number(feeInput);
        if (isNaN(val) || val < 0) { setFeeError('Enter a valid amount'); return; }
        setFeeSaving(true);
        setFeeError('');
        try {
            const res = await api.put('/doctor-channeling/doctors/me/fee', { consultationFee: val });
            setConsultationFee(res.data.consultationFee);
            setFeeInput(String(res.data.consultationFee));
            setFeeEditing(false);
        } catch (err) {
            setFeeError(err.response?.data?.error || 'Failed to save fee');
        } finally {
            setFeeSaving(false);
        }
    };

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handleMarkComplete = async (id) => {
        try {
            await api.patch(`/dashboard/appointments/${id}/complete`);
            setTodayApts(prev => prev.map(a => a.id === id ? { ...a, status: 'completed' } : a));
        } catch (err) {
            console.error('Mark complete error:', err);
        }
    };

    const fetchSessionInfo = useCallback(async (date) => {
        setSessionInfoLoading(true);
        setSessionInfo(null);
        try {
            const res = await api.get(`/dashboard/session-info?date=${date}`);
            setSessionInfo(res.data);
        } catch {
            setSessionInfo({ hospitals: [] });
        } finally {
            setSessionInfoLoading(false);
        }
    }, []);

    const openCancelDialog = () => {
        const d = new Date().toISOString().slice(0, 10);
        setCancelDate(d);
        setCancelHospital('ALL');
        setCancelReason('');
        setCancelStep(1);
        setCancelDialogOpen(true);
        fetchSessionInfo(d);
    };

    const handleCancelDateChange = (newDate) => {
        setCancelDate(newDate);
        setCancelHospital('ALL');
        setCancelStep(1);
        fetchSessionInfo(newDate);
    };

    // Compute which hospital option is selected and whether it can be cancelled
    const hospitalsInfo = sessionInfo?.hospitals || [];
    const selectedHospitalInfo = cancelHospital === 'ALL'
        ? { canCancel: hospitalsInfo.some(h => h.canCancel), appointmentCount: hospitalsInfo.filter(h => h.canCancel).reduce((s, h) => s + h.appointmentCount, 0) }
        : hospitalsInfo.find(h => h.name === cancelHospital);
    const canProceed = !sessionInfoLoading && (selectedHospitalInfo?.canCancel ?? false) && (selectedHospitalInfo?.appointmentCount ?? 0) > 0;

    const formatDeadline = (minutes) => {
        if (minutes === null) return null;
        const abs = Math.abs(Math.round(minutes));
        const h = Math.floor(abs / 60), m = abs % 60;
        const time = h > 0 ? `${h}h ${m}m` : `${m}m`;
        return minutes > 0 ? `Deadline in ${time}` : `Missed by ${time}`;
    };

    const handleCancelSession = async () => {
        setCancelLoading(true);
        try {
            const res = await api.post('/dashboard/cancel-session', {
                date: cancelDate,
                hospital: cancelHospital,
                reason: cancelReason.trim() || undefined,
            });
            const count = res.data.affectedCount ?? 0;
            const hosp = res.data.hospital === 'ALL' ? 'All hospitals' : res.data.hospital;
            setSnackbar({
                open: true,
                message: `${hosp} session cancelled. ${count} patient(s) notified in the app.`,
                severity: 'success',
            });
            setCancelDialogOpen(false);
            fetchAll();
        } catch (err) {
            const msg = err.response?.data?.error || 'Failed to cancel session. Please try again.';
            setSnackbar({ open: true, message: msg, severity: 'error' });
            setCancelStep(1);
        } finally {
            setCancelLoading(false);
        }
    };

    const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <CircularProgress sx={{ color: GREEN }} />
            </Box>
        );
    }

    return (
        <Box sx={{ bgcolor: BG, minHeight: '100vh', p: { xs: 2, md: 3 } }}>

            {/* ── 1. Welcome Card ─────────────────────────────────────────── */}
            <Paper elevation={0} sx={{
                mb: 3, p: 3, borderRadius: 3,
                background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #388E3C 100%)',
                boxShadow: '0 4px 24px rgba(46,125,50,0.3)',
                position: 'relative', overflow: 'hidden',
            }}>
                <Box sx={{ position: 'absolute', right: -30, top: -30, width: 180, height: 180, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
                <Box sx={{ position: 'absolute', right: 60, bottom: -40, width: 120, height: 120, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 60, height: 60, bgcolor: 'rgba(255,255,255,0.2)', fontSize: 22, fontWeight: 700 }}>
                            {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'DR'}
                        </Avatar>
                        <Box>
                            <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800 }}>
                                Welcome, {user?.name || 'Doctor'}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.3 }}>
                                {user?.specialization || 'General Physician'}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                <Today sx={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }} />
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                    {todayDate}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                        <Box sx={{ textAlign: 'right', display: { xs: 'none', md: 'block' } }}>
                            <Typography variant="h3" sx={{ color: 'rgba(255,255,255,0.15)', fontWeight: 900, lineHeight: 1 }}>
                                {stats?.todayAppointments ?? 0}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                appointments today
                            </Typography>
                        </Box>
                        <Button
                            variant="contained"
                            startIcon={<Cancel />}
                            onClick={openCancelDialog}
                            sx={{
                                bgcolor: 'rgba(198,40,40,0.85)',
                                color: '#fff',
                                fontWeight: 700,
                                textTransform: 'none',
                                fontSize: 13,
                                borderRadius: 2,
                                px: 2,
                                py: 0.8,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                                '&:hover': { bgcolor: '#C62828' },
                            }}
                        >
                            Cancel Session
                        </Button>
                    </Box>
                </Box>
            </Paper>

            {/* ── 2. Today's Summary Strip ─────────────────────────────────── */}
            <TodaySummary todayApts={todayApts} sessionHospitals={todaySessionInfo?.hospitals} />

            {/* ── 3. Stat Cards ───────────────────────────────────────────── */}
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={4}>
                    <StatCard
                        title="Today's Appointments"
                        value={stats?.todayAppointments ?? 0}
                        subtitle={`${stats?.completedToday ?? 0} completed · ${stats?.pendingToday ?? 0} pending`}
                        icon={<CalendarToday />}
                        gradient="linear-gradient(135deg, #1565C0, #1976D2)"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <StatCard
                        title="Upcoming Appointments"
                        value={stats?.upcomingAppointments ?? 0}
                        subtitle="Next few days"
                        icon={<EventAvailable />}
                        gradient="linear-gradient(135deg, #1B5E20, #2E7D32)"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <StatCard
                        title="Total Patients Seen"
                        value={stats?.totalPatients ?? 0}
                        subtitle="All time"
                        icon={<People />}
                        gradient="linear-gradient(135deg, #E65100, #F57C00)"
                    />
                </Grid>
            </Grid>

            {/* ── 4. Fee Management Card ──────────────────────────────────── */}
            <Paper elevation={0} sx={{
                mb: 3, p: 3, borderRadius: 3,
                border: '1px solid #E8EDF2',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                    <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AttachMoney sx={{ color: GREEN, fontSize: 22 }} />
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight={800}>My Consultation Fee</Typography>
                        <Typography variant="caption" color="text.secondary">
                            Patients see: Doctor Fee + Hospital Charge + 10% Channeling Fee = Total
                        </Typography>
                    </Box>
                </Box>

                <Grid container spacing={3} alignItems="center">
                    {/* Fee input */}
                    <Grid item xs={12} sm={5}>
                        {feeEditing ? (
                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                <TextField
                                    label="Consultation Fee"
                                    type="number"
                                    value={feeInput}
                                    onChange={e => setFeeInput(e.target.value)}
                                    size="small"
                                    error={!!feeError}
                                    helperText={feeError || ' '}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">LKR</InputAdornment>,
                                        inputProps: { min: 0 },
                                    }}
                                    sx={{ flex: 1 }}
                                    autoFocus
                                />
                                <Button
                                    variant="contained"
                                    onClick={handleSaveFee}
                                    disabled={feeSaving}
                                    startIcon={feeSaving ? <CircularProgress size={14} color="inherit" /> : <Save />}
                                    sx={{ bgcolor: GREEN, '&:hover': { bgcolor: '#1B5E20' }, textTransform: 'none', mt: 0.3, minWidth: 90 }}
                                >
                                    {feeSaving ? 'Saving…' : 'Save'}
                                </Button>
                                <Button
                                    variant="text"
                                    onClick={() => { setFeeEditing(false); setFeeInput(String(consultationFee)); setFeeError(''); }}
                                    sx={{ color: '#888', textTransform: 'none', mt: 0.3 }}
                                >
                                    Cancel
                                </Button>
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Your Fee</Typography>
                                    <Typography variant="h4" fontWeight={900} sx={{ color: GREEN, lineHeight: 1.1 }}>
                                        LKR {Number(consultationFee).toLocaleString()}
                                    </Typography>
                                </Box>
                                <Button
                                    variant="outlined"
                                    startIcon={<Edit />}
                                    onClick={() => setFeeEditing(true)}
                                    size="small"
                                    sx={{ borderColor: GREEN, color: GREEN, textTransform: 'none', '&:hover': { borderColor: GREEN, bgcolor: '#E8F5E9' } }}
                                >
                                    Edit
                                </Button>
                            </Box>
                        )}
                    </Grid>

                    {/* Fee breakdown preview */}
                    <Grid item xs={12} sm={7}>
                        <Box sx={{ bgcolor: '#F8FAF8', borderRadius: 2.5, p: 2.5, border: '1px solid #E0EFE0' }}>
                            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 1.5, display: 'block', letterSpacing: 0.5 }}>
                                PATIENT PAYMENT BREAKDOWN
                            </Typography>
                            {(() => {
                                const docFee   = Number(feeEditing ? feeInput : consultationFee) || 0;
                                const hospFee  = hospitalCharge;
                                const chanFee  = Math.round((docFee + hospFee) * CHANNELING_RATE);
                                const total    = docFee + hospFee + chanFee;
                                return (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                                        {[
                                            { label: 'Doctor Fee (you set)',   amount: docFee,  color: GREEN      },
                                            { label: 'Hospital Charge (admin sets)', amount: hospFee, color: '#1565C0' },
                                            { label: '10% Channeling Fee',     amount: chanFee, color: ORANGE     },
                                        ].map(({ label, amount, color }) => (
                                            <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color }} />
                                                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                                                </Box>
                                                <Typography variant="caption" fontWeight={700} sx={{ color }}>
                                                    LKR {amount.toLocaleString()}
                                                </Typography>
                                            </Box>
                                        ))}
                                        <Divider sx={{ my: 0.5 }} />
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="body2" fontWeight={800}>Total Patient Pays</Typography>
                                            <Typography variant="body1" fontWeight={900} sx={{ color: PURPLE }}>
                                                LKR {total.toLocaleString()}
                                            </Typography>
                                        </Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                                            * Hospital charge is set by admin per session. Shown above is your next upcoming session's charge.
                                        </Typography>
                                    </Box>
                                );
                            })()}
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* ── 5. Today's Appointments Table + Notifications ────────────── */}
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                {/* Today's Appointments Table */}
                <Grid item xs={12} md={8}>
                    <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #E8EDF2' }}>
                        <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F0F4F8' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CalendarToday sx={{ color: GREEN, fontSize: 20 }} />
                                <Typography variant="h6" fontWeight={700}>Today's Appointments</Typography>
                            </Box>
                            <Button
                                size="small"
                                onClick={() => navigate('/appointments')}
                                sx={{ color: GREEN, fontWeight: 600, textTransform: 'none' }}
                            >
                                View All
                            </Button>
                        </Box>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#F8FAF8' }}>
                                        {['No.', 'Patient', 'Age', 'Hospital', 'Status', 'Actions'].map(col => (
                                            <TableCell key={col} sx={{ fontWeight: 700, fontSize: 12, color: '#555', py: 1.2 }}>
                                                {col}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {todayApts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#999' }}>
                                                No appointments today
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        [...todayApts]
                                            .sort((a, b) => {
                                                // Primary: hospital A→Z
                                                const hCmp = (a.hospital || '').localeCompare(b.hospital || '');
                                                if (hCmp !== 0) return hCmp;
                                                // Secondary: appointment number ascending (1 → last)
                                                return (parseInt(a.appointmentNumber) || 0) - (parseInt(b.appointmentNumber) || 0);
                                            })
                                            .map((apt) => {
                                            const name = patientDisplayName(apt);
                                            return (
                                                <TableRow key={apt.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                                    <TableCell sx={{ fontSize: 12, fontWeight: 700, color: GREEN, py: 1.5 }}>
                                                        No {apt.appointmentNumber}
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Avatar sx={{ width: 28, height: 28, fontSize: 11, bgcolor: '#E8F5E9', color: GREEN }}>
                                                                {name.charAt(0)}
                                                            </Avatar>
                                                            {name}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        {apt.patientAge != null && (
                                                            <Chip label={`Age ${apt.patientAge}`} size="small"
                                                                sx={{ bgcolor: '#F0F4F8', color: '#444', fontSize: 11, height: 20, fontWeight: 600 }}
                                                            />
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <LocalHospital sx={{ fontSize: 13, color: '#888' }} />
                                                            <Typography variant="body2" fontSize={12}>{apt.hospital}</Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <StatusChip status={apt.status} />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                            {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                                                                <Tooltip title="Mark as Completed">
                                                                    <IconButton
                                                                        size="small"
                                                                        sx={{ color: GREEN }}
                                                                        onClick={() => handleMarkComplete(apt.id)}
                                                                    >
                                                                        <CheckCircle fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}
                                                            {(apt.patientId?._id || apt.patientId) && (
                                                                <Tooltip title="Upload Medical Record">
                                                                    <IconButton
                                                                        size="small"
                                                                        sx={{ color: LIGHT_BLUE }}
                                                                        onClick={() => openMedDialog(apt)}
                                                                    >
                                                                        <Description fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>

                {/* Notifications Panel */}
                <Grid item xs={12} md={4}>
                    <Paper elevation={0} sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #E8EDF2', height: '100%' }}>
                        <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #F0F4F8' }}>
                            <NotificationsActive sx={{ color: GREEN, fontSize: 20 }} />
                            <Typography variant="h6" fontWeight={700}>Notifications</Typography>
                        </Box>
                        <List disablePadding>
                            {notifications.slice(0, 5).map((n, idx) => (
                                <React.Fragment key={n.id}>
                                    <ListItem
                                        alignItems="flex-start"
                                        sx={{
                                            py: 1.5, px: 2,
                                            bgcolor: n.read ? 'transparent' : 'rgba(46,125,50,0.04)',
                                            borderLeft: n.read ? '3px solid transparent' : `3px solid ${GREEN}`,
                                        }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 36, mt: 0.3 }}>
                                            {NOTIF_ICON[n.type] || <NotificationsActive fontSize="small" />}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Typography variant="body2" sx={{ fontWeight: n.read ? 400 : 600, fontSize: 13, lineHeight: 1.4 }}>
                                                    {n.message}
                                                </Typography>
                                            }
                                            secondary={
                                                <Typography variant="caption" color="text.secondary">{n.time}</Typography>
                                            }
                                        />
                                    </ListItem>
                                    {idx < 4 && <Divider />}
                                </React.Fragment>
                            ))}
                        </List>
                    </Paper>
                </Grid>
            </Grid>

            {/* ── Medical Records Upload Dialog ────────────────────────────── */}
            <EMRUploadDialog
                open={medDialogOpen}
                onClose={() => setMedDialogOpen(false)}
                patientId={medPatientId}
                patientName={medPatientName}
                appointmentId={medAppointmentId}
                appointmentNumber={medAppointmentNum}
            />

            {/* ── Cancel Session Dialog ────────────────────────────────────── */}
            <Dialog open={cancelDialogOpen} onClose={() => !cancelLoading && setCancelDialogOpen(false)}
                maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>

                {/* ── STEP 1: Select date, hospital, reason ── */}
                {cancelStep === 1 && (<>
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
                        <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: '#FFEBEE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Cancel sx={{ color: '#C62828', fontSize: 20 }} />
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight={800}>Cancel Session</Typography>
                            <Typography variant="caption" color="text.secondary">
                                Must cancel at least <strong>10 hours</strong> before session start
                            </Typography>
                        </Box>
                    </DialogTitle>
                    <DialogContent sx={{ pt: 1 }}>

                        {/* Date picker */}
                        <TextField
                            label="Session Date"
                            type="date"
                            fullWidth
                            value={cancelDate}
                            onChange={e => handleCancelDateChange(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ mb: 2.5 }}
                            size="small"
                        />

                        {/* Hospital selector */}
                        <Typography variant="body2" fontWeight={700} sx={{ mb: 1, color: '#555' }}>
                            Select Hospital to Cancel
                        </Typography>

                        {sessionInfoLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                <CircularProgress size={24} sx={{ color: GREEN }} />
                            </Box>
                        ) : hospitalsInfo.length === 0 ? (
                            <Alert severity="info" sx={{ borderRadius: 2, mb: 2, fontSize: 13 }}>
                                No active sessions found for this date.
                            </Alert>
                        ) : (
                            <Box sx={{ mb: 2.5 }}>
                                {/* All Hospitals option */}
                                {hospitalsInfo.length > 1 && (() => {
                                    const allCount = hospitalsInfo.filter(h => h.canCancel).reduce((s, h) => s + h.appointmentCount, 0);
                                    const allCanCancel = hospitalsInfo.some(h => h.canCancel);
                                    const isSelected = cancelHospital === 'ALL';
                                    return (
                                        <Paper
                                            onClick={() => allCanCancel && setCancelHospital('ALL')}
                                            elevation={0}
                                            sx={{
                                                p: 1.5, mb: 1, borderRadius: 2,
                                                cursor: allCanCancel ? 'pointer' : 'not-allowed',
                                                border: isSelected ? '2px solid #C62828' : '2px solid #E8EDF2',
                                                bgcolor: isSelected ? '#FFF3F3' : (allCanCancel ? '#FAFAFA' : '#F5F5F5'),
                                                opacity: allCanCancel ? 1 : 0.55,
                                                display: 'flex', alignItems: 'center', gap: 1.5,
                                                transition: 'all 0.15s',
                                            }}
                                        >
                                            <Box sx={{
                                                width: 20, height: 20, borderRadius: '50%',
                                                border: `2px solid ${isSelected ? '#C62828' : '#ccc'}`,
                                                bgcolor: isSelected ? '#C62828' : 'transparent',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                            }}>
                                                {isSelected && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#fff' }} />}
                                            </Box>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="body2" fontWeight={700}>All Hospitals</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {allCanCancel ? `${allCount} cancellable appointment(s)` : 'Some sessions past deadline'}
                                                </Typography>
                                            </Box>
                                        </Paper>
                                    );
                                })()}

                                {/* Individual hospital options */}
                                {hospitalsInfo.map(h => {
                                    const isSelected = cancelHospital === h.name;
                                    const deadline = formatDeadline(h.minutesUntilDeadline);
                                    return (
                                        <Paper
                                            key={h.name}
                                            onClick={() => h.canCancel && setCancelHospital(h.name)}
                                            elevation={0}
                                            sx={{
                                                p: 1.5, mb: 1, borderRadius: 2,
                                                cursor: h.canCancel ? 'pointer' : 'not-allowed',
                                                border: isSelected ? '2px solid #C62828' : '2px solid #E8EDF2',
                                                bgcolor: isSelected ? '#FFF3F3' : (h.canCancel ? '#FAFAFA' : '#F5F5F5'),
                                                opacity: h.canCancel ? 1 : 0.55,
                                                display: 'flex', alignItems: 'center', gap: 1.5,
                                                transition: 'all 0.15s',
                                            }}
                                        >
                                            <Box sx={{
                                                width: 20, height: 20, borderRadius: '50%',
                                                border: `2px solid ${isSelected ? '#C62828' : '#ccc'}`,
                                                bgcolor: isSelected ? '#C62828' : 'transparent',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                            }}>
                                                {isSelected && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#fff' }} />}
                                            </Box>
                                            <Box sx={{ flex: 1 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="body2" fontWeight={700}>{h.name}</Typography>
                                                    {!h.canCancel && (
                                                        <Chip label="Too late" size="small"
                                                            sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: '#FFEBEE', color: '#C62828' }} />
                                                    )}
                                                </Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    {h.appointmentCount} appointment(s) · Session starts {h.earliestTime}
                                                    {deadline && ` · ${deadline}`}
                                                </Typography>
                                            </Box>
                                        </Paper>
                                    );
                                })}
                            </Box>
                        )}

                        {/* Reason */}
                        <TextField
                            label="Reason for Cancellation (optional)"
                            fullWidth multiline rows={2}
                            value={cancelReason}
                            onChange={e => setCancelReason(e.target.value)}
                            placeholder="e.g. Medical emergency, personal commitment…"
                            size="small"
                        />
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                        <Button onClick={() => setCancelDialogOpen(false)}
                            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}>
                            Close
                        </Button>
                        <Button
                            variant="contained"
                            disabled={!canProceed}
                            onClick={() => setCancelStep(2)}
                            sx={{ bgcolor: '#C62828', '&:hover': { bgcolor: '#B71C1C' }, textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                        >
                            Review Cancellation →
                        </Button>
                    </DialogActions>
                </>)}

                {/* ── STEP 2: Final confirmation ── */}
                {cancelStep === 2 && (<>
                    <DialogTitle sx={{ pb: 0 }} />
                    <DialogContent>
                        <Box sx={{ textAlign: 'center', py: 1 }}>
                            <Box sx={{
                                width: 64, height: 64, borderRadius: '50%', bgcolor: '#FFEBEE',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2,
                            }}>
                                <Warning sx={{ color: '#C62828', fontSize: 34 }} />
                            </Box>
                            <Typography variant="h6" fontWeight={800} gutterBottom>
                                Confirm Cancellation
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                You are about to cancel the session at
                            </Typography>

                            {/* Summary box */}
                            <Paper elevation={0} sx={{ bgcolor: '#FFF3F3', border: '1.5px solid #FFCDD2', borderRadius: 2, p: 2, mb: 2, textAlign: 'left' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="body2" color="text.secondary">Hospital</Typography>
                                    <Typography variant="body2" fontWeight={700}>
                                        {cancelHospital === 'ALL' ? 'All Hospitals' : cancelHospital}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="body2" color="text.secondary">Date</Typography>
                                    <Typography variant="body2" fontWeight={700}>
                                        {new Date(cancelDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: cancelReason ? 0.5 : 0 }}>
                                    <Typography variant="body2" color="text.secondary">Patients affected</Typography>
                                    <Typography variant="body2" fontWeight={700} sx={{ color: '#C62828' }}>
                                        {selectedHospitalInfo?.appointmentCount ?? '—'} patient(s)
                                    </Typography>
                                </Box>
                                {cancelReason && (
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="body2" color="text.secondary">Reason</Typography>
                                        <Typography variant="body2" fontWeight={600} sx={{ maxWidth: '60%', textAlign: 'right' }}>
                                            {cancelReason}
                                        </Typography>
                                    </Box>
                                )}
                                {(() => {
                                    const count = selectedHospitalInfo?.appointmentCount ?? 0;
                                    if (count === 0) return null;
                                    const channelingFeePerApt = Math.round((consultationFee + hospitalCharge) * CHANNELING_RATE);
                                    const chargePerApt        = Math.round(channelingFeePerApt * 0.06);
                                    const totalCharge         = chargePerApt * count;
                                    return (
                                        <Box sx={{ mt: 0.5, pt: 0.5, borderTop: '1px dashed #FFCDD2' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="body2" color="text.secondary">Cancellation charge (6%)</Typography>
                                                <Typography variant="body2" fontWeight={800} sx={{ color: '#E65100' }}>
                                                    LKR {totalCharge.toLocaleString()}
                                                </Typography>
                                            </Box>
                                            <Typography variant="caption" color="text.secondary">
                                                {count} patient(s) × LKR {chargePerApt} per appointment
                                            </Typography>
                                        </Box>
                                    );
                                })()}
                            </Paper>

                            <Alert severity="error" sx={{ borderRadius: 2, fontSize: 12, textAlign: 'left', mb: 1 }}>
                                All <strong>{selectedHospitalInfo?.appointmentCount ?? ''} patients</strong> will immediately receive an in-app notification. <strong>This cannot be undone.</strong>
                            </Alert>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                        <Button onClick={() => setCancelStep(1)} disabled={cancelLoading}
                            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}>
                            ← Go Back
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleCancelSession}
                            disabled={cancelLoading}
                            startIcon={cancelLoading ? <CircularProgress size={16} color="inherit" /> : <Warning />}
                            sx={{ bgcolor: '#C62828', '&:hover': { bgcolor: '#B71C1C' }, textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 3 }}
                        >
                            {cancelLoading ? 'Cancelling…' : 'Yes, Cancel Session'}
                        </Button>
                    </DialogActions>
                </>)}
            </Dialog>

            {/* ── Snackbar ──────────────────────────────────────────────────── */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={5000}
                onClose={() => setSnackbar(s => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}
                    sx={{ borderRadius: 2, fontWeight: 600 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* ── 5. Upcoming Schedule + Earnings + Quick Actions ───────────── */}
            <Grid container spacing={2.5}>
                {/* Upcoming Schedule */}
                <Grid item xs={12} md={4}>
                    <Paper elevation={0} sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #E8EDF2' }}>
                        <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #F0F4F8' }}>
                            <Schedule sx={{ color: LIGHT_BLUE, fontSize: 20 }} />
                            <Typography variant="h6" fontWeight={700}>Upcoming Schedule</Typography>
                        </Box>
                        <List disablePadding>
                            {upcoming.map((u, idx) => {
                                const name = patientDisplayName(u);
                                return (
                                    <React.Fragment key={u.id}>
                                        <ListItem alignItems="flex-start" sx={{ py: 1.5, px: 2 }}>
                                            <ListItemAvatar>
                                                <Avatar sx={{ width: 36, height: 36, bgcolor: '#E3F2FD', color: LIGHT_BLUE, fontSize: 12, fontWeight: 700 }}>
                                                    {u.date?.slice(8, 10)}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Typography variant="body2" fontWeight={600} fontSize={13}>{name}</Typography>
                                                }
                                                secondary={
                                                    <Box>
                                                        <Typography variant="caption" color="text.secondary" display="block">
                                                            {u.date} · {u.time}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                                            <LocalHospital sx={{ fontSize: 11, color: '#888' }} />
                                                            <Typography variant="caption" color="text.secondary">{u.hospital}</Typography>
                                                        </Box>
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                        {idx < upcoming.length - 1 && <Divider />}
                                    </React.Fragment>
                                );
                            })}
                        </List>
                    </Paper>
                </Grid>

                {/* Earnings Overview */}
                <Grid item xs={12} md={4}>
                    <Paper elevation={0} sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #E8EDF2' }}>
                        <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #F0F4F8' }}>
                            <Payment sx={{ color: PURPLE, fontSize: 20 }} />
                            <Typography variant="h6" fontWeight={700}>Earnings Overview</Typography>
                        </Box>
                        <Box sx={{ p: 3 }}>
                            {[
                                { label: 'Doctor Fee',      value: earnings?.doctorFee,      color: GREEN       },
                                { label: 'Channeling Fee',  value: earnings?.channelingFee,  color: LIGHT_BLUE  },
                                { label: 'Total (Today)',   value: earnings?.totalToday,     color: PURPLE      },
                            ].map(({ label, value, color }) => (
                                <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
                                        <Typography variant="body2" color="text.secondary">{label}</Typography>
                                    </Box>
                                    <Typography variant="body2" fontWeight={700} sx={{ color }}>
                                        LKR {(value ?? 0).toLocaleString()}
                                    </Typography>
                                </Box>
                            ))}
                            <Divider sx={{ my: 1.5 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" fontWeight={700}>Total (Month)</Typography>
                                <Typography variant="body1" fontWeight={800} sx={{ color: GREEN }}>
                                    LKR {(earnings?.totalMonth ?? 0).toLocaleString()}
                                </Typography>
                            </Box>
                            <Box sx={{ mt: 2.5 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
                                    Weekly Trend
                                </Typography>
                                <AppointmentChart
                                    weeklyData={earnings?.weeklyTrend}
                                    weekDays={earnings?.weekDays}
                                />
                            </Box>
                        </Box>
                    </Paper>
                </Grid>

                {/* Quick Actions */}
                <Grid item xs={12} md={4}>
                    <Paper elevation={0} sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #E8EDF2', height: '100%' }}>
                        <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #F0F4F8' }}>
                            <TrendingUp sx={{ color: ORANGE, fontSize: 20 }} />
                            <Typography variant="h6" fontWeight={700}>Quick Actions</Typography>
                        </Box>
                        <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {[
                                { label: 'View Appointments', desc: 'See all scheduled appointments', icon: <EventNote />,      color: LIGHT_BLUE, bg: '#E3F2FD', path: '/appointments' },
                                { label: 'Update Schedule',   desc: 'Manage your availability',       icon: <Schedule />,       color: GREEN,      bg: '#E8F5E9', path: '/availability' },
                                { label: 'Manage Profile',    desc: 'Update your profile info',       icon: <ManageAccounts />, color: PURPLE,     bg: '#F3E5F5', path: '/profile'       },
                                { label: 'My Patients',       desc: 'View patient history',           icon: <PersonAdd />,      color: ORANGE,     bg: '#FFF3E0', path: '/patients'      },
                            ].map(({ label, desc, icon, color, bg, path }) => (
                                <Button
                                    key={label}
                                    fullWidth
                                    variant="text"
                                    onClick={() => navigate(path)}
                                    sx={{
                                        justifyContent: 'flex-start', textAlign: 'left',
                                        p: 1.5, borderRadius: 2, textTransform: 'none',
                                        bgcolor: bg, color,
                                        '&:hover': { bgcolor: bg, filter: 'brightness(0.95)' },
                                        gap: 1.5,
                                    }}
                                    startIcon={
                                        <Box sx={{
                                            width: 36, height: 36, borderRadius: 1.5,
                                            bgcolor: `${color}22`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            {React.cloneElement(icon, { sx: { color, fontSize: 20 } })}
                                        </Box>
                                    }
                                >
                                    <Box>
                                        <Typography variant="body2" fontWeight={700} sx={{ color, lineHeight: 1.2 }}>{label}</Typography>
                                        <Typography variant="caption" sx={{ color: `${color}bb`, fontWeight: 400 }}>{desc}</Typography>
                                    </Box>
                                </Button>
                            ))}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default DashboardPage;
