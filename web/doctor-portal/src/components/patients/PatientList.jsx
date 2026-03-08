import React from 'react';
import { Box, Typography, Avatar, Chip, IconButton, Tooltip, Divider } from '@mui/material';
import { Visibility, Phone } from '@mui/icons-material';

const PatientList = ({ patients, onView }) => {
    if (!patients || patients.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography color="text.secondary">No patients found</Typography>
            </Box>
        );
    }

    return (
        <Box>
            {/* Column headers — desktop only */}
            <Box sx={{
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center', px: 2, py: 1,
                bgcolor: '#F8FAF8', borderBottom: '1px solid #EEEEEE',
            }}>
                {['Patient', 'Age / Gender', 'Phone', 'Condition', 'Visits', 'Action'].map(col => (
                    <Typography key={col} sx={{
                        fontSize: 12, fontWeight: 700, color: '#666',
                        flex: col === 'Action' ? undefined : 1,
                        width: col === 'Action' ? 70 : undefined,
                    }}>{col}</Typography>
                ))}
            </Box>

            {patients.map((p, idx) => {
                const genderColor = p.gender === 'Male' ? '#1565C0' : '#C2185B';
                return (
                    <React.Fragment key={p.id}>
                        <Box sx={{
                            display: 'flex', alignItems: 'center', px: 2, py: 1.5,
                            '&:hover': { bgcolor: '#F8FAF8' }, transition: 'background 0.15s',
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
                                <Avatar sx={{ width: 34, height: 34, bgcolor: '#E8F5E9', color: '#2E7D32', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                                    {p.name?.charAt(0)}
                                </Avatar>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" fontWeight={600} noWrap>{p.name}</Typography>
                                    <Typography variant="caption" color="text.secondary" noWrap>{p.email}</Typography>
                                </Box>
                            </Box>
                            <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }}>
                                <Chip label={`${p.age} · ${p.gender}`} size="small"
                                    sx={{ bgcolor: `${genderColor}11`, color: genderColor, fontWeight: 600, fontSize: 11, height: 22 }}
                                />
                            </Box>
                            <Box sx={{ flex: 1, display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5 }}>
                                <Phone sx={{ fontSize: 13, color: '#888' }} />
                                <Typography variant="body2" fontSize={12}>{p.phone}</Typography>
                            </Box>
                            <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }}>
                                <Typography variant="body2" fontSize={12}>{p.condition}</Typography>
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Chip label={`${p.totalVisits} visits`} size="small"
                                    sx={{ bgcolor: '#F0F4F8', color: '#555', fontSize: 11, height: 22 }}
                                />
                            </Box>
                            <Box sx={{ width: 70 }}>
                                <Tooltip title="View Profile">
                                    <IconButton size="small" sx={{ color: '#1976D2' }} onClick={() => onView?.(p)}>
                                        <Visibility fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Box>
                        {idx < patients.length - 1 && <Divider />}
                    </React.Fragment>
                );
            })}
        </Box>
    );
};

export default PatientList;
