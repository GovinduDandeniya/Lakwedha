import React from 'react';
import { Box, Typography, Chip, Avatar, IconButton, Tooltip } from '@mui/material';
import { Visibility, CheckCircle, AccessTime, LocalHospital } from '@mui/icons-material';

const STATUS_CONFIG = {
    completed: { color: '#2E7D32', bg: '#E8F5E9', label: 'Completed' },
    confirmed: { color: '#1565C0', bg: '#E3F2FD', label: 'Confirmed' },
    pending:   { color: '#E65100', bg: '#FFF3E0', label: 'Pending'   },
    cancelled: { color: '#C62828', bg: '#FFEBEE', label: 'Cancelled' },
};

const AppointmentCard = ({ appointment, onView, onMarkComplete }) => {
    const cfg = STATUS_CONFIG[appointment?.status] || STATUS_CONFIG.pending;

    return (
        <Box sx={{
            display: 'flex', alignItems: 'center', px: 2, py: 1.5,
            '&:hover': { bgcolor: '#F8FAF8' }, transition: 'background 0.15s',
        }}>
            <Typography sx={{ width: 100, fontSize: 12, color: '#888', flexShrink: 0 }}>
                {appointment.appointmentNumber}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
                <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: '#E8F5E9', color: '#2E7D32', flexShrink: 0 }}>
                    {appointment.patientName?.charAt(0)}
                </Avatar>
                <Typography variant="body2" fontWeight={600} noWrap>{appointment.patientName}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: 100, flexShrink: 0 }}>
                <AccessTime sx={{ fontSize: 13, color: '#888' }} />
                <Typography variant="body2" fontSize={12}>{appointment.time}</Typography>
            </Box>
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5, flex: 1, minWidth: 0 }}>
                <LocalHospital sx={{ fontSize: 13, color: '#888', flexShrink: 0 }} />
                <Typography variant="body2" fontSize={12} noWrap>{appointment.hospital}</Typography>
            </Box>
            <Box sx={{ width: 100, flexShrink: 0 }}>
                <Chip label={cfg.label} size="small" sx={{
                    bgcolor: cfg.bg, color: cfg.color,
                    fontWeight: 700, fontSize: 11, height: 22,
                    border: `1px solid ${cfg.color}33`,
                }} />
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                <Tooltip title="View Details">
                    <IconButton size="small" sx={{ color: '#1976D2' }} onClick={() => onView?.(appointment)}>
                        <Visibility fontSize="small" />
                    </IconButton>
                </Tooltip>
                {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                    <Tooltip title="Mark as Completed">
                        <IconButton size="small" sx={{ color: '#2E7D32' }} onClick={() => onMarkComplete?.(appointment.id)}>
                            <CheckCircle fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>
        </Box>
    );
};

export default AppointmentCard;
