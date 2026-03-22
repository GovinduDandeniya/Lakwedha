import { useState } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Typography, Chip, IconButton, Menu, MenuItem, ListItemIcon, ListItemText,
    Box, Tooltip,
} from '@mui/material';
import {
    MoreVert, CheckCircle, FolderOpen, CloudUpload,
    PersonAdd, Repeat,
} from '@mui/icons-material';

/* ── Status colour map ──────────────────────────────────────────────────────── */
const STATUS = {
    upcoming:          { color: '#1565C0', bg: '#E3F2FD', label: 'Upcoming'           },
    confirmed:         { color: '#1565C0', bg: '#E3F2FD', label: 'Upcoming'           },
    completed:         { color: '#2E7D32', bg: '#E8F5E9', label: 'Completed'          },
    cancelled:         { color: '#C62828', bg: '#FFEBEE', label: 'Cancelled'          },
    cancel_requested:  { color: '#E65100', bg: '#FFF3E0', label: 'Cancel Requested'   },
};

const buildName = (apt) => {
    if (apt.patientTitle && apt.patientFirstName && apt.patientLastName)
        return `${apt.patientTitle} ${apt.patientFirstName} ${apt.patientLastName}`;
    return apt.patientDisplayName || apt.patientName || '—';
};

/* ── Visit badge ────────────────────────────────────────────────────────────── */
const VisitBadge = ({ totalVisits }) =>
    totalVisits === 0 ? (
        <Chip
            icon={<PersonAdd sx={{ fontSize: '10px !important', ml: '4px !important' }} />}
            label="New Patient"
            size="small"
            sx={{
                height: 17, fontSize: 10, fontWeight: 700, flexShrink: 0,
                bgcolor: '#E8F5E9', color: '#2E7D32', border: '1px solid #A5D6A7',
                '& .MuiChip-label': { px: 0.6 },
            }}
        />
    ) : (
        <Chip
            icon={<Repeat sx={{ fontSize: '10px !important', ml: '4px !important' }} />}
            label={`${totalVisits} visit${totalVisits !== 1 ? 's' : ''}`}
            size="small"
            sx={{
                height: 17, fontSize: 10, fontWeight: 600, flexShrink: 0,
                bgcolor: '#F3E5F5', color: '#6A1B9A', border: '1px solid #CE93D8',
                '& .MuiChip-label': { px: 0.6 },
            }}
        />
    );

