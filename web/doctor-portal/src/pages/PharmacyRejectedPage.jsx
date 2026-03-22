import React from 'react';
import { Box, Container, Paper, Typography, Button } from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import { useNavigate, useLocation } from 'react-router-dom';

const PharmacyRejectedPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const reason = location.state?.reason || 'No reason was provided by the administrator.';

    const handleResubmit = () => {
        navigate('/pharmacy/register');
    };

    const handleBackToLogin = () => {
        localStorage.removeItem('pharmacy_token');
        localStorage.removeItem('pharmacy_user');
        navigate('/login');
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#FFF5F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Container maxWidth="sm">
                <Paper elevation={4} sx={{
                    p: { xs: 4, md: 6 }, borderRadius: 3, textAlign: 'center',
                    border: '1px solid #FFCDD2',
                }}>
                    <Box sx={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 80, height: 80, borderRadius: '50%', bgcolor: '#FFEBEE', mb: 3,
                    }}>
                        <CancelIcon sx={{ fontSize: 44, color: '#C62828' }} />
                    </Box>

                    <Typography variant="h5" fontWeight={700} color="#C62828" gutterBottom>
                        Registration Declined
                    </Typography>

                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        Your pharmacy registration request has been reviewed and was not approved.
                    </Typography>

                    <Box sx={{
                        bgcolor: '#FFEBEE', border: '1px solid #FFCDD2',
                        borderRadius: 2, p: 2.5, mb: 4, textAlign: 'left',
                    }}>
                        <Typography variant="subtitle2" fontWeight={700} color="#B71C1C" gutterBottom>
                            Reason for Rejection
                        </Typography>
                        <Typography variant="body2" color="#C62828">
                            {reason}
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Button variant="contained" size="large" onClick={handleResubmit}
                            sx={{ bgcolor: '#1565C0', '&:hover': { bgcolor: '#0D47A1' }, borderRadius: 2, py: 1.3 }}>
                            Edit &amp; Resubmit
                        </Button>
                        <Button variant="outlined" size="large"
                            onClick={() => window.location.href = 'mailto:support@lakwedha.com'}
                            sx={{ borderColor: '#C62828', color: '#C62828', borderRadius: 2, py: 1.3, '&:hover': { borderColor: '#B71C1C', bgcolor: '#FFF5F5' } }}>
                            Contact Support
                        </Button>
                        <Button variant="text" onClick={handleBackToLogin} sx={{ color: 'text.secondary', mt: 0.5 }}>
                            Back to Login
                        </Button>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default PharmacyRejectedPage;
