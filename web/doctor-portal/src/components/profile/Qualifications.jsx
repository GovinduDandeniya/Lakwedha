import React from 'react';
import { Box, Typography, Chip, Divider } from '@mui/material';
import { School, VerifiedUser, WorkspacePremium } from '@mui/icons-material';

const qualifications = [
    { type: 'education', icon: <School />, color: '#1565C0', title: 'MBBS', institution: 'University of Colombo', year: '2010' },
    { type: 'education', icon: <School />, color: '#1565C0', title: 'MD (Internal Medicine)', institution: 'Postgraduate Institute of Medicine', year: '2015' },
    { type: 'cert', icon: <VerifiedUser />, color: '#2E7D32', title: 'MRCP (UK)', institution: 'Royal College of Physicians', year: '2016' },
    { type: 'award', icon: <WorkspacePremium />, color: '#E65100', title: 'Best Doctor Award', institution: 'Sri Lanka Medical Association', year: '2022' },
];

const Qualifications = () => (
    <Box>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, color: '#2E7D32' }}>
            Education & Certifications
        </Typography>
        {qualifications.map((q, idx) => (
            <React.Fragment key={q.title}>
                <Box sx={{ display: 'flex', gap: 2, py: 1.5 }}>
                    <Box sx={{
                        width: 42, height: 42, borderRadius: 2, flexShrink: 0,
                        bgcolor: `${q.color}11`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {React.cloneElement(q.icon, { sx: { color: q.color, fontSize: 20 } })}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" fontWeight={700}>{q.title}</Typography>
                            <Chip label={q.year} size="small"
                                sx={{ bgcolor: '#F5F5F5', color: '#666', fontSize: 10, height: 18 }}
                            />
                        </Box>
                        <Typography variant="caption" color="text.secondary">{q.institution}</Typography>
                    </Box>
                </Box>
                {idx < qualifications.length - 1 && <Divider />}
            </React.Fragment>
        ))}
    </Box>
);

export default Qualifications;
