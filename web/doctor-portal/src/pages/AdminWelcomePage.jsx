import React, { useEffect, useState } from 'react';
import {
    Box, Container, Paper, Typography, Button, Avatar, Chip, Divider,
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useNavigate } from 'react-router-dom';

const AdminWelcomePage = () => {
    const navigate = useNavigate();
    const [admin, setAdmin] = useState(null);

    useEffect(() => {
        const raw = localStorage.getItem('admin_user');
        if (!raw) { navigate('/login'); return; }
        try { setAdmin(JSON.parse(raw)); } catch { navigate('/login'); }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        navigate('/login');
    };

    if (!admin) return null;

    const initials = admin.fullName
        ? admin.fullName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
        : 'AD';

    return (
        <Container component="main" maxWidth="sm">
            <Box sx={{ mt: 10, mb: 6, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Paper elevation={3} sx={{ p: { xs: 3, sm: 4 }, width: '100%', borderRadius: 2 }}>

                    {/* Top badge */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                        <Chip
                            icon={<AdminPanelSettingsIcon sx={{ fontSize: '16px !important' }} />}
                            label="Administrator"
                            size="small"
                            sx={{
                                bgcolor: '#FEF3C7', color: '#92400E',
                                fontWeight: 700, letterSpacing: 0.5,
                                border: '1px solid #FCD34D',
                            }}
                        />
                    </Box>

                    {/* Avatar + name */}
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <Avatar
                            sx={{
                                width: 72, height: 72, mx: 'auto', mb: 1.5,
                                bgcolor: '#B45309', fontSize: 26, fontWeight: 700,
                            }}
                        >
                            {initials}
                        </Avatar>
                        <Typography variant="h5" fontWeight={700}>
                            {admin.fullName || 'Admin User'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {admin.email}
                        </Typography>
                    </Box>

                    <Divider sx={{ mb: 3 }} />

                    {/* Info */}
                    <Box sx={{
                        bgcolor: '#FFFBEB', border: '1px solid #FDE68A',
                        borderRadius: 2, p: 2, mb: 3,
                    }}>
                        <Typography variant="body2" color="#92400E" fontWeight={600} gutterBottom>
                            You are signed in as an Administrator.
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Use the Admin Portal to manage practitioners, appointments, patients,
                            and system settings.
                        </Typography>
                    </Box>

                    {/* Actions */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Button
                            fullWidth variant="contained" size="large"
                            endIcon={<OpenInNewIcon />}
                            href="http://localhost:3000/admin/dashboard"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                                py: 1.3, fontWeight: 700,
                                bgcolor: '#B45309',
                                '&:hover': { bgcolor: '#92400E' },
                            }}
                        >
                            Open Admin Portal
                        </Button>

                        <Button
                            fullWidth variant="outlined" size="large"
                            startIcon={<LogoutIcon />}
                            onClick={handleLogout}
                            sx={{
                                py: 1.2, fontWeight: 600,
                                borderColor: '#B45309', color: '#B45309',
                                '&:hover': { borderColor: '#92400E', color: '#92400E', bgcolor: '#FEF3C7' },
                            }}
                        >
                            Sign Out
                        </Button>
                    </Box>

                </Paper>
            </Box>
        </Container>
    );
};

export default AdminWelcomePage;
