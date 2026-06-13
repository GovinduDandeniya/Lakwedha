import React, { useState } from 'react';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    Alert,
    Divider,
    InputAdornment,
    IconButton,
    CircularProgress,
} from '@mui/material';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const TABS = [
    {
        value: 'doctor',
        label: 'Doctor',
        icon: LocalHospitalIcon,
        color: '#16a34a',
        activeBg: '#16a34a',
    },
    {
        value: 'pharmacy',
        label: 'Pharmacy',
        icon: LocalPharmacyIcon,
        color: '#1d4ed8',
        activeBg: '#1d4ed8',
    },
    {
        value: 'admin',
        label: 'Admin',
        icon: AdminPanelSettingsIcon,
        color: '#b45309',
        activeBg: '#b45309',
    },
];

// Static label above input — no floating animation
const FormField = ({ label, required, error, helperText, children }) => (
    <Box sx={{ mt: 2 }}>
        <Typography
            variant="body2"
            fontWeight={600}
            sx={{ mb: 0.5, color: error ? 'error.main' : 'text.primary' }}
        >
            {label}{required && <span style={{ color: '#d32f2f' }}> *</span>}
        </Typography>
        {children}
        {helperText && (
            <Typography
                variant="caption"
                sx={{ mt: 0.5, display: 'block', color: error ? 'error.main' : 'text.secondary' }}
            >
                {helperText}
            </Typography>
        )}
    </Box>
);

