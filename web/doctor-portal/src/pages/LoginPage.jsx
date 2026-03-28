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
        color: '#2E7D32',
        bg: '#E8F5E9',
        activeBg: '#2E7D32',
    },
    {
        value: 'pharmacy',
        label: 'Pharmacy',
        icon: LocalPharmacyIcon,
        color: '#1565C0',
        bg: '#E3F2FD',
        activeBg: '#1565C0',
    },
    {
        value: 'admin',
        label: 'Admin',
        icon: AdminPanelSettingsIcon,
        color: '#92400E',
        bg: '#FEF3C7',
        activeBg: '#B45309',
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
            setError(result.error || 'Login failed. Please check your credentials.');
        }
    };

    // ── Admin login ────────────────────────────────────────────────────────
    const handleAdminLogin = async () => {
        try {
            const apiRoot = (process.env.REACT_APP_API_URL || 'https://lakwedha.onrender.com/api/v1').replace(/\/api\/v1\/?$/, '');
            const adminPortal = process.env.REACT_APP_ADMIN_URL || 'http://localhost:3000';
            const response = await axios.post(`${apiRoot}/api/admin/login`, { email, password });
            const { token, admin } = response.data;
            const adminUser = { _id: admin?.id, name: admin?.name, email: admin?.email || email, role: 'admin', status: 'active' };
            window.location.href = `${adminPortal}/auth/callback?token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify(adminUser))}`;
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
            const response = await axios.post(`${process.env.REACT_APP_API_URL || 'https://lakwedha.onrender.com/api/v1'}/pharmacy/login`, { email, password });
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
            '&:hover fieldset':     { borderColor: activeTab.color },
            '&.Mui-focused fieldset': { borderColor: activeTab.color },
        },
    };

    return (
        <Container component="main" maxWidth="xs">
            <Box sx={{ mt: 8, mb: 6, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Paper elevation={3} sx={{ p: { xs: 3, sm: 4 }, width: '100%', borderRadius: 2 }}>

                    {/* Header */}
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <Box sx={{
                            width: 56, height: 56, borderRadius: '50%',
                            bgcolor: activeTab.bg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            mx: 'auto', mb: 1.5,
                            transition: 'background-color 0.3s',
                        }}>
                            {React.createElement(activeTab.icon, {
                                sx: { color: activeTab.color, fontSize: 28, transition: 'color 0.3s' },
                            })}
                        </Box>
                        <Typography component="h1" variant="h5" fontWeight={700}>
                            Sign In
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Lakwedha Portal
                        </Typography>
                    </Box>

                    {/* Account type tabs */}
                    <Box sx={{
                        display: 'flex', borderRadius: 2,
                        border: '1px solid #E0E0E0', overflow: 'hidden', mb: 3,
                    }}>
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = accountType === tab.value;
                            return (
                                <Box
                                    key={tab.value}
                                    onClick={() => handleTabChange(tab.value)}
                                    sx={{
                                        flex: 1, py: 1.2, display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', gap: 0.8,
                                        cursor: 'pointer',
                                        bgcolor: isActive ? tab.activeBg : 'transparent',
                                        transition: 'all 0.25s ease',
                                        '&:hover': { bgcolor: isActive ? tab.activeBg : tab.bg },
                                    }}
                                >
                                    <Icon sx={{
                                        fontSize: 18,
                                        color: isActive ? '#fff' : tab.color,
                                        transition: 'color 0.25s',
                                    }} />
                                    <Typography variant="body2" fontWeight={600} sx={{
                                        color: isActive ? '#fff' : tab.color,
                                        transition: 'color 0.25s',
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
                        <FormField label="Email Address" required>
                            <TextField
                                fullWidth size="small" type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                autoFocus autoComplete="email"
                                sx={inputSx}
                            />
                        </FormField>

                        <FormField label="Password" required>
                            <TextField
                                fullWidth size="small"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                autoComplete="current-password"
                                sx={inputSx}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPassword((v) => !v)}
                                                edge="end" size="small"
                                            >
                                                {showPassword
                                                    ? <VisibilityOffIcon fontSize="small" />
                                                    : <VisibilityIcon fontSize="small" />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </FormField>

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={loading}
                            sx={{
                                mt: 3, py: 1.3, fontWeight: 700,
                                bgcolor: activeTab.color,
                                '&:hover': { bgcolor: activeTab.color, filter: 'brightness(0.9)' },
                                transition: 'background-color 0.3s',
                            }}
                        >
                            {loading
                                ? <CircularProgress size={22} color="inherit" />
                                : `Sign In as ${activeTab.label}`}
                        </Button>
                    </form>

                    <Divider sx={{ my: 2.5 }} />

                    {accountType !== 'admin' && (
                        <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                            <Typography variant="body2" color="text.secondary">
                                New here?{' '}
                                <Link
                                    to="/register"
                                    style={{ color: activeTab.color, textDecoration: 'none', fontWeight: 600 }}
                                >
                                    Create an account
                                </Link>
                            </Typography>
                        </Box>
                    )}
                </Paper>
            </Box>
        </Container>
    );
};

export default LoginPage;
