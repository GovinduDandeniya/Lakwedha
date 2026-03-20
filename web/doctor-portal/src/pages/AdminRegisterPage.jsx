import React, { useState } from 'react';
import {
    Box, Container, Paper, Typography, TextField, Button,
    Alert, Divider, CircularProgress, InputAdornment, IconButton, LinearProgress,
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const ADMIN_API = 'http://localhost:5000/api/admin';
const NIC_REGEX = /^([0-9]{9}[vVxX]|[0-9]{12})$/;
const MOBILE_REGEX = /^\+94[0-9]{9}$/;

// ── Helpers ────────────────────────────────────────────────────────────────────
const Field = ({ label, required, error, helperText, children }) => (
    <Box sx={{ mb: 2 }}>
        <Typography variant="body2" fontWeight={600}
            sx={{ mb: 0.5, color: error ? 'error.main' : 'text.primary' }}>
            {label}{required && <span style={{ color: '#d32f2f' }}> *</span>}
        </Typography>
        {children}
        {helperText && (
            <Typography variant="caption"
                sx={{ mt: 0.4, display: 'block', color: error ? 'error.main' : 'text.secondary' }}>
                {helperText}
            </Typography>
        )}
    </Box>
);

const SectionTitle = ({ children }) => (
    <Typography variant="subtitle2" fontWeight={700} color="#92400E"
        sx={{ mt: 3, mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 }}>
        {children}
    </Typography>
);

const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: 'grey.300' };
    let score = 0;
    if (pwd.length >= 8)          score++;
    if (/[A-Z]/.test(pwd))        score++;
    if (/[0-9]/.test(pwd))        score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    const map = [
        { label: 'Too short',  color: '#ef5350' },
        { label: 'Weak',       color: '#ef5350' },
        { label: 'Fair',       color: '#FFA726' },
        { label: 'Good',       color: '#66BB6A' },
        { label: 'Strong',     color: '#2E7D32' },
    ];
    return { score, ...map[score] };
};