const LoginPage = () => {
    const [accountType, setAccountType] = useState('doctor');
    const [email, setEmail]             = useState('');
    const [password, setPassword]       = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError]             = useState('');
    const [loading, setLoading]         = useState(false);

    const { login } = useAuth();
    const navigate  = useNavigate();

    const activeTab = TABS.find((t) => t.value === accountType);

    const handleTabChange = (value) => {
        setAccountType(value);
        setError('');
    };

    // ── Doctor login (uses existing AuthContext) ───────────────────────────
    const handleDoctorLogin = async () => {
        const result = await login(email, password);
        if (!result.success) {
            setError(result.error || 'Login iled. Please check your credentials.');
        }
    };

    // ── Admin login ────────────────────────────────────────────────────────
    const handleAdminLogin = async () => {
        try {
            const API_URL = process.env.REACT_APP_API_URL || 'https://lakwedha.onrender.com/api/v1';
            const adminPortal = process.env.REACT_APP_ADMIN_URL || 'https://lakwedha.vercel.app';

            const response = await axios.post(`${API_URL}/admin/login`, {
            email,
            password,
});
            const { token, admin } = response.data;
            const adminUser = { _id: admin?.id, name: admin?.name, email: admin?.email || email, role: 'admin', status: 'active' };
            window.location.href = `${adminPortal}/callback?token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify(adminUser))}`;
            } catch (err) {
            const msg =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                'Login failed. Please check your credentials.';
            setError(msg);
        }
    };

    // ── Pharmacy login (direct API — separate from doctor auth) ───────────
    const handlePharmacyLogin = async () => {
        try {
            const API_URL = process.env.REACT_APP_API_URL || 'https://lakwedha.onrender.com/api/v1';
            const response = await axios.post(`${API_URL}/pharmacy/login`, { email, password });
            const { status, token, pharmacy, reason } = response.data;

            if (status === 'pending') {
                navigate('/pharmacy/pending');
                return;
            }
            if (status === 'rejected') {
                navigate('/pharmacy/rejected', { state: { reason } });
                return;
            }

            // Approved — store token and go directly to pharmacy dashboard
            if (token) {
                localStorage.setItem('pharmacy_token', token);
                localStorage.setItem('pharmacy_user', JSON.stringify(pharmacy || { email }));
                navigate('/pharmacy/dashboard');
            }
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                'Login failed. Please check your credentials.';
            setError(msg);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email.trim()) { setError('Email is required.'); return; }
        if (!password)     { setError('Password is required.'); return; }

        setLoading(true);
        try {
            if (accountType === 'doctor') {
                await handleDoctorLogin();
            } else if (accountType === 'pharmacy') {
                await handlePharmacyLogin();
            } else {
                await handleAdminLogin();
            }
        } finally {
            setLoading(false);
        }
    };

    const inputSx = {
        '& .MuiOutlinedInput-root': {
            bgcolor: '#FAFAFA',
            borderRadius: 2.5,
            '&:hover fieldset':     { borderColor: activeTab.color },
            '&.Mui-focused fieldset': { borderColor: activeTab.color },
        },
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            background: '#f8f9fa',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: 4,
            '&::before': {
                content: '""',
                position: 'absolute',
                top: '-200px',
                left: '-200px',
                width: '600px',
                height: '600px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(74,222,128,0.12) 0%, transparent 65%)',
                pointerEvents: 'none',
            },
            '&::after': {
                content: '""',
                position: 'absolute',
                bottom: '-200px',
                right: '-150px',
                width: '600px',
                height: '600px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(74,222,128,0.08) 0%, transparent 65%)',
                pointerEvents: 'none',
            },
        }}>
        <Container component="main" maxWidth="xs">
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Paper elevation={0} sx={{
                    p: { xs: 2.5, sm: 3.5 },
                    width: '100%',
                    borderRadius: 5,
                    background: '#fff',
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.05), 0 20px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.03)',
                    position: 'relative', zIndex: 1,
                }}>

                    {/* Header */}
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <Box sx={{
                            width: 68, height: 68,
                            borderRadius: 3,
                            background: accountType === 'doctor'
                                ? 'linear-gradient(135deg, #4ADE80 0%, #16a34a 100%)'
                                : accountType === 'pharmacy'
                                ? 'linear-gradient(135deg, #60A5FA 0%, #1d4ed8 100%)'
                                : 'linear-gradient(135deg, #FBBF24 0%, #b45309 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            mx: 'auto', mb: 2,
                            boxShadow: `0 8px 24px ${activeTab.color}50`,
                            transition: 'background 0.3s, box-shadow 0.3s',
                        }}>
                            {accountType === 'doctor' && <span style={{ fontSize: 32 }}>🩺</span>}
                            {accountType === 'pharmacy' && <span style={{ fontSize: 32 }}>💊</span>}
                            {accountType === 'admin' && <span style={{ fontSize: 32 }}>🛡️</span>}
                        </Box>
                        <Typography component="h1" variant="h5" fontWeight={800} sx={{ color: '#111827', letterSpacing: -0.5 }}>
                            Lakwedha
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#6B7280', letterSpacing: 3, textTransform: 'uppercase', fontWeight: 600, fontSize: 10 }}>
                            Ayurvedic Portal
                        </Typography>
                    </Box>

                    {/* Account type tabs */}
                    <Box sx={{
                        display: 'flex', borderRadius: 3,
                        bgcolor: '#F3F4F6', p: 0.5, mb: 3, gap: 0.5,
                    }}>
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = accountType === tab.value;
                            return (
                                <Box
                                    key={tab.value}
                                    onClick={() => handleTabChange(tab.value)}
                                    sx={{
                                        flex: 1, py: 1.1, display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', gap: 0.7,
                                        cursor: 'pointer', borderRadius: 2.5,
                                        bgcolor: isActive ? tab.color : 'transparent',
                                        boxShadow: isActive ? `0 2px 10px ${tab.color}50` : 'none',
                                        transition: 'all 0.2s ease',
                                        '&:hover': { bgcolor: isActive ? tab.color : 'rgba(0,0,0,0.04)' },
                                    }}
                                >
                                    <Icon sx={{
                                        fontSize: 15,
                                        color: isActive ? '#fff' : '#9CA3AF',
                                        transition: 'color 0.2s',
                                    }} />
                                    <Typography variant="body2" fontWeight={700} sx={{
                                        color: isActive ? '#fff' : '#6B7280',
                                        fontSize: 13,
                                        transition: 'color 0.2s',
                                    }}>
                                        {tab.label}
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Box>

                    {/* Error */}
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    {/* Form */}
                    <form onSubmit={handleSubmit} noValidate>
                        <Box sx={{ mt: 0 }}>
                            <Typography variant="body2" fontWeight={600} sx={{ mb: 0.8, color: '#374151', fontSize: 13 }}>Email Address <span style={{ color: activeTab.color }}>*</span></Typography>
                            <TextField
                                fullWidth size="small" type="email"
                                placeholder="Email Address"
                                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                autoFocus autoComplete="email"
                                sx={{
                                    mb: 2.5,
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: '#F9FAFB',
                                        borderRadius: 3,
                                        fontSize: 15,
                                        '& fieldset': { borderColor: '#E5E7EB' },
                                        '&:hover fieldset': { borderColor: activeTab.color },
                                        '&.Mui-focused fieldset': { borderColor: activeTab.color, borderWidth: 2 },
                                    },
                                    '& .MuiOutlinedInput-input::placeholder': { color: '#9CA3AF', opacity: 1 },
                                }}
                            />
                        </Box>
                        <Box>
                            <Typography variant="body2" fontWeight={600} sx={{ mb: 0.8, color: '#374151', fontSize: 13 }}>Password <span style={{ color: activeTab.color }}>*</span></Typography>
                            <TextField
                                fullWidth size="small"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Password"
                                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                autoComplete="current-password"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: '#F9FAFB',
                                        borderRadius: 3,
                                        fontSize: 15,
                                        '& fieldset': { borderColor: '#E5E7EB' },
                                        '&:hover fieldset': { borderColor: activeTab.color },
                                        '&.Mui-focused fieldset': { borderColor: activeTab.color, borderWidth: 2 },
                                    },
                                    '& .MuiOutlinedInput-input::placeholder': { color: '#9CA3AF', opacity: 1 },
                                }}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowPassword((v) => !v)} edge="end" size="small">
                                                {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Box>

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={loading}
                            sx={{
                                mt: 3, py: 1.5, fontWeight: 700,
                                bgcolor: activeTab.color,
                                color: '#fff',
                                borderRadius: 3,
                                textTransform: 'none',
                                fontSize: 15,
                                letterSpacing: 0.3,
                                boxShadow: `0 6px 24px ${activeTab.color}50`,
                                '&:hover': { bgcolor: activeTab.color, filter: 'brightness(0.9)', boxShadow: `0 8px 28px ${activeTab.color}70` },
                                transition: 'filter 0.2s, box-shadow 0.2s',
                            }}
                        >
                            {loading
                                ? <CircularProgress size={22} color="inherit" />
                                : `Sign In as ${activeTab.label}`}
                        </Button>
                    </form>

                    <Divider sx={{ my: 2.5 }} />

                    {accountType !== 'admin' && (
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" sx={{ color: '#6B7280' }}>
                                New here?{' '}
                                <Link to="/register" style={{ color: activeTab.color, textDecoration: 'none', fontWeight: 600 }}>
                                    Create an account
                                </Link>
                            </Typography>
                        </Box>
                    )}
                </Paper>
            </Box>
        </Container>
        </Box>
    );
};

export default LoginPage;
