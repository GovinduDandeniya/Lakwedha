import React from 'react';
import { Box, Paper, Typography, Button, Container } from '@mui/material';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';
import { useNavigate } from 'react-router-dom';

const PharmacyPendingPage = () => {
    const navigate = useNavigate();

    return (
        <Box
            sx={{
                minHeight: '100vh',
                bgcolor: '#F0F4F8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Container maxWidth="sm">
                <Paper elevation={4} sx={{ p: { xs: 4, md: 6 }, borderRadius: 3, textAlign: 'center' }}>

                    {/* Icon */}
                    <Box
                        sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            bgcolor: '#FFF3E0',
                            mb: 3,
                        }}
                    >
                        <HourglassEmptyIcon sx={{ fontSize: 40, color: '#F57C00' }} />
                    </Box>

                    {/* Title */}
                    <Typography variant="h5" fontWeight={700} gutterBottom>
                        Registration Under Review
                    </Typography>

                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        Your pharmacy registration is under review.
                        <br />
                        Please wait for admin approval.
                    </Typography>

                    {/* Info box */}
                    <Box sx={{ bgcolor: '#E3F2FD', borderRadius: 2, p: 2, mb: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                            <LocalPharmacyIcon sx={{ color: '#1565C0', fontSize: 18 }} />
                            <Typography variant="body2" fontWeight={600} color="#1565C0">
                                What happens next?
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="#1565C0">
                            Our admin team will verify your pharmacy license and business registration.
                            This usually takes 1–2 business days. You will be able to log in once approved.
                        </Typography>
                    </Box>

                    <Button
                        variant="outlined"
                        onClick={() => navigate('/login')}
                        sx={{ minWidth: 160, borderColor: '#1565C0', color: '#1565C0' }}
                    >
                        Back to Login
                    </Button>
                </Paper>
            </Container>
        </Box>
    );
};

export default PharmacyPendingPage;
