import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Switch, Divider,
    TextField, Button, Grid, Alert, InputAdornment,
} from '@mui/material';
import { Notifications, Lock, Settings, LocalAtm } from '@mui/icons-material';
import api from '../services/api';

const Section = ({ icon, title, children }) => (
    <Paper elevation={0} sx={{ borderRadius: 3, p: 3, mb: 3, border: '1px solid #E8EDF2', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
            {React.cloneElement(icon, { sx: { color: '#2E7D32', fontSize: 22 } })}
            <Typography variant="h6" fontWeight={700} fontSize={16}>{title}</Typography>
        </Box>
        <Divider sx={{ mb: 2.5 }} />
        {children}
    </Paper>
);

const ToggleRow = ({ label, description, checked, onChange }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1 }}>
        <Box>
            <Typography variant="body2" fontWeight={600}>{label}</Typography>
            <Typography variant="caption" color="text.secondary">{description}</Typography>
        </Box>
        <Switch
            checked={checked}
            onChange={onChange}
            sx={{
                '& .MuiSwitch-switchBase.Mui-checked': { color: '#2E7D32' },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#2E7D32' },
            }}
        />
    </Box>
);

const SettingsPage = () => {
    const [notifs, setNotifs] = useState({
        newAppointment: true,
        cancellation: true,
        payment: false,
        reminder: true,
    });
    const [passwords, setPasswords] = useState({ current: '', newPw: '', confirm: '' });
    const [saved, setSaved] = useState(false);
    const [pwError, setPwError] = useState('');

    // Consultation fee state
    const [consultationFee, setConsultationFee] = useState('');
    const [feeLoading, setFeeLoading] = useState(true);
    const [feeSaved, setFeeSaved] = useState(false);
    const [feeError, setFeeError] = useState('');
    const [feeSaving, setFeeSaving] = useState(false);

    useEffect(() => {
        api.get('/doctor-channeling/doctors/me/fee')
            .then(res => setConsultationFee(String(res.data?.consultationFee ?? '')))
            .catch(() => {})
            .finally(() => setFeeLoading(false));
    }, []);

    const handleFeeUpdate = async () => {
        setFeeError('');
        const fee = Number(consultationFee);
        if (isNaN(fee) || fee < 0) { setFeeError('Enter a valid non-negative amount.'); return; }
        setFeeSaving(true);
        try {
            await api.put('/doctor-channeling/doctors/me/fee', { consultationFee: fee });
            setFeeSaved(true);
            setTimeout(() => setFeeSaved(false), 3000);
        } catch {
            setFeeError('Failed to update fee. Please try again.');
        } finally {
            setFeeSaving(false);
        }
    };

    const handleNotifChange = (key) => () => setNotifs(prev => ({ ...prev, [key]: !prev[key] }));

    const handlePasswordChange = () => {
        setPwError('');
        if (!passwords.current || !passwords.newPw || !passwords.confirm) {
            setPwError('Please fill all fields.');
            return;
        }
        if (passwords.newPw !== passwords.confirm) {
            setPwError('New passwords do not match.');
            return;
        }
        if (passwords.newPw.length < 6) {
            setPwError('Password must be at least 6 characters.');
            return;
        }
        setSaved(true);
        setPasswords({ current: '', newPw: '', confirm: '' });
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#F0F4F8', minHeight: '100vh' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Settings sx={{ color: '#2E7D32', fontSize: 28 }} />
                <Box>
                    <Typography variant="h5" fontWeight={700}>Settings</Typography>
                    <Typography variant="body2" color="text.secondary">Manage your preferences</Typography>
                </Box>
            </Box>

            {/* Consultation Fee */}
            <Section icon={<LocalAtm />} title="Consultation Fee">
                {feeSaved && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>Fee updated successfully!</Alert>}
                {feeError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{feeError}</Alert>}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Set your channeling consultation fee. The platform adds a 10% channeling fee on top of your fee plus the hospital charge.
                </Typography>
                <Grid container spacing={2} alignItems="flex-end">
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth size="small" type="number"
                            label="Consultation Fee (LKR)"
                            disabled={feeLoading}
                            value={consultationFee}
                            onChange={e => setConsultationFee(e.target.value)}
                            inputProps={{ min: 0 }}
                            InputProps={{
                                startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Button
                            variant="contained"
                            disabled={feeLoading || feeSaving}
                            onClick={handleFeeUpdate}
                            sx={{ bgcolor: '#2E7D32', borderRadius: 2, px: 3, '&:hover': { bgcolor: '#1B5E20' } }}
                        >
                            {feeSaving ? 'Saving…' : 'Update Fee'}
                        </Button>
                    </Grid>
                </Grid>
            </Section>

            {/* Notification Settings */}
            <Section icon={<Notifications />} title="Notification Preferences">
                <ToggleRow
                    label="New Appointments"
                    description="Get notified when a patient books an appointment"
                    checked={notifs.newAppointment}
                    onChange={handleNotifChange('newAppointment')}
                />
                <Divider />
                <ToggleRow
                    label="Appointment Cancellations"
                    description="Get notified when an appointment is cancelled"
                    checked={notifs.cancellation}
                    onChange={handleNotifChange('cancellation')}
                />
                <Divider />
                <ToggleRow
                    label="Payment Confirmations"
                    description="Get notified when a payment is received"
                    checked={notifs.payment}
                    onChange={handleNotifChange('payment')}
                />
                <Divider />
                <ToggleRow
                    label="Appointment Reminders"
                    description="Receive daily summary of upcoming appointments"
                    checked={notifs.reminder}
                    onChange={handleNotifChange('reminder')}
                />
            </Section>

            {/* Password Change */}
            <Section icon={<Lock />} title="Change Password">
                {saved && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>Password updated successfully!</Alert>}
                {pwError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{pwError}</Alert>}
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth size="small" type="password"
                            label="Current Password"
                            value={passwords.current}
                            onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth size="small" type="password"
                            label="New Password"
                            value={passwords.newPw}
                            onChange={e => setPasswords(p => ({ ...p, newPw: e.target.value }))}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth size="small" type="password"
                            label="Confirm New Password"
                            value={passwords.confirm}
                            onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Button
                            variant="contained"
                            onClick={handlePasswordChange}
                            sx={{
                                bgcolor: '#2E7D32', borderRadius: 2, px: 3,
                                '&:hover': { bgcolor: '#1B5E20' },
                            }}
                        >
                            Update Password
                        </Button>
                    </Grid>
                </Grid>
            </Section>
        </Box>
    );
};

export default SettingsPage;
