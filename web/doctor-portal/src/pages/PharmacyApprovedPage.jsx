import React from 'react';
import { Box, Container, Paper, Typography, Button } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';

const PharmacyApprovedPage = () => {
    const navigate = useNavigate();

    const handleBackToLogin = () => {
        localStorage.removeItem('pharmacy_token');
        localStorage.removeItem('pharmacy_user');
        navigate('/login');
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#F0FFF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Container maxWidth="sm">
                <Paper elevation={4} sx={{ p: { xs: 4, md: 6 }, borderRadius: 3, textAlign: 'center', border: '1px solid #C8E6C9' }}>
                    <Box sx={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 80, height: 80, borderRadius: '50%', bgcolor: '#E8F5E9', mb: 3,
                    }}>
                        <CheckCircleIcon sx={{ fontSize: 44, color: '#2E7D32' }} />
                    </Box>

                    <Typography variant="h5" fontWeight={700} color="#2E7D32" gutterBottom>
                        Registration Approved!
                    </Typography>

                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        Your pharmacy registration has been reviewed and approved by the Lakwedha admin team.
                        You now have full access to the platform.
                    </Typography>

                    <Box sx={{ bgcolor: '#E8F5E9', border: '1px solid #C8E6C9', borderRadius: 2, p: 2.5, mb: 4 }}>
                        <Typography variant="body2" color="#2E7D32">
                            You can now log in to access your pharmacy dashboard and start managing prescriptions and orders.
                        </Typography>
                    </Box>

                    <Button variant="contained" size="large" onClick={handleBackToLogin}
                        sx={{ minWidth: 180, bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' }, py: 1.3, fontWeight: 700 }}>
                        Go to Login
                    </Button>
                </Paper>
            </Container>
        </Box>
    );
};

export default PharmacyApprovedPage;