// ── Component ──────────────────────────────────────────────────────────────────
const AdminRegisterPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading]         = useState(false);
    const [success, setSuccess]         = useState(false);
    const [error, setError]             = useState('');
    const [showPassword, setShowPassword]   = useState(false);
    const [showConfirm, setShowConfirm]     = useState(false);

    const [form, setForm] = useState({
        fullName: '',
        email: '',
        mobile: '+94',
        nic: '',
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState({});

    const inputSx = (hasError) => ({
        '& .MuiOutlinedInput-root': {
            bgcolor: '#FAFAFA',
            '&:hover fieldset':       { borderColor: hasError ? '#d32f2f' : '#B45309' },
            '&.Mui-focused fieldset': { borderColor: hasError ? '#d32f2f' : '#B45309' },
        },
    });

    const set = (field) => (e) => {
        setForm((f) => ({ ...f, [field]: e.target.value }));
        setErrors((er) => ({ ...er, [field]: '' }));
        setError('');
    };

    // ── Validation ─────────────────────────────────────────────────────────────
    const validate = () => {
        const e = {};
        if (!form.fullName.trim())                       e.fullName = 'Full name is required.';
        if (!form.email.trim())                          e.email = 'Email is required.';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                                                         e.email = 'Enter a valid email address.';
        if (!MOBILE_REGEX.test(form.mobile))             e.mobile = 'Enter a valid Sri Lankan number (+94XXXXXXXXX).';
        if (!NIC_REGEX.test(form.nic))                   e.nic = 'Enter a valid NIC (9 digits + V/X or 12 digits).';
        if (form.password.length < 8)                    e.password = 'Password must be at least 8 characters.';
        if (form.password !== form.confirmPassword)      e.confirmPassword = 'Passwords do not match.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    // ── Submit ─────────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        setError('');
        try {
            await axios.post(`${ADMIN_API}/register`, {
                fullName: form.fullName.trim(),
                email:    form.email.trim().toLowerCase(),
                mobile:   form.mobile.trim(),
                nic:      form.nic.trim(),
                password: form.password,
            });
            setSuccess(true);
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                'Registration failed. Please try again.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const strength = getPasswordStrength(form.password);

    // ── Success screen ─────────────────────────────────────────────────────────
    if (success) {
        return (
            <Container component="main" maxWidth="xs">
                <Box sx={{ mt: 8, mb: 6, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: 2, textAlign: 'center' }}>
                        <Box sx={{
                            width: 64, height: 64, borderRadius: '50%',
                            bgcolor: '#FEF3C7', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2,
                        }}>
                            <CheckCircleOutlineIcon sx={{ color: '#B45309', fontSize: 36 }} />
                        </Box>
                        <Typography variant="h5" fontWeight={700} gutterBottom>
                            Registration Submitted
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Your admin account request has been received. An existing administrator
                            will review and activate your account.
                        </Typography>
                        <Button
                            fullWidth variant="contained" size="large"
                            onClick={() => navigate('/login')}
                            sx={{
                                py: 1.3, fontWeight: 700,
                                bgcolor: '#B45309',
                                '&:hover': { bgcolor: '#92400E' },
                            }}
                        >
                            Back to Sign In
                        </Button>
                    </Paper>
                </Box>
            </Container>
        );
    }

    // ── Registration form ──────────────────────────────────────────────────────
    return (
        <Container component="main" maxWidth="sm">
            <Box sx={{ mt: 6, mb: 6, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Paper elevation={3} sx={{ p: { xs: 3, sm: 4 }, width: '100%', borderRadius: 2 }}>

                    {/* Header */}
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <Box sx={{
                            width: 56, height: 56, borderRadius: '50%',
                            bgcolor: '#FEF3C7',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            mx: 'auto', mb: 1.5,
                        }}>
                            <AdminPanelSettingsIcon sx={{ color: '#B45309', fontSize: 28 }} />
                        </Box>
                        <Typography component="h1" variant="h5" fontWeight={700}>
                            Admin Registration
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Create your Lakwedha administrator account
                        </Typography>
                    </Box>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <form onSubmit={handleSubmit} noValidate>

                        <SectionTitle>Personal Details</SectionTitle>

                        <Field label="Full Name" required error={!!errors.fullName} helperText={errors.fullName}>
                            <TextField
                                fullWidth size="small"
                                placeholder="e.g. Kamal Perera"
                                value={form.fullName}
                                onChange={set('fullName')}
                                error={!!errors.fullName}
                                autoFocus
                                sx={inputSx(!!errors.fullName)}
                            />
                        </Field>

                        <Field label="Email Address" required error={!!errors.email} helperText={errors.email}>
                            <TextField
                                fullWidth size="small" type="email"
                                placeholder="admin@lakwedha.lk"
                                value={form.email}
                                onChange={set('email')}
                                error={!!errors.email}
                                autoComplete="email"
                                sx={inputSx(!!errors.email)}
                            />
                        </Field>

                        <Field
                            label="Mobile Number" required
                            error={!!errors.mobile}
                            helperText={errors.mobile || 'Sri Lankan number — format: +94XXXXXXXXX'}
                        >
                            <TextField
                                fullWidth size="small"
                                placeholder="+94771234567"
                                value={form.mobile}
                                onChange={set('mobile')}
                                error={!!errors.mobile}
                                inputProps={{ maxLength: 12 }}
                                sx={inputSx(!!errors.mobile)}
                            />
                        </Field>

                        <Field
                            label="NIC Number" required
                            error={!!errors.nic}
                            helperText={errors.nic || 'Old format: 123456789V — New format: 123456789012'}
                        >
                            <TextField
                                fullWidth size="small"
                                placeholder="e.g. 199012345678"
                                value={form.nic}
                                onChange={set('nic')}
                                error={!!errors.nic}
                                inputProps={{ maxLength: 12 }}
                                sx={inputSx(!!errors.nic)}
                            />
                        </Field>

                        <SectionTitle>Security</SectionTitle>

                        <Field label="Password" required error={!!errors.password} helperText={errors.password}>
                            <TextField
                                fullWidth size="small"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Minimum 8 characters"
                                value={form.password}
                                onChange={set('password')}
                                error={!!errors.password}
                                autoComplete="new-password"
                                sx={inputSx(!!errors.password)}
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
                            {/* Password strength bar */}
                            {form.password && (
                                <Box sx={{ mt: 1 }}>
                                    <LinearProgress
                                        variant="determinate"
                                        value={(strength.score / 4) * 100}
                                        sx={{
                                            height: 4, borderRadius: 2,
                                            bgcolor: '#E0E0E0',
                                            '& .MuiLinearProgress-bar': { bgcolor: strength.color, borderRadius: 2 },
                                        }}
                                    />
                                    <Typography variant="caption" sx={{ color: strength.color, fontWeight: 600 }}>
                                        {strength.label}
                                    </Typography>
                                </Box>
                            )}
                        </Field>

                        <Field label="Confirm Password" required error={!!errors.confirmPassword} helperText={errors.confirmPassword}>
                            <TextField
                                fullWidth size="small"
                                type={showConfirm ? 'text' : 'password'}
                                placeholder="Re-enter your password"
                                value={form.confirmPassword}
                                onChange={set('confirmPassword')}
                                error={!!errors.confirmPassword}
                                autoComplete="new-password"
                                sx={inputSx(!!errors.confirmPassword)}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowConfirm((v) => !v)} edge="end" size="small">
                                                {showConfirm ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Field>

                        <Button
                            type="submit" fullWidth variant="contained" size="large"
                            disabled={loading}
                            sx={{
                                mt: 1, py: 1.3, fontWeight: 700,
                                bgcolor: '#B45309',
                                '&:hover': { bgcolor: '#92400E' },
                            }}
                        >
                            {loading ? <CircularProgress size={22} color="inherit" /> : 'Register as Admin'}
                        </Button>
                    </form>

                    <Divider sx={{ my: 2.5 }} />

                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            Already have an account?{' '}
                            <Link to="/login" style={{ color: '#B45309', textDecoration: 'none', fontWeight: 600 }}>
                                Sign in
                            </Link>
                        </Typography>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default AdminRegisterPage;
