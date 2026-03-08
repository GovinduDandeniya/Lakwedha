import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Box, Typography, Chip, Grid, Divider, Avatar,
} from '@mui/material';
import { AccessTime, LocalHospital, EventNote, CalendarToday } from '@mui/icons-material';

const STATUS_CONFIG = {
    completed: { color: '#2E7D32', bg: '#E8F5E9', label: 'Completed' },
    confirmed: { color: '#1565C0', bg: '#E3F2FD', label: 'Confirmed' },
    pending:   { color: '#E65100', bg: '#FFF3E0', label: 'Pending'   },
    cancelled: { color: '#C62828', bg: '#FFEBEE', label: 'Cancelled' },
};

const InfoRow = ({ icon, label, value }) => (
    <Grid item xs={6}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.4 }}>
            {React.cloneElement(icon, { sx: { color: '#999', fontSize: 15 } })}
            <Typography variant="caption" color="text.secondary">{label}</Typography>
        </Box>
        <Typography variant="body2" fontWeight={600}>{value || '—'}</Typography>
    </Grid>
);

const AppointmentDetails = ({ appointment, open, onClose }) => {
    if (!appointment) return null;
    const cfg = STATUS_CONFIG[appointment.status] || STATUS_CONFIG.pending;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
            PaperProps={{ sx: { borderRadius: 3 } }}
        >
            <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <EventNote sx={{ color: '#2E7D32' }} />
                Appointment Details
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ pt: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Avatar sx={{ width: 56, height: 56, bgcolor: '#E8F5E9', color: '#2E7D32', fontSize: 22, fontWeight: 700 }}>
                        {appointment.patientName?.charAt(0)}
                    </Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight={700}>{appointment.patientName}</Typography>
                        <Chip
                            label={cfg.label} size="small"
                            sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 700, border: `1px solid ${cfg.color}33` }}
                        />
                    </Box>
                </Box>
                <Grid container spacing={2.5}>
                    <InfoRow icon={<EventNote />}     label="Appointment No." value={appointment.appointmentNumber} />
                    <InfoRow icon={<CalendarToday />} label="Date"            value={appointment.date || 'Today'} />
                    <InfoRow icon={<AccessTime />}    label="Time"            value={appointment.time} />
                    <InfoRow icon={<LocalHospital />} label="Hospital"        value={appointment.hospital} />
                </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} variant="outlined"
                    sx={{ borderRadius: 2, borderColor: '#ddd', color: '#555' }}
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AppointmentDetails;
