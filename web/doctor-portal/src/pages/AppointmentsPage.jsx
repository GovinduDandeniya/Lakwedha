import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, Tabs, Tab, CircularProgress,
    TextField, InputAdornment, Button, Chip,
} from '@mui/material';
import { Search, CalendarToday, Refresh } from '@mui/icons-material';
import AppointmentList from '../components/appointments/AppointmentList';
import AppointmentDetails from '../components/appointments/AppointmentDetails';
import api from '../services/api';

const TABS = [
    { label: 'All',       value: 'all'       },
    { label: 'Upcoming',  value: 'confirmed'  },
    { label: 'Pending',   value: 'pending'    },
    { label: 'Completed', value: 'completed'  },
    { label: 'Cancelled', value: 'cancelled'  },
];

const AppointmentsPage = () => {
    const [appointments, setAppointments] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [tab, setTab] = useState('all');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchAppointments = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/appointments');
            setAppointments(res.data.data || []);
        } catch {
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

    useEffect(() => {
        let data = appointments;
        if (tab !== 'all') data = data.filter(a => a.status === tab);
        if (search.trim()) {
            const q = search.toLowerCase();
            data = data.filter(a =>
                a.patientName?.toLowerCase().includes(q) ||
                a.appointmentNumber?.toLowerCase().includes(q) ||
                a.hospital?.toLowerCase().includes(q)
            );
        }
        setFiltered(data);
    }, [appointments, tab, search]);

    const handleMarkComplete = async (id) => {
        try {
            await api.patch(`/appointments/${id}/complete`);
            setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'completed' } : a));
        } catch { /* ignore */ }
    };

    const counts = TABS.reduce((acc, t) => {
        acc[t.value] = t.value === 'all'
            ? appointments.length
            : appointments.filter(a => a.status === t.value).length;
        return acc;
    }, {});

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#F0F4F8', minHeight: '100vh' }}>
            {/* Page header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CalendarToday sx={{ color: '#2E7D32', fontSize: 28 }} />
                    <Box>
                        <Typography variant="h5" fontWeight={700}>Appointments</Typography>
                        <Typography variant="body2" color="text.secondary">{appointments.length} total</Typography>
                    </Box>
                </Box>
                <Button
                    startIcon={<Refresh />}
                    onClick={fetchAppointments}
                    sx={{ color: '#2E7D32', bgcolor: '#E8F5E9', borderRadius: 2, fontWeight: 600 }}
                >
                    Refresh
                </Button>
            </Box>

            <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #E8EDF2', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                {/* Filter tabs */}
                <Box sx={{ borderBottom: '1px solid #F0F0F0', px: 1 }}>
                    <Tabs
                        value={tab}
                        onChange={(_, v) => setTab(v)}
                        variant="scrollable"
                        scrollButtons="auto"
                        TabIndicatorProps={{ style: { backgroundColor: '#2E7D32', height: 3 } }}
                    >
                        {TABS.map(t => (
                            <Tab key={t.value} value={t.value}
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                        <span>{t.label}</span>
                                        <Chip label={counts[t.value] ?? 0} size="small" sx={{
                                            height: 18, fontSize: 10, fontWeight: 700,
                                            bgcolor: tab === t.value ? '#E8F5E9' : '#F5F5F5',
                                            color: tab === t.value ? '#2E7D32' : '#777',
                                        }} />
                                    </Box>
                                }
                                sx={{ textTransform: 'none', fontWeight: tab === t.value ? 700 : 400, minHeight: 48 }}
                            />
                        ))}
                    </Tabs>
                </Box>

                {/* Search */}
                <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #F5F5F5' }}>
                    <TextField
                        size="small"
                        placeholder="Search by patient name, appt. number or hospital..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><Search sx={{ color: '#aaa', fontSize: 18 }} /></InputAdornment>,
                        }}
                        sx={{ width: { xs: '100%', md: 420 }, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 13 } }}
                    />
                </Box>

                {/* List */}
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress sx={{ color: '#2E7D32' }} />
                    </Box>
                ) : (
                    <AppointmentList appointments={filtered} onView={setSelected} onMarkComplete={handleMarkComplete} />
                )}
            </Paper>

            <AppointmentDetails appointment={selected} open={Boolean(selected)} onClose={() => setSelected(null)} />
        </Box>
    );
};

export default AppointmentsPage;
