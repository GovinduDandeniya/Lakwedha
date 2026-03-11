import { Box, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import { CheckCircle, AccessTime, LocalHospital, Lock } from '@mui/icons-material';

const STATUS_CONFIG = {
    upcoming:   { color: '#1565C0', bg: '#E3F2FD', label: 'Upcoming'   },
    confirmed:  { color: '#1565C0', bg: '#E3F2FD', label: 'Upcoming'   },
    pending:    { color: '#1565C0', bg: '#E3F2FD', label: 'Upcoming'   },
    checked_in: { color: '#E65100', bg: '#FFF3E0', label: 'Checked In' },
    completed:  { color: '#2E7D32', bg: '#E8F5E9', label: 'Completed'  },
    cancelled:  { color: '#C62828', bg: '#FFEBEE', label: 'Cancelled'  },
};

/**
 * Returns true if the appointment has a confirmed payment,
 * meaning it can no longer be cancelled.
 */
const isPaid = (apt) =>
    apt.isPaid === true || apt.paymentStatus === 'paid';

const buildDisplayName = (apt) => {
    if (apt.patientTitle && apt.patientFirstName && apt.patientLastName) {
        return `${apt.patientTitle} ${apt.patientFirstName} ${apt.patientLastName}`;
    }
    return apt.patientDisplayName || apt.patientName || '—';
};

const AppointmentCard = ({ appointment, onMarkComplete }) => {
    const cfg        = STATUS_CONFIG[appointment?.status] || STATUS_CONFIG.upcoming;
    const displayName = buildDisplayName(appointment);
    const apptNum    = appointment.appointmentNumber ? `No ${appointment.appointmentNumber}` : '—';
    const paid       = isPaid(appointment);

    return (
        <Box sx={{
            display: 'flex', alignItems: 'center', px: 2, py: 1.5,
            '&:hover': { bgcolor: '#F8FAF8' }, transition: 'background 0.15s',
        }}>
            {/* Appt number */}
            <Typography sx={{ width: 70, fontSize: 12, fontWeight: 700, color: '#2E7D32', flexShrink: 0 }}>
                {apptNum}
            </Typography>

            {/* Patient name */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={600} noWrap>{displayName}</Typography>
            </Box>

            {/* Age */}
            <Box sx={{ width: 64, flexShrink: 0, display: { xs: 'none', sm: 'block' } }}>
                {appointment.patientAge != null && (
                    <Chip
                        label={`Age ${appointment.patientAge}`}
                        size="small"
                        sx={{ bgcolor: '#F0F4F8', color: '#444', fontSize: 11, height: 22, fontWeight: 600 }}
                    />
                )}
            </Box>

            {/* Time */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: 90, flexShrink: 0 }}>
                <AccessTime sx={{ fontSize: 13, color: '#888' }} />
                <Typography variant="body2" fontSize={12}>{appointment.time}</Typography>
            </Box>

            {/* Hospital */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5, flex: 1, minWidth: 0 }}>
                <LocalHospital sx={{ fontSize: 13, color: '#888', flexShrink: 0 }} />
                <Typography variant="body2" fontSize={12} noWrap>{appointment.hospital}</Typography>
            </Box>

            {/* Status + paid lock */}
            <Box sx={{ width: 140, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Chip label={cfg.label} size="small" sx={{
                    bgcolor: cfg.bg, color: cfg.color,
                    fontWeight: 700, fontSize: 11, height: 22,
                    border: `1px solid ${cfg.color}33`,
                }} />
                {paid && (
                    <Tooltip title="Payment received — cannot be cancelled">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                            <Lock sx={{ fontSize: 13, color: '#2E7D32' }} />
                            <Typography sx={{ fontSize: 10, color: '#2E7D32', fontWeight: 700 }}>Paid</Typography>
                        </Box>
                    </Tooltip>
                )}
            </Box>

            {/* Actions — mark complete only; cancellation blocked for paid appointments */}
            <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
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
