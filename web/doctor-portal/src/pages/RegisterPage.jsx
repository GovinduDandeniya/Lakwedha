import React, { useState } from 'react';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    Alert,
    MenuItem,
    Grid,
    Divider,
    CircularProgress,
    IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const NIC_REGEX = /^([0-9]{9}[vVxX]|[0-9]{12})$/;
const MOBILE_REGEX = /^[0-9]{10}$/;
const TITLES = ['Dr', 'Mr', 'Ms', 'Mrs'];

const emptyHospital = () => ({ name: '', location: '', startTime: '', maxAppointments: '' });

const initialForm = {
    title: '',
    firstName: '',
    lastName: '',
    fullName: '',
    email: '',
    mobile: '',
    nic: '',
    address: '',
    emergencyMobile: '',
    password: '',
    confirmPassword: '',
};

const RegisterPage = () => {
    const [form, setForm] = useState(initialForm);
    const [hospitals, setHospitals] = useState([emptyHospital()]);
    const [errors, setErrors] = useState({});
    const [hospitalErrors, setHospitalErrors] = useState([{}]);
    const [serverError, setServerError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // ── Personal form handlers ────────────────────────────────────────────────
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => {
            const updated = { ...prev, [name]: value };
            if (['title', 'firstName', 'lastName'].includes(name)) {
                const t = name === 'title' ? value : updated.title;
                const f = name === 'firstName' ? value : updated.firstName;
                const l = name === 'lastName' ? value : updated.lastName;
                updated.fullName = [t, f, l].filter(Boolean).join(' ');
            }
            return updated;
        });
        setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    // ── Hospital handlers ────────────────────────────────────────────────────
    const handleHospitalChange = (index, e) => {
        const { name, value } = e.target;
        setHospitals((prev) => prev.map((h, i) => (i === index ? { ...h, [name]: value } : h)));
        setHospitalErrors((prev) =>
            prev.map((errs, i) => (i === index ? { ...errs, [name]: '' } : errs))
        );
    };

    const addHospital = () => {
        setHospitals((prev) => [...prev, emptyHospital()]);
        setHospitalErrors((prev) => [...prev, {}]);
    };

    const removeHospital = (index) => {
        setHospitals((prev) => prev.filter((_, i) => i !== index));
        setHospitalErrors((prev) => prev.filter((_, i) => i !== index));
    };

    // ── Validation ────────────────────────────────────────────────────────────
    const validate = () => {
        const errs = {};
        if (!form.title) errs.title = 'Title is required';
        if (!form.firstName.trim()) errs.firstName = 'First name is required';
        if (!form.lastName.trim()) errs.lastName = 'Last name is required';
        if (!form.email.trim()) errs.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email address';
        if (!form.mobile.trim()) errs.mobile = 'Mobile number is required';
        else if (!MOBILE_REGEX.test(form.mobile)) errs.mobile = 'Enter a valid 10-digit mobile number';
        if (!form.nic.trim()) errs.nic = 'NIC is required';
        else if (!NIC_REGEX.test(form.nic))
            errs.nic = 'Invalid NIC — old format (9 digits + V/X) or new format (12 digits)';
        if (!form.address.trim()) errs.address = 'Address is required';
        if (form.emergencyMobile && !MOBILE_REGEX.test(form.emergencyMobile))
            errs.emergencyMobile = 'Enter a valid 10-digit mobile number';
        if (!form.password) errs.password = 'Password is required';
        else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
        if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password';
        else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';

        const hErrs = hospitals.map((h) => {
            const e = {};
            if (!h.name.trim()) e.name = 'Hospital name is required';
            if (!h.location.trim()) e.location = 'Location is required';
            if (h.maxAppointments && isNaN(Number(h.maxAppointments)))
                e.maxAppointments = 'Must be a number';
            return e;
        });

        return { errs, hErrs };
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError('');
        const { errs, hErrs } = validate();
        const hasPersonalErrors = Object.keys(errs).length > 0;
        const hasHospitalErrors = hErrs.some((h) => Object.keys(h).length > 0);

        if (hasPersonalErrors || hasHospitalErrors) {
            setErrors(errs);
            setHospitalErrors(hErrs);
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/doctors/register`, {
                title: form.title,
                firstName: form.firstName,
                lastName: form.lastName,
                fullName: form.fullName,
                email: form.email,
                mobile: form.mobile,
                nic: form.nic,
                address: form.address,
                emergencyMobile: form.emergencyMobile,
                hospitals: hospitals.map((h) => ({
                    name: h.name,
                    location: h.location,
                    startTime: h.startTime || undefined,
                    maxAppointments: h.maxAppointments ? Number(h.maxAppointments) : undefined,
                })),
                password: form.password,
            });
            navigate('/pending', { state: { fromRegister: true } });
        } catch (err) {
            setServerError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const field = (name, label, props = {}) => (
        <TextField
            fullWidth
            label={label}
            name={name}
            value={form[name]}
            onChange={handleChange}
            error={!!errors[name]}
            helperText={errors[name]}
            size="small"
            {...props}
        />
    );

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#F0F6FF', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', py: 4 }}>
            <Container maxWidth="md">
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography variant="h4" fontWeight={700} color="primary.main">
                        Lakwedha Doctor Portal
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        Register as a Doctor
                    </Typography>
                </Box>

                <Paper elevation={3} sx={{ p: { xs: 3, md: 5 }, borderRadius: 3 }}>
                    {serverError && <Alert severity="error" sx={{ mb: 3 }}>{serverError}</Alert>}

                    <form onSubmit={handleSubmit} noValidate>

                        {/* ── Personal Info ─────────────────────────────── */}
                        <Typography variant="h6" color="primary" gutterBottom>Personal Information</Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={3}>
                                <TextField
                                    select fullWidth label="Title" name="title"
                                    value={form.title} onChange={handleChange}
                                    error={!!errors.title} helperText={errors.title} size="small"
                                >
                                    {TITLES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={4.5}>{field('firstName', 'First Name')}</Grid>
                            <Grid item xs={12} sm={4.5}>{field('lastName', 'Last Name')}</Grid>
                            <Grid item xs={12}>{field('fullName', 'Full Name', { placeholder: 'Auto-generated or enter manually' })}</Grid>
                            <Grid item xs={12} sm={6}>{field('email', 'Email Address', { type: 'email' })}</Grid>
                            <Grid item xs={12} sm={6}>{field('mobile', 'Mobile Number', { placeholder: '07XXXXXXXX' })}</Grid>
                            <Grid item xs={12} sm={6}>{field('nic', 'NIC Number', { placeholder: '9 digits + V/X  or  12 digits' })}</Grid>
                            <Grid item xs={12} sm={6}>{field('address', 'Address', { multiline: true, rows: 2 })}</Grid>
                        </Grid>

                        {/* ── Emergency Contact ─────────────────────────── */}
                        <Typography variant="h6" color="primary" sx={{ mt: 4 }} gutterBottom>Emergency Contact</Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                {field('emergencyMobile', 'Emergency Mobile Number', { placeholder: '07XXXXXXXX' })}
                            </Grid>
                        </Grid>

                        {/* ── Hospital Details ──────────────────────────── */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 4, mb: 0.5 }}>
                            <Typography variant="h6" color="primary">Hospital Details</Typography>
                            <Button
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={addHospital}
                                variant="outlined"
                                sx={{ borderRadius: 2 }}
                            >
                                Add Another Hospital
                            </Button>
                        </Box>
                        <Divider sx={{ mb: 2 }} />

                        {hospitals.map((hospital, index) => (
                            <Box
                                key={index}
                                sx={{
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 2,
                                    p: 2.5,
                                    mb: 2,
                                    position: 'relative',
                                    bgcolor: '#FAFCFF',
                                }}
                            >
                                {/* Card header */}
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <LocalHospitalIcon fontSize="small" color="primary" />
                                        <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                                            Hospital {index + 1}
                                        </Typography>
                                    </Box>
                                    {hospitals.length > 1 && (
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => removeHospital(index)}
                                            title="Remove hospital"
                                        >
                                            <DeleteOutlineIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                </Box>

                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth size="small" label="Hospital Name" name="name"
                                            value={hospital.name}
                                            onChange={(e) => handleHospitalChange(index, e)}
                                            error={!!hospitalErrors[index]?.name}
                                            helperText={hospitalErrors[index]?.name}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth size="small" label="Hospital Location" name="location"
                                            value={hospital.location}
                                            onChange={(e) => handleHospitalChange(index, e)}
                                            error={!!hospitalErrors[index]?.location}
                                            helperText={hospitalErrors[index]?.location}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>
                        ))}

                        {/* ── Password ──────────────────────────────────── */}
                        <Typography variant="h6" color="primary" sx={{ mt: 3 }} gutterBottom>Set Password</Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>{field('password', 'Password', { type: 'password' })}</Grid>
                            <Grid item xs={12} sm={6}>{field('confirmPassword', 'Confirm Password', { type: 'password' })}</Grid>
                        </Grid>

                        <Button
                            type="submit" fullWidth variant="contained" size="large"
                            disabled={loading}
                            sx={{ mt: 4, py: 1.5, borderRadius: 2, fontSize: '1rem' }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Submit Registration'}
                        </Button>

                        <Box sx={{ textAlign: 'center', mt: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                Already registered?{' '}
                                <Link to="/login" style={{ color: '#1565C0', textDecoration: 'none', fontWeight: 600 }}>
                                    Sign In
                                </Link>
                            </Typography>
                        </Box>
                    </form>
                </Paper>
            </Container>
        </Box>
    );
};

export default RegisterPage;
