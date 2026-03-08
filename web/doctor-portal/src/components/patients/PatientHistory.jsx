import React from 'react';
import { Box, Typography, Chip, Divider } from '@mui/material';
import { AccessTime, LocalHospital } from '@mui/icons-material';

const STATUS_CONFIG = {
    completed: { color: '#2E7D32', bg: '#E8F5E9', label: 'Completed' },
    confirmed: { color: '#1565C0', bg: '#E3F2FD', label: 'Confirmed' },
    pending:   { color: '#E65100', bg: '#FFF3E0', label: 'Pending'   },
    cancelled: { color: '#C62828', bg: '#FFEBEE', label: 'Cancelled' },
};

const PatientHistory = ({ appointments }) => {
    if (!appointments || appointments.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 5 }}>
                <Typography color="text.secondary" variant="body2">No appointment history</Typography>
            </Box>
        );
    }

    return (
        <Box>
            {appointments.map((apt, idx) => {
                const cfg = STATUS_CONFIG[apt.status] || STATUS_CONFIG.pending;
                return (
                    <React.Fragment key={apt.id}>
                        <Box sx={{ py: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2" fontWeight={600}>{apt.appointmentNumber}</Typography>
                                <Chip label={cfg.label} size="small"
                                    sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: 10, height: 20 }}
                                />
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <AccessTime sx={{ fontSize: 13, color: '#888' }} />
                                    <Typography variant="caption" color="text.secondary">{apt.date} · {apt.time}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <LocalHospital sx={{ fontSize: 13, color: '#888' }} />
                                    <Typography variant="caption" color="text.secondary">{apt.hospital}</Typography>
                                </Box>
                            </Box>
                        </Box>
                        {idx < appointments.length - 1 && <Divider />}
                    </React.Fragment>
                );
            })}
        </Box>
    );
};

export default PatientHistory;
