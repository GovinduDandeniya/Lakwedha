import React from 'react';
import { Box, Typography, Chip, Divider } from '@mui/material';
import { LocalHospital, CalendarToday, PersonAdd } from '@mui/icons-material';

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

    // Find the earliest appointment to mark as New Patient
    const sorted = [...appointments].sort((a, b) => new Date(a.date) - new Date(b.date));
    const firstId = sorted[0]?.id;

    return (
        <Box>
            {appointments.map((apt, idx) => {
                const cfg       = STATUS_CONFIG[apt.status] || STATUS_CONFIG.pending;
                const isNew     = apt.id === firstId;
                const dateLabel = apt.date
                    ? new Date(apt.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                    : null;

                return (
                    <React.Fragment key={apt.id}>
                        <Box sx={{ py: 1.5 }}>
                            {/* Top row: appt number + new/follow-up badge + status */}
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75, flexWrap: 'wrap', gap: 0.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                    <Typography variant="body2" fontWeight={700}>{apt.appointmentNumber || '—'}</Typography>
                                    {isNew ? (
                                        <Chip
                                            icon={<PersonAdd sx={{ fontSize: '12px !important' }} />}
                                            label="New Patient"
                                            size="small"
                                            sx={{ bgcolor: '#E8F5E9', color: '#2E7D32', fontWeight: 700, fontSize: 10, height: 20, border: '1px solid #A5D6A7' }}
                                        />
                                    ) : (
                                        <Chip
                                            label="Follow-up"
                                            size="small"
                                            sx={{ bgcolor: '#F3E5F5', color: '#6A1B9A', fontWeight: 700, fontSize: 10, height: 20, border: '1px solid #CE93D8' }}
                                        />
                                    )}
                                </Box>
                                <Chip label={cfg.label} size="small"
                                    sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: 10, height: 20 }}
                                />
                            </Box>

                            {/* Bottom row: date + hospital */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                {dateLabel && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <CalendarToday sx={{ fontSize: 12, color: '#888' }} />
                                        <Typography variant="caption" color="text.secondary">{dateLabel}</Typography>
                                    </Box>
                                )}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <LocalHospital sx={{ fontSize: 12, color: '#888' }} />
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
