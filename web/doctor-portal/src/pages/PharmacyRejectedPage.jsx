import React from 'react';
import { Box, Paper, Typography, Button, Container, Alert } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useNavigate, useLocation } from 'react-router-dom';

const PharmacyRejectedPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Rejection reason can be passed via navigation state or query param
    const reason =
        location?.state?.reason ||
        new URLSearchParams(location.search).get('reason') ||
        'Your application did not meet the registration requirements.';

    return (
        <Box
            sx={{
                minHeight: '100vh',
                bgcolor: '#FFF8F8',
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
                            bgcolor: '#FFEBEE',
                            mb: 3,
                        }}
                    >
                        <ErrorOutlineIcon sx={{ fontSize: 40, color: '#C62828' }} />
                    </Box>

                    {/* Title */}
                    <Typography variant="h5" fontWeight={700} gutterBottom color="error.dark">
                        Registration Rejected
                    </Typography>

                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        Your pharmacy registration was rejected.
                    </Typography>

                    {/* Reason box */}
                    <Alert severity="error" sx={{ mb: 4, textAlign: 'left', borderRadius: 2 }}>
                        <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                            Reason:
                        </Typography>
                        <Typography variant="body2">{reason}</Typography>
                    </Alert>

                    {/* Actions */}
                    <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                        <Button
                            variant="contained"
                            fullWidth
                            onClick={() => navigate('/pharmacy/register')}
                            sx={{ bgcolor: '#1565C0', py: 1.2 }}
                        >
                            Edit & Resubmit
                        </Button>
                        <Button
                            variant="outlined"
                            fullWidth
                            href="mailto:support@lakwedha.lk"
                            sx={{ borderColor: '#C62828', color: '#C62828', py: 1.2 }}
                        >
                            Contact Support
                        </Button>
                    </Box>

                    <Button
                        variant="text"
                        onClick={() => navigate('/login')}
                        sx={{ mt: 2, color: 'text.secondary', fontSize: '0.8rem' }}
                    >
                        ← Back to Login
                    </Button>
                </Paper>
            </Container>
        </Box>
    );
};

export default PharmacyRejectedPage;
