import React from 'react';
import { Box, Typography, Chip, Divider } from '@mui/material';
import { LocalHospital, AccessTime, LocationOn } from '@mui/icons-material';

const clinics = [
    { name: 'Nawaloka Hospital', location: 'Colombo 02', days: 'Mon, Wed, Fri', hours: '9:00 AM – 12:00 PM', color: '#1565C0' },
    { name: 'Lanka Hospital',    location: 'Colombo 05', days: 'Tue, Thu',      hours: '2:00 PM – 5:00 PM',  color: '#2E7D32' },
    { name: 'Asiri Hospital',    location: 'Colombo 05', days: 'Saturday',      hours: '10:00 AM – 1:00 PM', color: '#E65100' },
];

const ClinicInfo = () => (
    <Box>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, color: '#2E7D32' }}>
            Practicing Hospitals
        </Typography>
        {clinics.map((c, idx) => (
            <React.Fragment key={c.name}>
                <Box sx={{ display: 'flex', gap: 2, py: 1.5 }}>
                    <Box sx={{
                        width: 42, height: 42, borderRadius: 2, flexShrink: 0,
                        bgcolor: `${c.color}11`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <LocalHospital sx={{ color: c.color, fontSize: 20 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={700}>{c.name}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                            <LocationOn sx={{ fontSize: 12, color: '#888' }} />
                            <Typography variant="caption" color="text.secondary">{c.location}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                            <Chip label={c.days} size="small"
                                sx={{ bgcolor: `${c.color}11`, color: c.color, fontSize: 10, height: 20, fontWeight: 600 }}
                            />
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                <AccessTime sx={{ fontSize: 11, color: '#888' }} />
                                <Typography variant="caption" color="text.secondary">{c.hours}</Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>
                {idx < clinics.length - 1 && <Divider />}
            </React.Fragment>
        ))}
    </Box>
);

export default ClinicInfo;
