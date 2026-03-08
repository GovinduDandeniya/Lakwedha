import React, { useState } from 'react';
import { Box, Typography, Paper, Tabs, Tab, Grid } from '@mui/material';
import { Person, LocalHospital, School } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import DoctorProfile from '../components/profile/DoctorProfile';
import ClinicInfo from '../components/profile/ClinicInfo';
import Qualifications from '../components/profile/Qualifications';

const TABS = [
    { label: 'My Profile',       icon: <Person fontSize="small" /> },
    { label: 'Clinic Info',      icon: <LocalHospital fontSize="small" /> },
    { label: 'Qualifications',   icon: <School fontSize="small" /> },
];

const ProfilePage = () => {
    const { user } = useAuth();
    const [tab, setTab] = useState(0);

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#F0F4F8', minHeight: '100vh' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Person sx={{ color: '#2E7D32', fontSize: 28 }} />
                <Box>
                    <Typography variant="h5" fontWeight={700}>Profile</Typography>
                    <Typography variant="body2" color="text.secondary">Manage your professional information</Typography>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* Left: Tab navigation */}
                <Grid item xs={12} md={3}>
                    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #E8EDF2', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                        <Tabs
                            value={tab}
                            onChange={(_, v) => setTab(v)}
                            orientation="vertical"
                            TabIndicatorProps={{ style: { backgroundColor: '#2E7D32', width: 3, left: 0 } }}
                        >
                            {TABS.map((t, i) => (
                                <Tab
                                    key={t.label}
                                    label={t.label}
                                    icon={t.icon}
                                    iconPosition="start"
                                    sx={{
                                        textTransform: 'none',
                                        fontWeight: tab === i ? 700 : 400,
                                        justifyContent: 'flex-start',
                                        minHeight: 52,
                                        fontSize: 14,
                                        color: tab === i ? '#2E7D32' : '#555',
                                        bgcolor: tab === i ? '#E8F5E9' : 'transparent',
                                        borderBottom: '1px solid #F5F5F5',
                                        gap: 1,
                                    }}
                                />
                            ))}
                        </Tabs>
                    </Paper>
                </Grid>

                {/* Right: Tab content */}
                <Grid item xs={12} md={9}>
                    <Paper elevation={0} sx={{ borderRadius: 3, p: 3, border: '1px solid #E8EDF2', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                        {tab === 0 && <DoctorProfile user={user} />}
                        {tab === 1 && <ClinicInfo />}
                        {tab === 2 && <Qualifications />}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ProfilePage;
