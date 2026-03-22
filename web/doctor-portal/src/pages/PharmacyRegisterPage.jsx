import React, { useState, useMemo } from 'react';
import {
    Box, Container, Paper, Typography, TextField, Button,
    Alert, Divider, MenuItem, CircularProgress, InputAdornment, IconButton,
} from '@mui/material';
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import SRI_LANKA_LOCATIONS from '../utils/sriLankaLocations';

const API_ROOT =
    process.env.REACT_APP_API_ROOT ||
    (process.env.REACT_APP_API_URL
        ? process.env.REACT_APP_API_URL.replace(/\/api\/v1\/?$/, '')
        : 'http://localhost:5000');
const PHARMACY_API = `${API_ROOT}/api/v1/pharmacy`;

const ACCOUNT_TYPES = ['Savings', 'Current'];

const Field = ({ label, required, error, helperText, children }) => (
    <Box sx={{ mb: 2 }}>
        <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5, color: error ? 'error.main' : 'text.primary' }}>
            {label}{required && <span style={{ color: '#d32f2f' }}> *</span>}
        </Typography>
        {children}
        {helperText && (
            <Typography variant="caption" sx={{ mt: 0.4, display: 'block', color: error ? 'error.main' : 'text.secondary' }}>
                {helperText}
            </Typography>
        )}
    </Box>
);

const SectionTitle = ({ children }) => (
    <Typography variant="subtitle2" fontWeight={700} color="#1565C0"
        sx={{ mt: 3, mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 }}>
        {children}
    </Typography>
);

const PharmacyRegisterPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [form, setForm] = useState({
        pharmacyName: '', businessRegNumber: '', permitNumber: '',
        province: '', district: '', city: '', address: '', postalCode: '',
        ownerName: '', ownerNIC: '', email: '', password: '', confirmPassword: '',
        bankName: '', branchName: '', accountNumber: '', accountHolderName: '', accountType: '',
    });

    const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

    const handleProvinceChange = (e) => {
        setForm((f) => ({ ...f, province: e.target.value, district: '', city: '' }));
    };

    const handleDistrictChange = (e) => {
        setForm((f) => ({ ...f, district: e.target.value, city: '' }));
    };

    const provinces = useMemo(() => SRI_LANKA_LOCATIONS.map((p) => p.province), []);

    const districts = useMemo(() => {
        const found = SRI_LANKA_LOCATIONS.find((p) => p.province === form.province);
        return found ? found.districts.map((d) => d.name) : [];
    }, [form.province]);

    const cities = useMemo(() => {
        const foundProvince = SRI_LANKA_LOCATIONS.find((p) => p.province === form.province);
        if (!foundProvince) return [];
        const foundDistrict = foundProvince.districts.find((d) => d.name === form.district);
        return foundDistrict ? foundDistrict.cities : [];
    }, [form.province, form.district]);

    const inputSx = {
        '& .MuiOutlinedInput-root': {
            bgcolor: '#FAFAFA',
            '&:hover fieldset': { borderColor: '#1565C0' },
            '&.Mui-focused fieldset': { borderColor: '#1565C0' },
        },
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const required = ['pharmacyName', 'businessRegNumber', 'permitNumber', 'province',
            'district', 'city', 'address', 'postalCode', 'ownerName', 'ownerNIC', 'email', 'password'];
        for (const key of required) {
            if (!form[key].trim()) {
                setError(`Please fill in all required fields.`);
                return;
            }
        }
        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (form.password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        const bankDetails = form.bankName || form.accountNumber
            ? {
                bankName: form.bankName || null,
                branchName: form.branchName || null,
                accountNumber: form.accountNumber || null,
                accountHolderName: form.accountHolderName || null,
                accountType: form.accountType || null,
            }
            : null;

        setLoading(true);
        try {
            await axios.post(`${PHARMACY_API}/register`, {
                pharmacyName: form.pharmacyName,
                businessRegNumber: form.businessRegNumber,
                permitNumber: form.permitNumber,
                province: form.province,
                district: form.district,
                city: form.city,
                address: form.address,
                postalCode: form.postalCode,
                ownerName: form.ownerName,
                ownerNIC: form.ownerNIC,
                email: form.email,
                password: form.password,
                bankDetails,
            });
            navigate('/pharmacy/pending');
        } catch (err) {
            const serverMessage = err?.response?.data?.message || err?.response?.data?.error;
            if (serverMessage) {
                setError(serverMessage);
            } else if (err?.code === 'ERR_NETWORK') {
                setError('Cannot connect to server. Please check backend is running and API URL configuration.');
            } else {
                setError('Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="md">
            <Box sx={{ mt: 6, mb: 6 }}>
                <Paper elevation={3} sx={{ p: { xs: 3, md: 5 }, borderRadius: 3 }}>
                    {/* Header */}
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <Box sx={{
                            width: 60, height: 60, borderRadius: '50%', bgcolor: '#E3F2FD',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5,
                        }}>
                            <LocalPharmacyIcon sx={{ color: '#1565C0', fontSize: 30 }} />
                        </Box>
                        <Typography variant="h5" fontWeight={700}>Pharmacy Registration</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Register your pharmacy on the Lakwedha platform
                        </Typography>
                    </Box>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <form onSubmit={handleSubmit} noValidate>
                        {/* Pharmacy Info */}
                        <SectionTitle>Pharmacy Information</SectionTitle>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                            <Field label="Pharmacy Name" required>
                                <TextField fullWidth size="small" placeholder="e.g. Lakwedha Pharmacy"
                                    value={form.pharmacyName} onChange={set('pharmacyName')} sx={inputSx} />
                            </Field>
                            <Field label="Business Registration Number" required>
                                <TextField fullWidth size="small" placeholder="e.g. BRN-123456"
                                    value={form.businessRegNumber} onChange={set('businessRegNumber')} sx={inputSx} />
                            </Field>
                            <Field label="Pharmacy Permit Number" required>
                                <TextField fullWidth size="small" placeholder="e.g. PPN-2024-001"
                                    value={form.permitNumber} onChange={set('permitNumber')} sx={inputSx} />
                            </Field>
                        </Box>

                        {/* Location */}
                        <SectionTitle>Location</SectionTitle>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                            <Field label="Province" required>
                                <TextField fullWidth size="small" select value={form.province} onChange={handleProvinceChange} sx={inputSx}>
                                    <MenuItem value=""><em>Select Province</em></MenuItem>
                                    {provinces.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                                </TextField>
                            </Field>
                            <Field label="District" required>
                                <TextField fullWidth size="small" select value={form.district} onChange={handleDistrictChange}
                                    disabled={!form.province} sx={inputSx}>
                                    <MenuItem value=""><em>{form.province ? 'Select District' : 'Select Province first'}</em></MenuItem>
                                    {districts.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                                </TextField>
                            </Field>
                            <Field label="City" required>
                                <TextField fullWidth size="small" select value={form.city} onChange={set('city')}
                                    disabled={!form.district} sx={inputSx}>
                                    <MenuItem value=""><em>{form.district ? 'Select City' : 'Select District first'}</em></MenuItem>
                                    {cities.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                                </TextField>
                            </Field>
                            <Field label="Postal Code" required>
                                <TextField fullWidth size="small" placeholder="e.g. 10250"
                                    value={form.postalCode} onChange={set('postalCode')} sx={inputSx} />
                            </Field>
                            <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                                <Field label="Address" required>
                                    <TextField fullWidth size="small" placeholder="Street address, No., Lane..."
                                        value={form.address} onChange={set('address')} sx={inputSx} />
                                </Field>
                            </Box>
                        </Box>

                        {/* Owner Info */}
                        <SectionTitle>Owner Information</SectionTitle>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                            <Field label="Owner Full Name" required>
                                <TextField fullWidth size="small" placeholder="Full legal name"
                                    value={form.ownerName} onChange={set('ownerName')} sx={inputSx} />
                            </Field>
                            <Field label="Owner NIC" required>
                                <TextField fullWidth size="small" placeholder="e.g. 199012345678"
                                    value={form.ownerNIC} onChange={set('ownerNIC')} sx={inputSx} />
                            </Field>
                        </Box>

                        {/* Account */}
                        <SectionTitle>Account Credentials</SectionTitle>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                            <Field label="Email Address" required>
                                <TextField fullWidth size="small" type="email" placeholder="pharmacy@email.com"
                                    value={form.email} onChange={set('email')} sx={inputSx} />
                            </Field>
                            <Box />
                            <Field label="Password" required>
                                <TextField fullWidth size="small"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Min. 6 characters"
                                    value={form.password} onChange={set('password')} sx={inputSx}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton size="small" onClick={() => setShowPassword((v) => !v)}>
                                                    {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Field>
                            <Field label="Confirm Password" required>
                                <TextField fullWidth size="small"
                                    type={showConfirm ? 'text' : 'password'}
                                    placeholder="Re-enter password"
                                    value={form.confirmPassword} onChange={set('confirmPassword')} sx={inputSx}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton size="small" onClick={() => setShowConfirm((v) => !v)}>
                                                    {showConfirm ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Field>
                        </Box>

                        {/* Bank Details */}
                        <SectionTitle>Bank Details (Optional)</SectionTitle>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                            <Field label="Bank Name">
                                <TextField fullWidth size="small" placeholder="e.g. Bank of Ceylon"
                                    value={form.bankName} onChange={set('bankName')} sx={inputSx} />
                            </Field>
                            <Field label="Branch Name">
                                <TextField fullWidth size="small" placeholder="e.g. Colombo 03"
                                    value={form.branchName} onChange={set('branchName')} sx={inputSx} />
                            </Field>
                            <Field label="Account Number">
                                <TextField fullWidth size="small" placeholder="Account number"
                                    value={form.accountNumber} onChange={set('accountNumber')} sx={inputSx} />
                            </Field>
                            <Field label="Account Holder Name">
                                <TextField fullWidth size="small" placeholder="Name on account"
                                    value={form.accountHolderName} onChange={set('accountHolderName')} sx={inputSx} />
                            </Field>
                            <Field label="Account Type">
                                <TextField fullWidth size="small" select value={form.accountType} onChange={set('accountType')} sx={inputSx}>
                                    <MenuItem value=""><em>Select Type</em></MenuItem>
                                    {ACCOUNT_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                                </TextField>
                            </Field>
                        </Box>

                        <Button type="submit" fullWidth variant="contained" size="large" disabled={loading}
                            sx={{ mt: 3, py: 1.4, fontWeight: 700, bgcolor: '#1565C0', '&:hover': { bgcolor: '#0D47A1' } }}>
                            {loading ? <CircularProgress size={22} color="inherit" /> : 'Submit Registration'}
                        </Button>
                    </form>

                    <Divider sx={{ my: 2.5 }} />
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            Already registered?{' '}
                            <Link to="/login" style={{ color: '#1565C0', textDecoration: 'none', fontWeight: 600 }}>
                                Sign in
                            </Link>
                        </Typography>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default PharmacyRegisterPage;
