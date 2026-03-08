import React, { useState, useEffect, useCallback } from 'react';
import {
    Grid, Paper, Typography, Box, Card, CardContent,
    Avatar, Chip, Button, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton,
    List, ListItem, ListItemText, ListItemAvatar,
    ListItemIcon, Divider, Tooltip, CircularProgress,
} from '@mui/material';
import {
    CalendarToday, People, MonetizationOn, EventAvailable,
    CheckCircle, Visibility, Schedule, LocalHospital,
    AccessTime, NotificationsActive, Payment,
    EventNote, ManageAccounts, TrendingUp, PersonAdd,
    Cancel, Event, Today,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AppointmentChart from '../components/dashboard/AppointmentChart';

// ── Theme tokens ──────────────────────────────────────────────────────────────
const GREEN  = '#2E7D32';
const BLUE   = '#1565C0';
const LIGHT_BLUE = '#1976D2';
const ORANGE     = '#E65100';
const PURPLE     = '#6A1B9A';
const BG         = '#F0F4F8';

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS = {
    completed:   { color: GREEN,  bg: '#E8F5E9', label: 'Completed' },
    confirmed:   { color: BLUE,   bg: '#E3F2FD', label: 'Confirmed' },
    pending:     { color: '#E65100', bg: '#FFF3E0', label: 'Pending' },
    cancelled:   { color: '#C62828', bg: '#FFEBEE', label: 'Cancelled' },
};

const StatusChip = ({ status }) => {
    const cfg = STATUS[status] || STATUS.pending;
    return (
        <Chip
            label={cfg.label}
            size="small"
            sx={{
                bgcolor: cfg.bg, color: cfg.color,
                fontWeight: 700, fontSize: 11, height: 22,
                border: `1px solid ${cfg.color}22`,
            }}
        />
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
        {/* Decorative circle */}
        <Box sx={{
            position: 'absolute', right: -20, bottom: -20,
            width: 100, height: 100, borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.08)',
        }} />
    </Card>
);

// ── Notification type icons ───────────────────────────────────────────────────
const NOTIF_ICON = {
    booking:      <Event fontSize="small" sx={{ color: LIGHT_BLUE }} />,
    cancellation: <Cancel fontSize="small" sx={{ color: '#C62828' }} />,
    payment:      <Payment fontSize="small" sx={{ color: GREEN }} />,
};

// ── Main Dashboard ────────────────────────────────────────────────────────────
const DashboardPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [stats, setStats] = useState(null);
    const [todayApts, setTodayApts] = useState([]);
    const [upcoming, setUpcoming] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [earnings, setEarnings] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchAll = useCallback(async () => {
        try {
            const [sRes, tRes, uRes, nRes, eRes] = await Promise.all([
                api.get('/dashboard/stats'),
                api.get('/dashboard/today-appointments'),
                api.get('/dashboard/upcoming'),
                api.get('/dashboard/notifications'),
                api.get('/dashboard/earnings'),
            ]);
            setStats(sRes.data);
            setTodayApts(tRes.data.data || []);
            setUpcoming(uRes.data.data || []);
            setNotifications(nRes.data.data || []);
            setEarnings(eRes.data.data || null);
        } catch (err) {
            console.error('Dashboard fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handleMarkComplete = async (id) => {
        try {
            await api.patch(`/dashboard/appointments/${id}/complete`);
            setTodayApts(prev => prev.map(a => a.id === id ? { ...a, status: 'completed' } : a));
        } catch (err) {
            console.error('Mark complete error:', err);
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
                    <Box sx={{ textAlign: 'right', display: { xs: 'none', md: 'block' } }}>
                        <Typography variant="h3" sx={{ color: 'rgba(255,255,255,0.15)', fontWeight: 900, lineHeight: 1 }}>
                            {stats?.todayAppointments ?? 0}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                            appointments today
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            {/* ── 2. Stat Cards ───────────────────────────────────────────── */}
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Today's Appointments"
                        value={stats?.todayAppointments ?? 0}
                        subtitle={`${stats?.completedToday ?? 0} completed · ${stats?.pendingToday ?? 0} pending`}
                        icon={<CalendarToday />}
                        gradient="linear-gradient(135deg, #1565C0, #1976D2)"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Upcoming Appointments"
                        value={stats?.upcomingAppointments ?? 0}
                        subtitle="Next few days"
                        icon={<EventAvailable />}
                        gradient="linear-gradient(135deg, #1B5E20, #2E7D32)"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Patients"
                        value={stats?.totalPatients ?? 0}
                        subtitle="All time"
                        icon={<People />}
                        gradient="linear-gradient(135deg, #E65100, #F57C00)"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Today's Earnings"
                        value={`LKR ${(stats?.earningsToday ?? 0).toLocaleString()}`}
                        subtitle={`Month: LKR ${(stats?.earningsMonth ?? 0).toLocaleString()}`}
                        icon={<MonetizationOn />}
                        gradient="linear-gradient(135deg, #4A148C, #6A1B9A)"
                    />
                </Grid>
            </Grid>

            {/* ── 3. Today's Appointments Table + Notifications ────────────── */}
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
                                        {['#', 'Patient Name', 'Time', 'Hospital', 'Status', 'Actions'].map(col => (
                                            <TableCell key={col} sx={{ fontWeight: 700, fontSize: 12, color: '#555', py: 1.2 }}>
                                                {col}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {todayApts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#999' }}>
                                                No appointments today
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        todayApts.map((apt) => (
                                            <TableRow key={apt.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                                <TableCell sx={{ fontSize: 12, color: '#888', py: 1.5 }}>{apt.appointmentNumber}</TableCell>
                                                <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Avatar sx={{ width: 28, height: 28, fontSize: 11, bgcolor: '#E8F5E9', color: GREEN }}>
                                                            {apt.patientName.charAt(0)}
                                                        </Avatar>
                                                        {apt.patientName}
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <AccessTime sx={{ fontSize: 13, color: '#888' }} />
                                                        <Typography variant="body2" fontSize={12}>{apt.time}</Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <LocalHospital sx={{ fontSize: 13, color: '#888' }} />
                                                        <Typography variant="body2" fontSize={12}>{apt.hospital}</Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell><StatusChip status={apt.status} /></TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                        <Tooltip title="View Details">
                                                            <IconButton size="small" sx={{ color: LIGHT_BLUE }}>
                                                                <Visibility fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
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
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ))
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

            {/* ── 4. Upcoming Schedule + Earnings + Quick Actions ───────────── */}
            <Grid container spacing={2.5}>
                {/* Upcoming Schedule */}
                <Grid item xs={12} md={4}>
                    <Paper elevation={0} sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #E8EDF2' }}>
                        <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #F0F4F8' }}>
                            <Schedule sx={{ color: LIGHT_BLUE, fontSize: 20 }} />
                            <Typography variant="h6" fontWeight={700}>Upcoming Schedule</Typography>
                        </Box>
                        <List disablePadding>
                            {upcoming.map((u, idx) => (
                                <React.Fragment key={u.id}>
                                    <ListItem alignItems="flex-start" sx={{ py: 1.5, px: 2 }}>
                                        <ListItemAvatar>
                                            <Avatar sx={{ width: 36, height: 36, bgcolor: '#E3F2FD', color: LIGHT_BLUE, fontSize: 12, fontWeight: 700 }}>
                                                {u.date.slice(0, 2)}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Typography variant="body2" fontWeight={600} fontSize={13}>{u.patientName}</Typography>
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
                            ))}
                        </List>
                    </Paper>
                </Grid>

                {/* Earnings Overview */}
                <Grid item xs={12} md={4}>
                    <Paper elevation={0} sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #E8EDF2' }}>
                        <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #F0F4F8' }}>
                            <MonetizationOn sx={{ color: PURPLE, fontSize: 20 }} />
                            <Typography variant="h6" fontWeight={700}>Earnings Overview</Typography>
                        </Box>
                        <Box sx={{ p: 3 }}>
                            {[
                                { label: 'Doctor Fee', value: earnings?.doctorFee, color: GREEN },
                                { label: 'Channeling Fee', value: earnings?.channelingFee, color: LIGHT_BLUE },
                                { label: 'Total (Today)', value: earnings?.totalToday, color: PURPLE },
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
                                {
                                    label: 'View Appointments',
                                    desc: 'See all scheduled appointments',
                                    icon: <EventNote />,
                                    color: LIGHT_BLUE,
                                    bg: '#E3F2FD',
                                    path: '/appointments',
                                },
                                {
                                    label: 'Update Schedule',
                                    desc: 'Manage your availability',
                                    icon: <Schedule />,
                                    color: GREEN,
                                    bg: '#E8F5E9',
                                    path: '/availability',
                                },
                                {
                                    label: 'Manage Profile',
                                    desc: 'Update your profile info',
                                    icon: <ManageAccounts />,
                                    color: PURPLE,
                                    bg: '#F3E5F5',
                                    path: '/profile',
                                },
                                {
                                    label: 'My Patients',
                                    desc: 'View patient history',
                                    icon: <PersonAdd />,
                                    color: ORANGE,
                                    bg: '#FFF3E0',
                                    path: '/patients',
                                },
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