/* ── EMR dropdown menu (View Records + Upload) ──────────────────────────────── */
const EMRMenu = ({ appointment, onViewRecords, onUploadRecords }) => {
    const [anchor, setAnchor] = useState(null);
    const open        = Boolean(anchor);
    const isCancelled = appointment.status === 'cancelled' || appointment.status === 'cancel_requested';
    const isReturning = appointment.totalVisits > 0;

    if (isCancelled) return <Typography fontSize={12} color="text.disabled">—</Typography>;

    const close  = () => setAnchor(null);
    const handle = (fn) => { close(); fn?.(); };

    return (
        <>
            <Tooltip title="Medical Records">
                <IconButton size="small" onClick={(e) => setAnchor(e.currentTarget)}
                    sx={{ color: '#555', '&:hover': { bgcolor: '#F0F4F8' } }}>
                    <MoreVert fontSize="small" />
                </IconButton>
            </Tooltip>

            <Menu
                anchorEl={anchor}
                open={open}
                onClose={close}
                slotProps={{
                    paper: { elevation: 3, sx: { minWidth: 210, borderRadius: 2, mt: 0.5 } },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                {/* View Medical Records — all upcoming patients */}
                <MenuItem onClick={() => handle(() => onViewRecords?.(appointment))} sx={{ py: 1 }}>
                    <ListItemIcon><FolderOpen fontSize="small" sx={{ color: '#1565C0' }} /></ListItemIcon>
                    <ListItemText
                        primary="View Medical Records"
                        primaryTypographyProps={{ fontSize: 13, fontWeight: 600, color: '#1565C0' }}
                    />
                </MenuItem>

                {/* Upload / Add Medical Record */}
                <MenuItem onClick={() => handle(() => onUploadRecords?.(appointment))} sx={{ py: 1 }}>
                    <ListItemIcon><CloudUpload fontSize="small" sx={{ color: '#E65100' }} /></ListItemIcon>
                    <ListItemText
                        primary={isReturning ? 'Add Medical Record' : 'Upload Medical Record'}
                        primaryTypographyProps={{ fontSize: 13, fontWeight: 600, color: '#E65100' }}
                    />
                </MenuItem>
            </Menu>
        </>
    );
};

/* ── Main list component ────────────────────────────────────────────────────── */
const AppointmentList = ({ appointments, onMarkComplete, onViewRecords, onUploadRecords }) => {
    if (!appointments || appointments.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography color="text.secondary">No appointments found</Typography>
            </Box>
        );
    }

    return (
        <TableContainer>
            <Table size="small" sx={{ tableLayout: 'fixed' }}>
                <TableHead>
                    <TableRow sx={{ bgcolor: '#F5F7F5' }}>
                        <TableCell sx={{ width: 64,    ...hdr }}>No.</TableCell>
                        <TableCell sx={{ width: '40%', ...hdr }}>Patient</TableCell>
                        <TableCell sx={{ width: 90,    ...hdr, display: { xs: 'none', sm: 'table-cell' } }}>Age</TableCell>
                        <TableCell sx={{ width: 110,   ...hdr }}>Status</TableCell>
                        <TableCell sx={{ width: 52,    ...hdr, textAlign: 'center' }}>Done</TableCell>
                        <TableCell sx={{ width: 56,    ...hdr, textAlign: 'right' }}>EMR</TableCell>
                    </TableRow>
                </TableHead>

                <TableBody>
                    {appointments.map((apt) => {
                        const cfg        = STATUS[apt.status] || STATUS.upcoming;
                        const name       = buildName(apt);
                        const hasVisits  = apt.totalVisits != null;
                        const isUpcoming = apt.status === 'confirmed' || apt.status === 'upcoming';

                        return (
                            <TableRow key={apt.id} hover sx={{ '& td': { borderColor: '#F0F0F0' } }}>

                                {/* No. */}
                                <TableCell sx={{ fontSize: 12, fontWeight: 700, color: '#2E7D32', py: 1.25 }}>
                                    {apt.appointmentNumber ? `No ${apt.appointmentNumber}` : '—'}
                                </TableCell>

                                {/* Patient */}
                                <TableCell sx={{ py: 1.25 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden' }}>
                                        <Typography variant="body2" fontWeight={600} noWrap sx={{ lineHeight: 1.3, flexShrink: 0 }}>
                                            {name}
                                        </Typography>
                                        {hasVisits && <VisitBadge totalVisits={apt.totalVisits} />}
                                    </Box>
                                </TableCell>

                                {/* Age */}
                                <TableCell sx={{ py: 1.25, display: { xs: 'none', sm: 'table-cell' } }}>
                                    {apt.patientAge != null && (
                                        <Chip
                                            label={`Age ${apt.patientAge}`}
                                            size="small"
                                            sx={{ bgcolor: '#F0F4F8', color: '#555', fontSize: 11, height: 22, fontWeight: 600 }}
                                        />
                                    )}
                                </TableCell>

                                {/* Status */}
                                <TableCell sx={{ py: 1.25 }}>
                                    <Chip
                                        label={cfg.label}
                                        size="small"
                                        sx={{
                                            bgcolor: cfg.bg, color: cfg.color,
                                            fontWeight: 700, fontSize: 11, height: 22,
                                            border: `1px solid ${cfg.color}33`,
                                        }}
                                    />
                                </TableCell>

                                {/* Complete button — upcoming only */}
                                <TableCell sx={{ py: 1.25, textAlign: 'center' }}>
                                    {isUpcoming && (
                                        <Tooltip title="Mark as Completed">
                                            <IconButton
                                                size="small"
                                                onClick={() => onMarkComplete?.(apt.id)}
                                                sx={{ color: '#2E7D32', '&:hover': { bgcolor: '#E8F5E9' } }}
                                            >
                                                <CheckCircle sx={{ fontSize: 20 }} />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </TableCell>

                                {/* EMR menu */}
                                <TableCell sx={{ py: 1.25, textAlign: 'right' }}>
                                    <EMRMenu
                                        appointment={apt}
                                        onViewRecords={onViewRecords}
                                        onUploadRecords={onUploadRecords}
                                    />
                                </TableCell>

                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

/* ── Shared header cell styles ──────────────────────────────────────────────── */
const hdr = {
    fontSize: 11, fontWeight: 700, color: '#888',
    textTransform: 'uppercase', letterSpacing: 0.5,
    borderBottom: '1px solid #E8EDF2', py: 0.75,
};

export default AppointmentList;
