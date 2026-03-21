import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    Box, Typography, Paper, CircularProgress,
    TextField, InputAdornment, Button, Chip, Divider,
    Dialog, DialogTitle, DialogContent,
    List, ListItemButton, ListItemText, LinearProgress,
    IconButton,
} from '@mui/material';
import {
    Search, CalendarToday, Refresh, LocalHospital, People,
    Close, FolderOpen, InsertDriveFile,
} from '@mui/icons-material';
import AppointmentList from '../components/appointments/AppointmentList';
import api from '../services/api';
import emrApi from '../services/emrApi';
import EMRUploadDialog from '../components/emr/EMRUploadDialog';

const GREEN = '#2E7D32';

// ── Helpers ───────────────────────────────────────────────────────────────────
const isToday = (dateStr) => {
    if (!dateStr) return true; // treat undated as today
    const d = new Date(dateStr);
    const t = new Date();
    return d.getFullYear() === t.getFullYear()
        && d.getMonth() === t.getMonth()
        && d.getDate() === t.getDate();
};

const formatDateLabel = (dateStr) => {
    if (!dateStr) return 'Today';
    if (isToday(dateStr)) return 'Today';
    const d = new Date(dateStr);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
};

const sortByApptNumber = (a, b) =>
    (parseInt(a.appointmentNumber) || 0) - (parseInt(b.appointmentNumber) || 0);

/**
 * Groups appointments into sorted date → hospital buckets.
 * - Today is always first.
 * - Hospitals within each date are sorted A → Z.
 * - Appointments within each hospital are sorted No 1 → No last (ascending).
 */
const groupAppointments = (appointments) => {
    const map = {};

    appointments.forEach((apt) => {
        const dateKey   = apt.date || 'Today';
        const dateLabel = formatDateLabel(apt.date);
        const hospital  = apt.hospital || 'Unknown Hospital';

        if (!map[dateKey]) map[dateKey] = { label: dateLabel, hospitals: {} };
        if (!map[dateKey].hospitals[hospital]) map[dateKey].hospitals[hospital] = [];
        map[dateKey].hospitals[hospital].push(apt);
    });

    // Sort appointments within each hospital by number ascending (1 → last)
    Object.values(map).forEach(({ hospitals }) => {
        Object.values(hospitals).forEach(list => list.sort(sortByApptNumber));
    });

    // Sort date keys: today first, then chronologically ascending
    const sortedDates = Object.entries(map).sort(([a], [b]) => {
        const aIsToday = a === 'Today' || isToday(a);
        const bIsToday = b === 'Today' || isToday(b);
        if (aIsToday) return -1;
        if (bIsToday) return 1;
        return new Date(a) - new Date(b);
    });

    // Within each date, sort hospitals A → Z
    return sortedDates.map(([dateKey, dateData]) => {
        const sortedHospitals = Object.entries(dateData.hospitals)
            .sort(([a], [b]) => a.localeCompare(b));
        return [dateKey, { label: dateData.label, hospitals: sortedHospitals }];
    });
};

// ── Summary banner at the top ─────────────────────────────────────────────────
const SummaryBanner = ({ appointments }) => {
    const todayApts = appointments.filter(a => isToday(a.date));
    const hospitals = [...new Set(todayApts.map(a => a.hospital).filter(Boolean))];

    const items = [
        { label: "Today's Hospitals",  value: hospitals.length || '—', icon: <LocalHospital sx={{ fontSize: 18, color: '#fff' }} /> },
        { label: 'Total Appointments', value: todayApts.length,        icon: <People sx={{ fontSize: 18, color: '#fff' }} />        },
    ];

    return (
        <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(2, 1fr)' },
            gap: 2, mb: 3,
        }}>
            {items.map(({ label, value, icon }, i) => (
                <Paper key={i} elevation={0} sx={{
                    p: 2, borderRadius: 3,
                    background: i === 0 ? 'linear-gradient(135deg,#1565C0,#1976D2)'
                              : i === 1 ? 'linear-gradient(135deg,#1B5E20,#2E7D32)'
                              : i === 2 ? 'linear-gradient(135deg,#E65100,#F57C00)'
                              : 'linear-gradient(135deg,#4A148C,#6A1B9A)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        {icon}
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
                            {label}
                        </Typography>
                    </Box>
                    <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, lineHeight: 1.1 }}
                        noWrap title={String(value)}>
                        {value}
                    </Typography>
                </Paper>
            ))}
        </Box>
    );
};

