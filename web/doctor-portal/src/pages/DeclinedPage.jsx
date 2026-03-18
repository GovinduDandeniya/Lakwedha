import React from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Container,
} from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DeclinedPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useAuth();

    const reason = location.state?.reason || 'No reason was provided by the administrator.';
    const prefillData = location.state?.prefillData || null;

    const handleResubmit = () => {
        navigate('/register', { state: { prefillData } });
    };

    const handleContactSupport = () => {
        window.location.href = 'mailto:support@lakwedha.com';
    };

    const handleBackToLogin = () => {
        logout();
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                bgcolor: '#FFF5F5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Container maxWidth="sm">
                <Paper
                    elevation={4}
                    sx={{
                        p: { xs: 4, md: 6 },
                        borderRadius: 3,
                        textAlign: 'center',
                        border: '1px solid',
                        borderColor: '#FFCDD2',
                    }}
                >
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
                        <CancelIcon sx={{ fontSize: 44, color: '#C62828' }} />
                    </Box>

                    <Typography variant="h5" fontWeight={700} color="#C62828" gutterBottom>
                        Registration Declined
                    </Typography>

                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        Your doctor registration request has been reviewed and was not approved.
                    </Typography>

                    {/* Reason box */}
                    <Box
                        sx={{
                            bgcolor: '#FFEBEE',
                            border: '1px solid #FFCDD2',
                            borderRadius: 2,
                            p: 2.5,
                            mb: 4,
                            textAlign: 'left',
                        }}
                    >
                        <Typography variant="subtitle2" fontWeight={700} color="#B71C1C" gutterBottom>
                            Reason for Rejection
                        </Typography>
                        <Typography variant="body2" color="#C62828">
                            {reason}
                        </Typography>
                    </Box>

                    {/* Actions */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Button
                            variant="contained"
                            size="large"
                            onClick={handleResubmit}
                            sx={{
                                bgcolor: '#C62828',
                                '&:hover': { bgcolor: '#B71C1C' },
                                borderRadius: 2,
                                py: 1.3,
                            }}
                        >
                            Edit & Resubmit
                        </Button>

                        <Button
                            variant="outlined"
                            size="large"
                            onClick={handleContactSupport}
                            sx={{
                                borderColor: '#C62828',
                                color: '#C62828',
                                borderRadius: 2,
                                py: 1.3,
                                '&:hover': { borderColor: '#B71C1C', bgcolor: '#FFF5F5' },
                            }}
                        >
                            Contact Support
                        </Button>

                        <Button
                            variant="text"
                            onClick={handleBackToLogin}
                            sx={{ color: 'text.secondary', mt: 0.5 }}
                        >
                            Back to Login
                        </Button>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default DeclinedPage;
