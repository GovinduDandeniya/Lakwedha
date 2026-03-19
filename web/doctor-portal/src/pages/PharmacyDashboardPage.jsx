import React from 'react';
import { Box, Paper, Typography, Button, Container, Chip } from '@mui/material';
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';
import { useNavigate } from 'react-router-dom';

const PharmacyDashboardPage = () => {
    const navigate = useNavigate();
    const raw = localStorage.getItem('pharmacy_user');
    const pharmacyUser = raw ? JSON.parse(raw) : {};

    const handleLogout = () => {
        localStorage.removeItem('pharmacy_token');
        localStorage.removeItem('pharmacy_user');
        navigate('/login');
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#F0F4F8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Container maxWidth="sm">
                <Paper elevation={3} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 3, textAlign: 'center' }}>

                    <Box sx={{
                        width: 64, height: 64, borderRadius: '50%', bgcolor: '#E3F2FD',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        mx: 'auto', mb: 2,
                    }}>
                        <LocalPharmacyIcon sx={{ color: '#1565C0', fontSize: 32 }} />
                    </Box>

                    <Chip label="Approved" color="success" size="small" sx={{ mb: 2 }} />

                    <Typography variant="h5" fontWeight={700} gutterBottom>
                        Pharmacy Dashboard
                    </Typography>

                    {pharmacyUser.pharmacyName && (
                        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                            {pharmacyUser.pharmacyName}
                        </Typography>
                    )}
                    {pharmacyUser.email && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            {pharmacyUser.email}
                        </Typography>
                    )}

                    <Box sx={{ bgcolor: '#E8F5E9', borderRadius: 2, p: 2, mb: 4 }}>
                        <Typography variant="body2" color="#2E7D32">
                            Your pharmacy account is active. Full dashboard features coming soon.
                        </Typography>
                    </Box>

                    <Button
                        variant="outlined"
                        onClick={handleLogout}
                        sx={{ borderColor: '#1565C0', color: '#1565C0' }}
                    >
                        Logout
                    </Button>
                </Paper>
            </Container>
        </Box>
    );
};

export default PharmacyDashboardPage;
