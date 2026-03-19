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
    Divider,
    CircularProgress,
    Stepper,
    Step,
    StepLabel,
    InputAdornment,
    IconButton,
} from '@mui/material';
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

// ─── Sri Lanka location data ──────────────────────────────────────────────────
const LOCATION_DATA = {
    Western:         ['Colombo', 'Gampaha', 'Kalutara'],
    Central:         ['Kandy', 'Matale', 'Nuwara Eliya'],
    Southern:        ['Galle', 'Matara', 'Hambantota'],
    Northern:        ['Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu'],
    Eastern:         ['Batticaloa', 'Ampara', 'Trincomalee'],
    'North Western': ['Kurunegala', 'Puttalam'],
    'North Central': ['Anuradhapura', 'Polonnaruwa'],
    Uva:             ['Badulla', 'Monaragala'],
    Sabaragamuwa:    ['Ratnapura', 'Kegalle'],
};

const PROVINCES = Object.keys(LOCATION_DATA);

// ─── Validation ───────────────────────────────────────────────────────────────
const NIC_REGEX   = /^([0-9]{9}[vVxX]|[0-9]{12})$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const POSTAL_REGEX = /^[0-9]{5}$/;

const STEPS = ['Pharmacy Details', 'Location', 'Owner & Account', 'Bank Details'];

const SL_BANKS = [
    'Bank of Ceylon',
    "People's Bank",
    'Commercial Bank of Ceylon',
    'Hatton National Bank (HNB)',
    'Sampath Bank',
    'Nations Trust Bank (NTB)',
    'National Development Bank (NDB)',
    'Pan Asia Banking Corporation',
    'DFCC Bank',
    'Seylan Bank',
    'Union Bank',
    'Amana Bank',
    'MCB Bank',
    'Standard Chartered',
    'HSBC',
];

const ACCOUNT_TYPES = ['Savings', 'Current'];

const INIT = {
    pharmacyName: '',
    businessRegNumber: '',
    permitNumber: '',
    province: '',
    district: '',
    city: '',
    address: '',
    postalCode: '',
    ownerName: '',
    ownerNIC: '',
    email: '',
    password: '',
    confirmPassword: '',
    bankName: '',
    branchName: '',
    accountNumber: '',
    accountHolderName: '',
    accountType: '',
};

// ─── Static label + field wrapper ────────────────────────────────────────────
// Label is a plain <Typography> ABOVE the input — it never floats or animates.
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

