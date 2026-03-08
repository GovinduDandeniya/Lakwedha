import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Box, Typography, Avatar, Chip, Grid, Divider, Tab, Tabs, CircularProgress,
} from '@mui/material';
import { Person, Phone, Email, Bloodtype, LocalHospital, History } from '@mui/icons-material';
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
    const genderColor = patient.gender === 'Male' ? '#1565C0' : '#C2185B';

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
            PaperProps={{ sx: { borderRadius: 3 } }}
        >
            <DialogTitle sx={{ pb: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pb: 2 }}>
                    <Avatar sx={{ width: 56, height: 56, bgcolor: '#E8F5E9', color: '#2E7D32', fontSize: 22, fontWeight: 700 }}>
                        {patient.name?.charAt(0)}
                    </Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight={700}>{patient.name}</Typography>
                        <Box sx={{ display: 'flex', gap: 0.75, mt: 0.3, flexWrap: 'wrap' }}>
                            <Chip label={patient.gender} size="small"
                                sx={{ bgcolor: `${genderColor}11`, color: genderColor, fontWeight: 600, fontSize: 11, height: 20 }}
                            />
                            <Chip label={`Age ${patient.age}`} size="small"
                                sx={{ bgcolor: '#F5F5F5', color: '#555', fontSize: 11, height: 20 }}
                            />
                            <Chip label={patient.bloodGroup} size="small"
                                sx={{ bgcolor: '#FFEBEE', color: '#C62828', fontWeight: 700, fontSize: 11, height: 20 }}
                            />
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
                        <InfoItem icon={<Phone />}         label="Phone"        value={patient.phone} />
                        <InfoItem icon={<Email />}         label="Email"        value={patient.email} />
                        <InfoItem icon={<Bloodtype />}     label="Blood Group"  value={patient.bloodGroup} />
                        <InfoItem icon={<LocalHospital />} label="Condition"    value={patient.condition} />
                        <InfoItem icon={<History />}       label="Total Visits" value={String(patient.totalVisits)} />
                        <InfoItem icon={<Person />}        label="Last Visit"   value={patient.lastVisit} />
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
