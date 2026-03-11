import { Box, Typography, Chip, Button, IconButton, Tooltip } from '@mui/material';
import { CheckCircle, PersonAdd, Repeat, FolderOpen, CloudUpload } from '@mui/icons-material';

const STATUS_CONFIG = {
    upcoming:  { color: '#1565C0', bg: '#E3F2FD', label: 'Upcoming'  },
    confirmed: { color: '#1565C0', bg: '#E3F2FD', label: 'Upcoming'  },
    completed: { color: '#2E7D32', bg: '#E8F5E9', label: 'Completed' },
    cancelled: { color: '#C62828', bg: '#FFEBEE', label: 'Cancelled' },
};

const buildDisplayName = (apt) => {
    if (apt.patientTitle && apt.patientFirstName && apt.patientLastName) {
        return `${apt.patientTitle} ${apt.patientFirstName} ${apt.patientLastName}`;
    }
    return apt.patientDisplayName || apt.patientName || '—';
};

const VisitBadge = ({ totalVisits }) => {
    if (totalVisits === 0) {
        return (
            <Chip
                icon={<PersonAdd sx={{ fontSize: '11px !important', ml: '4px !important' }} />}
                label="New Patient"
                size="small"
                sx={{
                    height: 18, fontSize: 10, fontWeight: 700,
                    bgcolor: '#E8F5E9', color: '#2E7D32',
                    border: '1px solid #A5D6A7',
                    '& .MuiChip-label': { px: 0.75 },
                }}
            />
        );
    }
    return (
        <Chip
            icon={<Repeat sx={{ fontSize: '11px !important', ml: '4px !important' }} />}
            label={`${totalVisits} visit${totalVisits !== 1 ? 's' : ''}`}
            size="small"
            sx={{
                height: 18, fontSize: 10, fontWeight: 600,
                bgcolor: '#F3E5F5', color: '#6A1B9A',
                border: '1px solid #CE93D8',
                '& .MuiChip-label': { px: 0.75 },
            }}
        />
    );
};

const AppointmentCard = ({ appointment, onMarkComplete, onViewRecords, onUploadRecords }) => {
    const cfg         = STATUS_CONFIG[appointment?.status] || STATUS_CONFIG.upcoming;
    const displayName = buildDisplayName(appointment);
    const apptNum     = appointment.appointmentNumber ? `No ${appointment.appointmentNumber}` : '—';
    const hasVisits   = appointment.totalVisits != null;
    const isReturning = hasVisits && appointment.totalVisits > 0;
    const isCancelled = appointment.status === 'cancelled';
    const isCompleted = appointment.status === 'completed';

    return (
        <Box sx={{
            display: 'flex', alignItems: 'center', px: 2, py: 1.25,
            '&:hover': { bgcolor: '#F8FAF8' }, transition: 'background 0.15s',
            minHeight: 56,
        }}>
            {/* Appointment No. */}
            <Typography sx={{ width: 52, fontSize: 12, fontWeight: 700, color: '#2E7D32', flexShrink: 0 }}>
                {apptNum}
            </Typography>

            {/* Patient name + visit badge */}
            <Box sx={{ flex: 1, minWidth: 0, pr: 2 }}>
                <Typography variant="body2" fontWeight={600} noWrap sx={{ lineHeight: 1.3 }}>
                    {displayName}
                </Typography>
                {hasVisits && (
                    <Box sx={{ mt: 0.3 }}>
                        <VisitBadge totalVisits={appointment.totalVisits} />
                    </Box>
                )}
            </Box>

            {/* Age */}
            <Box sx={{ width: 72, flexShrink: 0, display: { xs: 'none', sm: 'flex' }, alignItems: 'center' }}>
                {appointment.patientAge != null && (
                    <Chip
                        label={`Age ${appointment.patientAge}`}
                        size="small"
                        sx={{ bgcolor: '#F0F4F8', color: '#555', fontSize: 11, height: 22, fontWeight: 600 }}
                    />
                )}
            </Box>

            {/* Status chip */}
            <Box sx={{ width: 90, flexShrink: 0 }}>
                <Chip
                    label={cfg.label}
                    size="small"
                    sx={{
                        bgcolor: cfg.bg, color: cfg.color,
                        fontWeight: 700, fontSize: 11, height: 22,
                        border: `1px solid ${cfg.color}33`,
                    }}
                />
            </Box>

            {/* EMR actions + Complete */}
            <Box sx={{
                width: 210, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.75,
            }}>
                {/* View Medical Records — returning patients, not cancelled */}
                {!isCancelled && isReturning && (
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<FolderOpen sx={{ fontSize: '13px !important' }} />}
                        onClick={() => onViewRecords?.(appointment)}
                        sx={{
                            fontSize: 11, fontWeight: 600, height: 28,
                            px: 1, py: 0, textTransform: 'none', whiteSpace: 'nowrap',
                            color: '#1565C0', borderColor: '#90CAF9',
                            '&:hover': { bgcolor: '#E3F2FD', borderColor: '#1565C0' },
                        }}
                    >
                        View Records
                    </Button>
                )}

                {/* Upload Medical Record — all non-cancelled patients */}
                {!isCancelled && (
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<CloudUpload sx={{ fontSize: '13px !important' }} />}
                        onClick={() => onUploadRecords?.(appointment)}
                        sx={{
                            fontSize: 11, fontWeight: 600, height: 28,
                            px: 1, py: 0, textTransform: 'none', whiteSpace: 'nowrap',
                            color: '#E65100', borderColor: '#FFCC80',
                            '&:hover': { bgcolor: '#FFF3E0', borderColor: '#E65100' },
                        }}
                    >
                        {isReturning ? 'Add Record' : 'Upload Record'}
                    </Button>
                )}

                {/* Mark as Completed */}
                {!isCompleted && !isCancelled && (
                    <Tooltip title="Mark as Completed">
                        <IconButton
                            size="small"
                            sx={{ color: '#2E7D32', '&:hover': { bgcolor: '#E8F5E9' } }}
                            onClick={() => onMarkComplete?.(appointment.id)}
                        >
                            <CheckCircle sx={{ fontSize: 20 }} />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>
        </Box>
    );
};

export default AppointmentCard;
