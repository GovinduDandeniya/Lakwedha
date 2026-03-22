import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Box, Typography, Avatar, Chip, Grid, Divider, Tab, Tabs, CircularProgress,
} from '@mui/material';
import { Person, History, CalendarToday } from '@mui/icons-material';
import PatientHistory from './PatientHistory';
import api from '../../services/api';

const InfoItem = ({ icon, label, value }) => (
    <Grid item xs={6}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.3 }}>
            {React.cloneElement(icon, { sx: { fontSize: 14, color: '#999' } })}
            <Typography variant="caption" color="text.secondary">{label}</Typography>
        </Box>
        <Typography variant="body2" fontWeight={600}>{value || '—'}</Typography>
    </Grid>
);

/**
 * Builds a display name from patient data.
 * Prefers separate title/firstName/lastName; falls back to name.
 */
const buildDisplayName = (patient) => {
    if (patient.title && patient.firstName && patient.lastName) {
        return `${patient.title} ${patient.firstName} ${patient.lastName}`;
    }
    return patient.name || '—';
};

const PatientProfile = ({ patient, open, onClose }) => {
    const [tab, setTab] = useState(0);
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        if (open && patient && tab === 1) {
            setLoadingHistory(true);
            api.get(`/patients/${patient.id}/history`)
                .then(res => setHistory(res.data.data || []))
                .catch(() => setHistory([]))
                .finally(() => setLoadingHistory(false));
        }
    }, [open, patient, tab]);

    if (!patient) return null;

    const displayName = buildDisplayName(patient);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
            PaperProps={{ sx: { borderRadius: 3 } }}
        >
            <DialogTitle sx={{ pb: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pb: 2 }}>
                    <Avatar sx={{ width: 56, height: 56, bgcolor: '#E8F5E9', color: '#2E7D32', fontSize: 22, fontWeight: 700 }}>
                        {displayName.charAt(0)}
                    </Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight={700}>{displayName}</Typography>
                        <Box sx={{ display: 'flex', gap: 0.75, mt: 0.3, flexWrap: 'wrap' }}>
                            {patient.age != null && (
                                <Chip label={`Age ${patient.age}`} size="small"
                                    sx={{ bgcolor: '#F5F5F5', color: '#555', fontSize: 11, height: 20 }}
                                />
                            )}
                        </Box>
                    </Box>
                </Box>
                <Tabs value={tab} onChange={(_, v) => setTab(v)}
                    TabIndicatorProps={{ style: { backgroundColor: '#2E7D32', height: 3 } }}
                    sx={{ borderBottom: '1px solid #F0F0F0' }}
                >
                    <Tab label="Profile" icon={<Person fontSize="small" />} iconPosition="start"
                        sx={{ textTransform: 'none', fontWeight: tab === 0 ? 700 : 400, minHeight: 44, fontSize: 13 }}
                    />
                    <Tab label="History" icon={<History fontSize="small" />} iconPosition="start"
                        sx={{ textTransform: 'none', fontWeight: tab === 1 ? 700 : 400, minHeight: 44, fontSize: 13 }}
                    />
                </Tabs>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ pt: 2.5 }}>
                {tab === 0 && (
                    <Grid container spacing={2}>
                        <InfoItem icon={<Person />}        label="Full Name"     value={displayName} />
                        <InfoItem icon={<CalendarToday />} label="Age"           value={patient.age != null ? String(patient.age) : undefined} />
                        <InfoItem icon={<History />}       label="Total Visits"  value={patient.totalVisits != null ? String(patient.totalVisits) : undefined} />
                        <InfoItem icon={<CalendarToday />} label="Last Visit"    value={patient.lastVisit} />
                    </Grid>
                )}
                {tab === 1 && (
                    loadingHistory
                        ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} sx={{ color: '#2E7D32' }} /></Box>
                        : <PatientHistory appointments={history} />
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2, borderColor: '#ddd', color: '#555' }}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PatientProfile;
