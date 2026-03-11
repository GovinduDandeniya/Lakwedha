import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Box, Typography, Chip, Grid, Divider, Avatar,
} from '@mui/material';
import { AccessTime, LocalHospital, EventNote, CalendarToday, Person } from '@mui/icons-material';

const STATUS_CONFIG = {
    upcoming:   { color: '#1565C0', bg: '#E3F2FD', label: 'Upcoming'   },
    confirmed:  { color: '#1565C0', bg: '#E3F2FD', label: 'Upcoming'   },
    pending:    { color: '#1565C0', bg: '#E3F2FD', label: 'Upcoming'   },
    checked_in: { color: '#E65100', bg: '#FFF3E0', label: 'Checked In' },
    completed:  { color: '#2E7D32', bg: '#E8F5E9', label: 'Completed'  },
    cancelled:  { color: '#C62828', bg: '#FFEBEE', label: 'Cancelled'  },
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

const buildDisplayName = (apt) => {
    if (apt.patientTitle && apt.patientFirstName && apt.patientLastName) {
        return `${apt.patientTitle} ${apt.patientFirstName} ${apt.patientLastName}`;
    }
    return apt.patientDisplayName || apt.patientName || '—';
};

const AppointmentDetails = ({ appointment, open, onClose }) => {
    if (!appointment) return null;
    const cfg = STATUS_CONFIG[appointment.status] || STATUS_CONFIG.upcoming;
    const displayName = buildDisplayName(appointment);

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
                        {displayName.charAt(0)}
                    </Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight={700}>{displayName}</Typography>
                        <Box sx={{ display: 'flex', gap: 0.75, mt: 0.5, flexWrap: 'wrap' }}>
                            <Chip
                                label={cfg.label} size="small"
                                sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 700, border: `1px solid ${cfg.color}33` }}
                            />
                            {appointment.patientAge != null && (
                                <Chip label={`Age ${appointment.patientAge}`} size="small"
                                    sx={{ bgcolor: '#F0F4F8', color: '#444', fontWeight: 600 }}
                                />
                            )}
                        </Box>
                    </Box>
                </Box>
                <Grid container spacing={2.5}>
                    <InfoRow icon={<EventNote />}     label="Appointment No." value={appointment.appointmentNumber ? `No ${appointment.appointmentNumber}` : undefined} />
                    <InfoRow icon={<CalendarToday />} label="Date"            value={appointment.date || 'Today'} />
                    <InfoRow icon={<AccessTime />}    label="Session Time"    value={appointment.time} />
                    <InfoRow icon={<LocalHospital />} label="Hospital"        value={appointment.hospital} />
                    <InfoRow icon={<Person />}        label="Patient"         value={displayName} />
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
