import React from 'react';
import { Box, Container, Paper, Typography, Button } from '@mui/material';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { useNavigate } from 'react-router-dom';

const PharmacyPendingPage = () => {
    const navigate = useNavigate();

    const handleBackToLogin = () => {
        localStorage.removeItem('pharmacy_token');
        localStorage.removeItem('pharmacy_user');
        navigate('/login');
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Container maxWidth="sm">
                <Paper elevation={4} sx={{ p: { xs: 4, md: 6 }, borderRadius: 3, textAlign: 'center' }}>
                    <Box sx={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 80, height: 80, borderRadius: '50%', bgcolor: '#FFF3E0', mb: 3,
                    }}>
                        <HourglassEmptyIcon sx={{ fontSize: 40, color: '#F57C00' }} />
                    </Box>

                    <Typography variant="h5" fontWeight={700} gutterBottom>
                        Registration Under Review
                    </Typography>

                    <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                        Your pharmacy registration has been submitted successfully.
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        The Lakwedha admin team will review your application and notify you once approved.
                    </Typography>

                    <Box sx={{ bgcolor: '#E3F2FD', borderRadius: 2, p: 2.5, mt: 3, mb: 4 }}>
                        <Typography variant="body2" color="#1565C0">
                            This process usually takes 1–2 business days. If you have not heard back after
                            3 days, please contact the Lakwedha admin team at{' '}
                            <strong>support@lakwedha.com</strong>
                        </Typography>
                    </Box>

                    <Button variant="outlined" onClick={handleBackToLogin}
                        sx={{ minWidth: 160, borderColor: '#1565C0', color: '#1565C0', '&:hover': { borderColor: '#0D47A1' } }}>
                        Back to Login
                    </Button>
                </Paper>
            </Container>
        </Box>
    );
};

export default PharmacyPendingPage;
