import React from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Container,
} from '@mui/material';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PendingPage = () => {
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    const handleLogout = () => {
        logout();
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                bgcolor: '#F0F6FF',
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
                    }}
                >
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

                    <Typography variant="h5" fontWeight={700} gutterBottom color="text.primary">
                        Registration Under Review
                    </Typography>

                    <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                        {user?.email && (
                            <>
                                <strong>{user.email}</strong>
                                <br />
                            </>
                        )}
                        Your account is under review by the admin. You will be notified once approved.
                    </Typography>

                    <Box
                        sx={{
                            bgcolor: '#E3F2FD',
                            borderRadius: 2,
                            p: 2,
                            mt: 3,
                            mb: 4,
                        }}
                    >
                        <Typography variant="body2" color="#1565C0">
                            This process usually takes 1–2 business days. If you have not heard back after 3 days,
                            please contact the Lakwedha admin team.
                        </Typography>
                    </Box>

                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={handleLogout}
                        sx={{ minWidth: 160 }}
                    >
                        Back to Login
                    </Button>
                </Paper>
            </Container>
        </Box>
    );
};

export default PendingPage;
