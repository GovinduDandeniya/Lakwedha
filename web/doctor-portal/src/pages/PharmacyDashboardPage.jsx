import React, { useEffect, useState } from 'react';
import {
    Box, Container, Paper, Typography, Button, Avatar, Chip, Divider, CircularProgress,
} from '@mui/material';
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';
import { useNavigate } from 'react-router-dom';

const PharmacyDashboardPage = () => {
    const navigate = useNavigate();
    const [pharmacy, setPharmacy] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('pharmacy_token');
        if (!token) { navigate('/login'); return; }
        const stored = localStorage.getItem('pharmacy_user');
        if (stored) {
            try { setPharmacy(JSON.parse(stored)); } catch (_) {}
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('pharmacy_token');
        localStorage.removeItem('pharmacy_user');
        navigate('/login');
    };

    if (!pharmacy) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#EFF6FF' }}>
            <Box sx={{ bgcolor: '#1565C0', color: '#fff', px: 4, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <LocalPharmacyIcon />
                    <Typography variant="h6" fontWeight={700}>Lakwedha Pharmacy Portal</Typography>
                </Box>
                <Button variant="outlined" size="small" onClick={handleLogout}
                    sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                    Logout
                </Button>
            </Box>

            <Container maxWidth="md" sx={{ mt: 5 }}>
                <Paper elevation={3} sx={{ p: { xs: 3, md: 5 }, borderRadius: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                        <Avatar sx={{ width: 72, height: 72, bgcolor: '#1565C0', fontSize: 30 }}>
                            {pharmacy.pharmacyName?.charAt(0) || 'P'}
                        </Avatar>
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Typography variant="h5" fontWeight={700}>{pharmacy.pharmacyName}</Typography>
                                <Chip label="Approved" color="success" size="small" sx={{ fontWeight: 700 }} />
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                Welcome back, {pharmacy.ownerName || pharmacy.email}
                            </Typography>
                        </Box>
                    </Box>

                    <Divider sx={{ mb: 3 }} />

                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                            <EmailIcon sx={{ color: '#1565C0', mt: 0.3 }} />
                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>Email</Typography>
                                <Typography variant="body2">{pharmacy.email}</Typography>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                            <LocationOnIcon sx={{ color: '#1565C0', mt: 0.3 }} />
                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>Location</Typography>
                                <Typography variant="body2">
                                    {[pharmacy.city, pharmacy.district, pharmacy.province].filter(Boolean).join(', ')}
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                            <BadgeIcon sx={{ color: '#1565C0', mt: 0.3 }} />
                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>Owner</Typography>
                                <Typography variant="body2">{pharmacy.ownerName || '—'}</Typography>
                            </Box>
                        </Box>
                    </Box>

                    <Box sx={{ mt: 4, p: 3, bgcolor: '#E3F2FD', borderRadius: 2 }}>
                        <Typography variant="body2" color="#1565C0" fontWeight={500}>
                            Your pharmacy account is active. More features such as prescription management and order tracking will be available soon.
                        </Typography>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default PharmacyDashboardPage;
