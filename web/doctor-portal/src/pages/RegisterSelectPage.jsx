import React, { useState } from 'react';
import {
    Box,
    Container,
    Paper,
    Typography,
    Button,
    Alert,
    Divider,
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';

const ACCOUNT_TYPES = [
    {
        value: 'doctor',
        label: 'Doctor',
        icon: LocalHospitalIcon,
        description: 'Provide medical consultations',
        route: '/doctor/register',
        color: '#2E7D32',
        bg: '#E8F5E9',
        border: '#A5D6A7',
    },
];

const RegisterSelectPage = () => {
    const [selected, setSelected] = useState(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleContinue = () => {
        if (!selected) {
            setError('Please select an account type to continue.');
            return;
        }

        const choice = ACCOUNT_TYPES.find((t) => t.value === selected);
        if (!choice?.route) {
            setError('Invalid selection. Please try again.');
            return;
        }

        setError('');
        navigate(choice.route);
    };

    const handleSelect = (value) => {
        setSelected(value);
        setError('');
    };

    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: 2 }}>
                    {/* Header */}
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <Box
                            sx={{
                                width: 56,
                                height: 56,
                                borderRadius: '50%',
                                bgcolor: '#E8F5E9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mx: 'auto',
                                mb: 1.5,
                            }}
                        >
                            <LocalHospitalIcon sx={{ color: '#2E7D32', fontSize: 28 }} />
                        </Box>
                        <Typography component="h1" variant="h5" fontWeight={700}>
                            Create Your Account
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Select your account type to get started
                        </Typography>
                    </Box>

                    {/* Error */}
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {/* Selection label */}
                    <Typography
                        variant="body2"
                        fontWeight={600}
                        color="text.secondary"
                        sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 }}
                    >
                        Select Account Type
                    </Typography>

                    {/* Option cards */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
                        {ACCOUNT_TYPES.map((type) => {
                            const Icon = type.icon;
                            const isSelected = selected === type.value;

                            return (
                                <Box
                                    key={type.value}
                                    onClick={() => handleSelect(type.value)}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                        p: 2,
                                        borderRadius: 2,
                                        border: `2px solid`,
                                        borderColor: isSelected ? type.color : '#E0E0E0',
                                        bgcolor: isSelected ? type.bg : '#FAFAFA',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            borderColor: type.border,
                                            bgcolor: type.bg,
                                        },
                                    }}
                                >
                                    {/* Icon badge */}
                                    <Box
                                        sx={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: '50%',
                                            bgcolor: isSelected ? type.color : '#EEEEEE',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        <Icon
                                            sx={{
                                                color: isSelected ? '#fff' : '#757575',
                                                fontSize: 22,
                                                transition: 'all 0.2s ease',
                                            }}
                                        />
                                    </Box>

                                    {/* Text */}
                                    <Box sx={{ flex: 1 }}>
                                        <Typography
                                            variant="body1"
                                            fontWeight={isSelected ? 700 : 600}
                                            color={isSelected ? type.color : 'text.primary'}
                                        >
                                            {type.label}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {type.description}
                                        </Typography>
                                    </Box>

                                    {/* Selected indicator */}
                                    <Box
                                        sx={{
                                            width: 20,
                                            height: 20,
                                            borderRadius: '50%',
                                            border: `2px solid`,
                                            borderColor: isSelected ? type.color : '#BDBDBD',
                                            bgcolor: isSelected ? type.color : 'transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        {isSelected && (
                                            <Box
                                                sx={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: '50%',
                                                    bgcolor: '#fff',
                                                }}
                                            />
                                        )}
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>

                    {/* Continue button */}
                    <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        onClick={handleContinue}
                        disabled={!selected}
                        sx={{
                            py: 1.4,
                            fontWeight: 700,
                            fontSize: '1rem',
                            bgcolor: selected
                                ? ACCOUNT_TYPES.find((t) => t.value === selected)?.color
                                : undefined,
                            '&:hover': {
                                bgcolor: selected
                                    ? ACCOUNT_TYPES.find((t) => t.value === selected)?.color
                                    : undefined,
                                filter: 'brightness(0.9)',
                            },
                        }}
                    >
                        Continue →
                    </Button>

                    <Divider sx={{ my: 2.5 }} />

                    {/* Back to login */}
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            Already have an account?{' '}
                            <Link
                                to="/login"
                                style={{ color: '#1565C0', textDecoration: 'none', fontWeight: 600 }}
                            >
                                Sign in
                            </Link>
                        </Typography>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default RegisterSelectPage;