// ── Hospital session header ───────────────────────────────────────────────────
const SessionHeader = ({ hospital, appointments }) => (
    <Box sx={{
        px: 2.5, py: 1.25,
        background: 'linear-gradient(90deg,#E8F5E9,#F0F4F8)',
        borderBottom: '1px solid #D7EBD8',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 1,
    }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocalHospital sx={{ fontSize: 16, color: GREEN }} />
            <Typography fontWeight={700} fontSize={13} color={GREEN}>
                {hospital}
            </Typography>
            <Chip
                label={`${appointments.length} Appointment${appointments.length !== 1 ? 's' : ''}`}
                size="small"
                sx={{ bgcolor: '#E8F5E9', color: GREEN, fontWeight: 700, fontSize: 11, height: 22, border: '1px solid #A5D6A7' }}
            />
        </Box>
    </Box>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
const AppointmentsPage = () => {
    const [appointments, setAppointments] = useState([]);
    const [statusFilter, setStatusFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [hospitalFilter, setHospitalFilter] = useState('all'); // today's hospital quick-filter

    // ── EMR state ──────────────────────────────────────────────────────────────
    const [emrViewOpen, setEmrViewOpen]       = useState(false);
    const [emrUploadOpen, setEmrUploadOpen]   = useState(false);
    const [emrPatientId, setEmrPatientId]     = useState('');
    const [emrPatientName, setEmrPatientName] = useState('');
    const [emrAppointmentId, setEmrAppointmentId]   = useState('');
    const [emrAppointmentNum, setEmrAppointmentNum] = useState('');
    const [emrRecords, setEmrRecords]         = useState([]);
    const [emrFetching, setEmrFetching]       = useState(false);
    const [emrActiveRecord, setEmrActiveRecord] = useState(null);
    const [emrFileUrl, setEmrFileUrl]         = useState('');
    const [emrError, setEmrError]             = useState('');
    const emrObjectUrlRef = useRef('');

    const fetchAppointments = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/appointments');
            setAppointments((res.data.data || []).filter(a => a.status !== 'pending'));
        } catch {
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

    // Reset hospital filter when status/search changes
    useEffect(() => { setHospitalFilter('all'); }, [statusFilter, search]);

    const handleMarkComplete = async (id) => {
        try {
            await api.patch(`/appointments/${id}/complete`);
            setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'completed' } : a));
        } catch { /* ignore */ }
    };

    // ── EMR handlers ───────────────────────────────────────────────────────────
    const handleViewRecords = async (appointment) => {
        const pid = appointment.patientId;
        if (!pid) return;
        const name = appointment.patientTitle
            ? `${appointment.patientTitle} ${appointment.patientFirstName} ${appointment.patientLastName}`
            : appointment.patientName || 'Patient';
        setEmrPatientId(pid);
        setEmrPatientName(name);
        setEmrRecords([]);
        setEmrActiveRecord(null);
        setEmrFileUrl('');
        setEmrError('');
        setEmrViewOpen(true);
        setEmrFetching(true);
        try {
            const data = await emrApi.getByPatientId(pid);
            setEmrRecords(Array.isArray(data) ? data : []);
        } catch (err) {
            setEmrError(err.message || 'Failed to load records');
        } finally {
            setEmrFetching(false);
        }
    };

    const handleSelectEmrRecord = async (record) => {
        setEmrActiveRecord(record);
        setEmrFileUrl('');
        if (record.fileUrl) {
            try {
                if (emrObjectUrlRef.current) URL.revokeObjectURL(emrObjectUrlRef.current);
                const objUrl = await emrApi.fetchSecureFile(record.fileUrl);
                emrObjectUrlRef.current = objUrl;
                setEmrFileUrl(objUrl);
            } catch { /* show metadata only */ }
        }
    };

    const handleUploadRecords = (appointment) => {
        const pid = appointment.patientId?._id || appointment.patientId;
        if (!pid) return;
        const name = appointment.patientTitle
            ? `${appointment.patientTitle} ${appointment.patientFirstName} ${appointment.patientLastName}`
            : appointment.patientName || 'Patient';
        setEmrPatientId(String(pid));
        setEmrPatientName(name);
        setEmrAppointmentId(String(appointment.id || appointment._id || ''));
        setEmrAppointmentNum(String(appointment.appointmentNumber || ''));
        setEmrUploadOpen(true);
    };

    // Filtered appointments (search + status)
    const filtered = useMemo(() => {
        let data = appointments;

        if (statusFilter !== 'all') {
            if (statusFilter === 'upcoming') {
                data = data.filter(a => ['upcoming', 'confirmed'].includes(a.status));
            } else {
                data = data.filter(a => a.status === statusFilter);
            }
        }

        if (search.trim()) {
            const q = search.toLowerCase();
            data = data.filter(a => {
                const name = a.patientTitle
                    ? `${a.patientTitle} ${a.patientFirstName} ${a.patientLastName}`.toLowerCase()
                    : (a.patientName || '').toLowerCase();
                return name.includes(q)
                    || String(a.appointmentNumber).includes(q)
                    || (a.hospital || '').toLowerCase().includes(q);
            });
        }

        return data;
    }, [appointments, statusFilter, search]);

    // Group filtered appointments
    const grouped = useMemo(() => groupAppointments(filtered), [filtered]);

    // Status tab counts
    const upcomingCount = appointments.filter(a => ['upcoming','confirmed'].includes(a.status)).length;
    const TABS = [
        { label: 'All',       value: 'all',       count: appointments.length },
        { label: 'Upcoming',  value: 'upcoming',  count: upcomingCount },
        { label: 'Completed', value: 'completed', count: appointments.filter(a => a.status === 'completed').length },
        { label: 'Cancelled', value: 'cancelled', count: appointments.filter(a => a.status === 'cancelled').length },
    ];

    return (
        <>
        <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#F0F4F8', minHeight: '100vh' }}>

            {/* Page header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CalendarToday sx={{ color: GREEN, fontSize: 28 }} />
                    <Box>
                        <Typography variant="h5" fontWeight={700}>Appointments</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {appointments.length} total · grouped by hospital &amp; date
                        </Typography>
                    </Box>
                </Box>
                <Button
                    startIcon={<Refresh />}
                    onClick={fetchAppointments}
                    sx={{ color: GREEN, bgcolor: '#E8F5E9', borderRadius: 2, fontWeight: 600 }}
                >
                    Refresh
                </Button>
            </Box>

            {/* Summary banner */}
            {!loading && <SummaryBanner appointments={appointments} />}

            <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #E8EDF2', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

                {/* Status filter tabs */}
                <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 1,
                    px: 2, py: 1.5, borderBottom: '1px solid #F0F0F0',
                    overflowX: 'auto',
                }}>
                    {TABS.map(t => (
                        <Button
                            key={t.value}
                            size="small"
                            onClick={() => setStatusFilter(t.value)}
                            sx={{
                                borderRadius: 2, textTransform: 'none', fontWeight: 600,
                                fontSize: 12, px: 1.5, py: 0.5, flexShrink: 0,
                                bgcolor: statusFilter === t.value ? '#E8F5E9' : 'transparent',
                                color: statusFilter === t.value ? GREEN : '#666',
                                border: statusFilter === t.value ? `1px solid ${GREEN}55` : '1px solid transparent',
                                '&:hover': { bgcolor: '#F0F7F0' },
                            }}
                        >
                            {t.label}
                            <Chip label={t.count} size="small" sx={{
                                ml: 0.75, height: 18, fontSize: 10, fontWeight: 700,
                                bgcolor: statusFilter === t.value ? '#C8E6C9' : '#F0F0F0',
                                color: statusFilter === t.value ? GREEN : '#777',
                            }} />
                        </Button>
                    ))}
                </Box>

                {/* Search */}
                <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #F5F5F5' }}>
                    <TextField
                        size="small"
                        placeholder="Search by patient name, appointment number or hospital..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><Search sx={{ color: '#aaa', fontSize: 18 }} /></InputAdornment>,
                        }}
                        sx={{ width: { xs: '100%', md: 440 }, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 13 } }}
                    />
                </Box>

                {/* Grouped appointment list */}
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress sx={{ color: GREEN }} />
                    </Box>
                ) : grouped.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Typography color="text.secondary">No appointments found</Typography>
                    </Box>
                ) : (
                    grouped.map(([dateKey, { label: dateLabel, hospitals }], di) => {
                        const isToday = dateLabel === 'Today';

                        // For Today: apply hospital quick-filter; other dates show all
                        const visibleHospitals = isToday && hospitalFilter !== 'all'
                            ? hospitals.filter(([h]) => h === hospitalFilter)
                            : hospitals;

                        return (
                            <Box key={dateKey}>
                                {/* Date section label */}
                                <Box sx={{
                                    px: 2.5, py: 1,
                                    bgcolor: isToday ? '#1B5E20' : '#37474F',
                                }}>
                                    {/* Title row */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: isToday ? 1 : 0 }}>
                                        <CalendarToday sx={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }} />
                                        <Typography sx={{
                                            fontSize: 12, fontWeight: 800, letterSpacing: 1,
                                            color: '#fff', textTransform: 'uppercase',
                                        }}>
                                            {isToday ? "Today's Appointments" : `${dateLabel} – Appointments`}
                                        </Typography>
                                        <Chip
                                            label={`${hospitals.reduce((s, [, a]) => s + a.length, 0)} total`}
                                            size="small"
                                            sx={{ ml: 'auto', height: 18, fontSize: 10, fontWeight: 700,
                                                 bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' }}
                                        />
                                    </Box>

                                    {/* Hospital quick-filter buttons — Today section only */}
                                    {isToday && (
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                            {/* All button */}
                                            <Button
                                                size="small"
                                                onClick={() => setHospitalFilter('all')}
                                                sx={{
                                                    borderRadius: 2, textTransform: 'none',
                                                    fontSize: 11, fontWeight: 700,
                                                    px: 1.5, py: 0.4, minHeight: 26,
                                                    bgcolor: hospitalFilter === 'all'
                                                        ? 'rgba(255,255,255,0.95)'
                                                        : 'rgba(255,255,255,0.15)',
                                                    color: hospitalFilter === 'all' ? '#1B5E20' : '#fff',
                                                    border: hospitalFilter === 'all'
                                                        ? '1px solid rgba(255,255,255,0.9)'
                                                        : '1px solid rgba(255,255,255,0.35)',
                                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                                                }}
                                            >
                                                All Hospitals
                                                <Chip
                                                    label={hospitals.reduce((s, [, a]) => s + a.length, 0)}
                                                    size="small"
                                                    sx={{
                                                        ml: 0.75, height: 16, fontSize: 9, fontWeight: 800,
                                                        bgcolor: hospitalFilter === 'all' ? '#1B5E20' : 'rgba(255,255,255,0.25)',
                                                        color: '#fff',
                                                    }}
                                                />
                                            </Button>

                                            {/* One button per hospital */}
                                            {hospitals.map(([h, apts]) => (
                                                <Button
                                                    key={h}
                                                    size="small"
                                                    startIcon={<LocalHospital sx={{ fontSize: '13px !important' }} />}
                                                    onClick={() => setHospitalFilter(h)}
                                                    sx={{
                                                        borderRadius: 2, textTransform: 'none',
                                                        fontSize: 11, fontWeight: 700,
                                                        px: 1.5, py: 0.4, minHeight: 26,
                                                        bgcolor: hospitalFilter === h
                                                            ? 'rgba(255,255,255,0.95)'
                                                            : 'rgba(255,255,255,0.15)',
                                                        color: hospitalFilter === h ? '#1B5E20' : '#fff',
                                                        border: hospitalFilter === h
                                                            ? '1px solid rgba(255,255,255,0.9)'
                                                            : '1px solid rgba(255,255,255,0.35)',
                                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                                                    }}
                                                >
                                                    {h}
                                                    <Chip
                                                        label={apts.length}
                                                        size="small"
                                                        sx={{
                                                            ml: 0.75, height: 16, fontSize: 9, fontWeight: 800,
                                                            bgcolor: hospitalFilter === h ? '#1B5E20' : 'rgba(255,255,255,0.25)',
                                                            color: '#fff',
                                                        }}
                                                    />
                                                </Button>
                                            ))}
                                        </Box>
                                    )}
                                </Box>

                                {/* Hospital groups (filtered for Today, full for other dates) */}
                                {visibleHospitals.map(([hospital, apts], hi) => (
                                    <Box key={hospital}>
                                        <SessionHeader
                                            hospital={hospital}
                                            appointments={apts}
                                        />
                                        <AppointmentList
                                            appointments={apts}
                                            onMarkComplete={handleMarkComplete}
                                            onViewRecords={handleViewRecords}
                                            onUploadRecords={handleUploadRecords}
                                        />
                                        {(hi < visibleHospitals.length - 1 || di < grouped.length - 1) && (
                                            <Divider sx={{ borderColor: '#E8EDF2' }} />
                                        )}
                                    </Box>
                                ))}
                            </Box>
                        );
                    })
                )}
            </Paper>
        </Box>

        {/* ── EMR View Dialog ──────────────────────────────────────────────── */}
        <Dialog open={emrViewOpen} onClose={() => setEmrViewOpen(false)} maxWidth="md" fullWidth
            PaperProps={{ sx: { borderRadius: 3, height: '80vh' } }}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FolderOpen sx={{ color: GREEN }} />
                    <Typography fontWeight={700}>Medical Records — {emrPatientName}</Typography>
                </Box>
                <IconButton size="small" onClick={() => setEmrViewOpen(false)}><Close fontSize="small" /></IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ p: 0, display: 'flex', overflow: 'hidden' }}>
                {/* Record list */}
                <Box sx={{ width: 240, borderRight: '1px solid #E0E0E0', overflow: 'auto', flexShrink: 0 }}>
                    {emrFetching && <LinearProgress />}
                    {!emrFetching && emrRecords.length === 0 && (
                        <Typography sx={{ p: 2, color: 'text.secondary', fontSize: 13 }}>
                            {emrError || 'No records found.'}
                        </Typography>
                    )}
                    <List dense disablePadding>
                        {emrRecords.map((rec, i) => (
                            <ListItemButton
                                key={rec._id || i}
                                selected={emrActiveRecord?._id === rec._id}
                                onClick={() => handleSelectEmrRecord(rec)}
                                sx={{ borderBottom: '1px solid #F5F5F5', '&.Mui-selected': { bgcolor: '#E8F5E9' } }}
                            >
                                <ListItemText
                                    primary={<Typography noWrap fontSize={13} fontWeight={600}>{rec.title || 'Record'}</Typography>}
                                    secondary={
                                        <Typography noWrap fontSize={11} color="text.secondary">
                                            {rec.type} · {new Date(rec.createdAt).toLocaleDateString()}
                                        </Typography>
                                    }
                                />
                            </ListItemButton>
                        ))}
                    </List>
                </Box>

                {/* Record detail */}
                <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
                    {!emrActiveRecord ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary' }}>
                            <InsertDriveFile sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
                            <Typography fontSize={14}>Select a record to view details</Typography>
                        </Box>
                    ) : (
                        <Box>
                            <Typography variant="h6" fontWeight={700} mb={2}>{emrActiveRecord.title}</Typography>
                            {emrActiveRecord.diagnosis && (
                                <Box mb={2}>
                                    <Typography fontSize={12} fontWeight={700} color="text.secondary" mb={0.5}>DIAGNOSIS</Typography>
                                    <Typography fontSize={14}>{emrActiveRecord.diagnosis}</Typography>
                                </Box>
                            )}
                            {emrActiveRecord.notes && (
                                <Box mb={2}>
                                    <Typography fontSize={12} fontWeight={700} color="text.secondary" mb={0.5}>NOTES</Typography>
                                    <Typography fontSize={14}>{emrActiveRecord.notes}</Typography>
                                </Box>
                            )}
                            {emrActiveRecord.treatment && (
                                <Box mb={2}>
                                    <Typography fontSize={12} fontWeight={700} color="text.secondary" mb={0.5}>TREATMENT</Typography>
                                    <Typography fontSize={14}>{emrActiveRecord.treatment}</Typography>
                                </Box>
                            )}
                            {emrFileUrl && (
                                <Box mt={2}>
                                    {/\.(jpg|jpeg|png|gif|webp)$/i.test(emrActiveRecord.fileUrl || '') ? (
                                        <img src={emrFileUrl} alt="attachment"
                                            style={{ maxWidth: '100%', borderRadius: 8, pointerEvents: 'none', userSelect: 'none' }} />
                                    ) : (
                                        <object data={emrFileUrl} type="application/pdf"
                                            style={{ width: '100%', height: 400, borderRadius: 8 }}>
                                            <Typography color="text.secondary" fontSize={13}>Cannot preview this file type.</Typography>
                                        </object>
                                    )}
                                </Box>
                            )}
                        </Box>
                    )}
                </Box>
            </DialogContent>
        </Dialog>

        {/* ── EMR Upload Dialog (Camera / File / Text) ─────────────────────── */}
        <EMRUploadDialog
            open={emrUploadOpen}
            onClose={() => setEmrUploadOpen(false)}
            patientId={emrPatientId}
            patientName={emrPatientName}
            appointmentId={emrAppointmentId}
            appointmentNumber={emrAppointmentNum}
        />
        </>
    );
};

export default AppointmentsPage;
