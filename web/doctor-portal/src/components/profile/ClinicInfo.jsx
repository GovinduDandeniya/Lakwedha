import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Divider, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Grid, IconButton,
    CircularProgress, Alert,
} from '@mui/material';
import { LocalHospital, LocationOn, Add, Delete } from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../services/api';

const COLORS = ['#1565C0', '#2E7D32', '#E65100', '#6A1B9A', '#00838F', '#558B2F'];

const ClinicInfo = () => {
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [form, setForm] = useState({ name: '', location: '' });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [deletingIndex, setDeletingIndex] = useState(null);

    useEffect(() => {
        api.get('/doctor-channeling/doctors/me/hospitals')
            .then(res => setHospitals(res.data.hospitals || []))
            .catch(() => toast.error('Failed to load clinic information'))
            .finally(() => setLoading(false));
    }, []);

    const openAdd = () => {
        setForm({ name: '', location: '' });
        setErrors({});
        setDialogOpen(true);
    };

    const handleAdd = async () => {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Clinic/Hospital name is required';
        if (!form.location.trim()) errs.location = 'Location is required';
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setSaving(true);
        try {
            const res = await api.post('/doctor-channeling/doctors/me/hospitals', form);
            setHospitals(res.data.hospitals || []);
            setDialogOpen(false);
            toast.success('Clinic added successfully');
        } catch (err) {
            toast.error(err?.response?.data?.error || 'Failed to add clinic');
        } finally {
            setSaving(false);
        }
    };

    const handleRemove = async (index) => {
        setDeletingIndex(index);
        try {
            const res = await api.delete(`/doctor-channeling/doctors/me/hospitals/${index}`);
            setHospitals(res.data.hospitals || []);
            toast.success('Clinic removed');
        } catch (err) {
            toast.error(err?.response?.data?.error || 'Failed to remove clinic');
        } finally {
            setDeletingIndex(null);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress size={28} />
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#2E7D32' }}>
                    Practicing Hospitals &amp; Clinics
                </Typography>
                <Button
                    size="small"
                    startIcon={<Add />}
                    variant="outlined"
                    onClick={openAdd}
                    sx={{ borderRadius: 2, borderColor: '#2E7D32', color: '#2E7D32', '&:hover': { borderColor: '#1B5E20', bgcolor: '#E8F5E9' } }}
                >
                    Add Clinic
                </Button>
            </Box>

            {hospitals.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                    <LocalHospital sx={{ fontSize: 44, opacity: 0.25, mb: 1 }} />
                    <Typography variant="body2">No hospitals or clinics added yet.</Typography>
                    <Typography variant="caption">Add clinics to release appointments to them.</Typography>
                </Box>
            ) : (
                hospitals.map((c, idx) => {
                    const color = COLORS[idx % COLORS.length];
                    return (
                        <React.Fragment key={idx}>
                            <Box sx={{ display: 'flex', gap: 2, py: 1.5, alignItems: 'flex-start' }}>
                                <Box sx={{
                                    width: 42, height: 42, borderRadius: 2, flexShrink: 0,
                                    bgcolor: `${color}11`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <LocalHospital sx={{ color, fontSize: 20 }} />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="body2" fontWeight={700}>{c.name}</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                                        <LocationOn sx={{ fontSize: 12, color: '#888' }} />
                                        <Typography variant="caption" color="text.secondary">{c.location}</Typography>
                                    </Box>
                                </Box>
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleRemove(idx)}
                                    disabled={deletingIndex === idx}
                                    title="Remove clinic"
                                >
                                    {deletingIndex === idx
                                        ? <CircularProgress size={16} />
                                        : <Delete fontSize="small" />}
                                </IconButton>
                            </Box>
                            {idx < hospitals.length - 1 && <Divider />}
                        </React.Fragment>
                    );
                })
            )}

            <Alert severity="info" sx={{ mt: 2, fontSize: 12 }}>
                These clinics appear as options when releasing appointment sessions in the Availability page.
            </Alert>

            {/* Add Clinic Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle>Add Clinic / Hospital</DialogTitle>
                <Divider />
                <DialogContent sx={{ pt: 2 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth size="small" label="Hospital / Clinic Name"
                                value={form.name}
                                onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(p => ({ ...p, name: '' })); }}
                                error={!!errors.name} helperText={errors.name}
                                placeholder="e.g. Nawaloka Hospital"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth size="small" label="Location"
                                value={form.location}
                                onChange={e => { setForm(f => ({ ...f, location: e.target.value })); setErrors(p => ({ ...p, location: '' })); }}
                                error={!!errors.location} helperText={errors.location}
                                placeholder="e.g. Colombo 02"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleAdd}
                        disabled={saving}
                        sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }}
                    >
                        {saving ? <CircularProgress size={18} /> : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ClinicInfo;