const PharmacyRegisterPage = () => {
    const navigate = useNavigate();

    const [activeStep, setActiveStep]     = useState(0);
    const [form, setForm]                 = useState(INIT);
    const [errors, setErrors]             = useState({});
    const [apiError, setApiError]         = useState('');
    const [loading, setLoading]           = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm]   = useState(false);

    // ── Helpers ──────────────────────────────────────────────────────────────
    const set = (field) => (e) => {
        const val = e.target.value;
        setForm((prev) => {
            const next = { ...prev, [field]: val };
            if (field === 'province') next.district = '';
            return next;
        });
        setErrors((prev) => ({ ...prev, [field]: '' }));
    };

    const districts = form.province ? LOCATION_DATA[form.province] || [] : [];

    const inputSx = (field) => ({
        '& .MuiOutlinedInput-root': {
            bgcolor: '#FAFAFA',
            '&:hover fieldset': { borderColor: '#1565C0' },
            '&.Mui-focused fieldset': { borderColor: '#1565C0' },
            '&.Mui-error fieldset': { borderColor: '#d32f2f' },
        },
    });

    // ── Validation per step ──────────────────────────────────────────────────
    const validateStep = (step) => {
        const errs = {};
        if (step === 0) {
            if (!form.pharmacyName.trim())     errs.pharmacyName      = 'Pharmacy name is required';
            if (!form.businessRegNumber.trim()) errs.businessRegNumber = 'Business registration number is required';
            if (!form.permitNumber.trim())      errs.permitNumber      = 'Permit number is required';
        }
        if (step === 1) {
            if (!form.province)                 errs.province  = 'Province is required';
            if (!form.district)                 errs.district  = 'District is required';
            if (!form.city.trim())              errs.city      = 'City is required';
            if (!form.address.trim())           errs.address   = 'Address is required';
            if (!POSTAL_REGEX.test(form.postalCode)) errs.postalCode = 'Enter a valid 5-digit postal code';
        }
        if (step === 2) {
            if (!form.ownerName.trim())         errs.ownerName = 'Owner name is required';
            if (!NIC_REGEX.test(form.ownerNIC)) errs.ownerNIC  = 'Enter a valid NIC (9+V or 12 digits)';
            if (!EMAIL_REGEX.test(form.email))  errs.email     = 'Enter a valid email address';
            if (form.password.length < 8)       errs.password  = 'Password must be at least 8 characters';
            if (form.password !== form.confirmPassword)
                                                 errs.confirmPassword = 'Passwords do not match';
        }
        if (step === 3) {
            if (!form.bankName)                  errs.bankName          = 'Bank name is required';
            if (!form.branchName.trim())         errs.branchName        = 'Branch name is required';
            if (!form.accountNumber.trim())      errs.accountNumber     = 'Account number is required';
            else if (!/^[0-9]{6,20}$/.test(form.accountNumber))
                                                  errs.accountNumber    = 'Enter a valid account number (6–20 digits)';
            if (!form.accountHolderName.trim())  errs.accountHolderName = 'Account holder name is required';
            if (!form.accountType)               errs.accountType       = 'Account type is required';
        }
        return errs;
    };

    // ── Navigation ───────────────────────────────────────────────────────────
    const handleNext = () => {
        const errs = validateStep(activeStep);
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setActiveStep((s) => s + 1);
    };

    const handleBack = () => { setActiveStep((s) => s - 1); setApiError(''); };

    // ── Submit ───────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validateStep(3);
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setLoading(true);
        setApiError('');
        try {
            const payload = { ...form };
            delete payload.confirmPassword;
            payload.bankDetails = {
                bankName: form.bankName,
                branchName: form.branchName,
                accountNumber: form.accountNumber,
                accountHolderName: form.accountHolderName,
                accountType: form.accountType,
            };
            await axios.post(`${API_BASE_URL}/pharmacy/register`, payload);
            navigate('/pharmacy/pending');
        } catch (err) {
            setApiError(
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                'Registration failed. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    // ── Step content ─────────────────────────────────────────────────────────
    const renderStep = () => {
        if (activeStep === 0) return (
            <>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1, color: '#1565C0' }}>
                    Pharmacy Information
                </Typography>

                <FormField label="Pharmacy Name" required error={!!errors.pharmacyName} helperText={errors.pharmacyName}>
                    <TextField fullWidth size="small" placeholder="e.g. City Pharmacy"
                        value={form.pharmacyName} onChange={set('pharmacyName')}
                        error={!!errors.pharmacyName} autoFocus sx={inputSx('pharmacyName')} />
                </FormField>

                <FormField label="Business Registration Number" required error={!!errors.businessRegNumber} helperText={errors.businessRegNumber}>
                    <TextField fullWidth size="small" placeholder="e.g. BR/12345/2024"
                        value={form.businessRegNumber} onChange={set('businessRegNumber')}
                        error={!!errors.businessRegNumber} sx={inputSx('businessRegNumber')} />
                </FormField>

                <FormField label="Permit Number" required error={!!errors.permitNumber} helperText={errors.permitNumber}>
                    <TextField fullWidth size="small" placeholder="e.g. PH/2024/001"
                        value={form.permitNumber} onChange={set('permitNumber')}
                        error={!!errors.permitNumber} sx={inputSx('permitNumber')} />
                </FormField>
            </>
        );

        if (activeStep === 1) return (
            <>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1, color: '#1565C0' }}>
                    Location Details
                </Typography>

                <FormField label="Province" required error={!!errors.province} helperText={errors.province}>
                    <TextField select fullWidth size="small"
                        value={form.province} onChange={set('province')}
                        error={!!errors.province} sx={inputSx('province')}
                        SelectProps={{ displayEmpty: true }}
                        inputProps={{ 'aria-label': 'Province' }}>
                        <MenuItem value="" disabled><em style={{ color: '#9E9E9E' }}>Select province</em></MenuItem>
                        {PROVINCES.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                    </TextField>
                </FormField>

                <FormField label="District" required error={!!errors.district} helperText={errors.district}>
                    <TextField select fullWidth size="small"
                        value={form.district} onChange={set('district')}
                        error={!!errors.district} disabled={!form.province} sx={inputSx('district')}
                        SelectProps={{ displayEmpty: true }}
                        inputProps={{ 'aria-label': 'District' }}>
                        <MenuItem value="" disabled><em style={{ color: '#9E9E9E' }}>Select district</em></MenuItem>
                        {districts.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                    </TextField>
                </FormField>

                <FormField label="City" required error={!!errors.city} helperText={errors.city}>
                    <TextField fullWidth size="small" placeholder="e.g. Colombo 07"
                        value={form.city} onChange={set('city')}
                        error={!!errors.city} sx={inputSx('city')} />
                </FormField>

                <FormField label="Street Address" required error={!!errors.address} helperText={errors.address}>
                    <TextField fullWidth size="small" multiline rows={2}
                        placeholder="e.g. No. 45, Main Street"
                        value={form.address} onChange={set('address')}
                        error={!!errors.address} sx={inputSx('address')} />
                </FormField>

                <FormField label="Postal Code" required error={!!errors.postalCode} helperText={errors.postalCode}>
                    <TextField fullWidth size="small" placeholder="e.g. 10350"
                        value={form.postalCode} onChange={set('postalCode')}
                        error={!!errors.postalCode} inputProps={{ maxLength: 5 }} sx={inputSx('postalCode')} />
                </FormField>
            </>
        );

        return (
            <>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1, color: '#1565C0' }}>
                    Owner Details
                </Typography>

                <FormField label="Owner Full Name" required error={!!errors.ownerName} helperText={errors.ownerName}>
                    <TextField fullWidth size="small" placeholder="e.g. Kamal Perera"
                        value={form.ownerName} onChange={set('ownerName')}
                        error={!!errors.ownerName} autoFocus sx={inputSx('ownerName')} />
                </FormField>

                <FormField label="Owner NIC Number" required error={!!errors.ownerNIC}
                    helperText={errors.ownerNIC || 'Format: 9 digits + V/X  or  12 digits'}>
                    <TextField fullWidth size="small" placeholder="e.g. 901234567V or 199012345678"
                        value={form.ownerNIC} onChange={set('ownerNIC')}
                        error={!!errors.ownerNIC} inputProps={{ maxLength: 12 }} sx={inputSx('ownerNIC')} />
                </FormField>

                <Divider sx={{ my: 2.5 }} />
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1, color: '#1565C0' }}>
                    Account Credentials
                </Typography>

                <FormField label="Email Address" required error={!!errors.email} helperText={errors.email}>
                    <TextField fullWidth size="small" type="email" placeholder="e.g. pharmacy@email.com"
                        value={form.email} onChange={set('email')}
                        error={!!errors.email} sx={inputSx('email')} />
                </FormField>

                <FormField label="Password" required error={!!errors.password}
                    helperText={errors.password || 'Minimum 8 characters'}>
                    <TextField fullWidth size="small"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter password"
                        value={form.password} onChange={set('password')}
                        error={!!errors.password} sx={inputSx('password')}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setShowPassword((v) => !v)} edge="end" size="small">
                                        {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }} />
                </FormField>

                <FormField label="Confirm Password" required error={!!errors.confirmPassword} helperText={errors.confirmPassword}>
                    <TextField fullWidth size="small"
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="Re-enter password"
                        value={form.confirmPassword} onChange={set('confirmPassword')}
                        error={!!errors.confirmPassword} sx={inputSx('confirmPassword')}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setShowConfirm((v) => !v)} edge="end" size="small">
                                        {showConfirm ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }} />
                </FormField>
            </>
        );

        // Step 3 — Bank Details (unreachable fall-through handled by default above)
    };

    const renderBankStep = () => (
        <>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1, color: '#1565C0' }}>
                Bank Details
            </Typography>

            <FormField label="Bank Name" required error={!!errors.bankName} helperText={errors.bankName}>
                <TextField select fullWidth size="small"
                    value={form.bankName} onChange={set('bankName')}
                    error={!!errors.bankName} sx={inputSx('bankName')}
                    SelectProps={{ displayEmpty: true }}
                    inputProps={{ 'aria-label': 'Bank Name' }}>
                    <MenuItem value="" disabled><em style={{ color: '#9E9E9E' }}>Select your bank</em></MenuItem>
                    {SL_BANKS.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                </TextField>
            </FormField>

            <FormField label="Branch Name" required error={!!errors.branchName} helperText={errors.branchName}>
                <TextField fullWidth size="small" placeholder="e.g. Colombo 07"
                    value={form.branchName} onChange={set('branchName')}
                    error={!!errors.branchName} sx={inputSx('branchName')} />
            </FormField>

            <FormField label="Account Number" required error={!!errors.accountNumber} helperText={errors.accountNumber}>
                <TextField fullWidth size="small" placeholder="e.g. 1234567890"
                    value={form.accountNumber} onChange={set('accountNumber')}
                    error={!!errors.accountNumber} inputProps={{ maxLength: 20 }} sx={inputSx('accountNumber')} />
            </FormField>

            <FormField label="Account Holder Name" required error={!!errors.accountHolderName}
                helperText={errors.accountHolderName || 'As shown on your bank passbook'}>
                <TextField fullWidth size="small" placeholder="e.g. KAMAL PERERA"
                    value={form.accountHolderName} onChange={set('accountHolderName')}
                    error={!!errors.accountHolderName} sx={inputSx('accountHolderName')} />
            </FormField>

            <FormField label="Account Type" required error={!!errors.accountType} helperText={errors.accountType}>
                <TextField select fullWidth size="small"
                    value={form.accountType} onChange={set('accountType')}
                    error={!!errors.accountType} sx={inputSx('accountType')}
                    SelectProps={{ displayEmpty: true }}
                    inputProps={{ 'aria-label': 'Account Type' }}>
                    <MenuItem value="" disabled><em style={{ color: '#9E9E9E' }}>Select account type</em></MenuItem>
                    {ACCOUNT_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
            </FormField>
        </>
    );

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <Container component="main" maxWidth="sm">
            <Box sx={{ mt: 6, mb: 6 }}>
                <Paper elevation={3} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 2 }}>

                    {/* Header */}
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <Box sx={{
                            width: 56, height: 56, borderRadius: '50%', bgcolor: '#E3F2FD',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            mx: 'auto', mb: 1.5,
                        }}>
                            <LocalPharmacyIcon sx={{ color: '#1565C0', fontSize: 28 }} />
                        </Box>
                        <Typography component="h1" variant="h5" fontWeight={700}>
                            Pharmacy Registration
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Complete the form to register your pharmacy
                        </Typography>
                    </Box>

                    {/* Stepper */}
                    <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
                        {STEPS.map((label) => (
                            <Step key={label}><StepLabel>{label}</StepLabel></Step>
                        ))}
                    </Stepper>

                    {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}

                    <form onSubmit={handleSubmit}>
                        {activeStep === 3 ? renderBankStep() : renderStep()}

                        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                            {activeStep > 0 && (
                                <Button variant="outlined" onClick={handleBack} disabled={loading} sx={{ flex: 1 }}>
                                    Back
                                </Button>
                            )}
                            {activeStep < STEPS.length - 1 ? (
                                <Button variant="contained" onClick={handleNext} sx={{ flex: 1, bgcolor: '#1565C0' }}>
                                    Next
                                </Button>
                            ) : (
                                <Button type="submit" variant="contained" disabled={loading}
                                    sx={{ flex: 1, bgcolor: '#1565C0', py: 1.4 }}>
                                    {loading ? <CircularProgress size={22} color="inherit" /> : 'Submit Registration'}
                                </Button>
                            )}
                        </Box>
                    </form>

                    <Divider sx={{ my: 2.5 }} />

                    <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                            Already registered?{' '}
                            <Link to="/login" style={{ color: '#1565C0', textDecoration: 'none', fontWeight: 600 }}>
                                Sign in
                            </Link>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            <Link to="/register" style={{ color: '#757575', textDecoration: 'none' }}>
                                ← Back to account selection
                            </Link>
                        </Typography>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default PharmacyRegisterPage;
