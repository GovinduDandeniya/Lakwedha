import React, { useEffect, useState } from 'react';
import {
    Box, Typography, Chip, Divider, IconButton, Button,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, MenuItem, CircularProgress, Alert,
} from '@mui/material';
import { School, VerifiedUser, WorkspacePremium, Add, Delete } from '@mui/icons-material';
import api from '../../services/api';

const TYPE_META = {
    education:     { icon: <School />,            color: '#1565C0', label: 'Education' },
    certification: { icon: <VerifiedUser />,       color: '#2E7D32', label: 'Certification' },
    award:         { icon: <WorkspacePremium />,   color: '#E65100', label: 'Award' },
};

const EMPTY_FORM = { type: 'education', title: '', institution: '', year: '' };

const Qualifications = () => {
    const [qualifications, setQualifications] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState('');
    const [open, setOpen]         = useState(false);
    const [form, setForm]         = useState(EMPTY_FORM);
    const [saving, setSaving]     = useState(false);
    const [saveError, setSaveError] = useState('');
    const [deletingId, setDeletingId] = useState(null);

    const fetchQualifications = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await api.get('/doctor-channeling/doctors/me/qualifications');
            setQualifications(res.data.data || []);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load qualifications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchQualifications(); }, []);

    const handleAdd = async () => {
        if (!form.title.trim()) { setSaveError('Title is required'); return; }
        try {
            setSaving(true);
            setSaveError('');
            const res = await api.post('/doctor-channeling/doctors/me/qualifications', form);
            setQualifications(res.data.data || []);
            setOpen(false);
            setForm(EMPTY_FORM);
        } catch (err) {
            setSaveError(err.response?.data?.error || 'Failed to save qualification');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (qualId) => {
        try {
            setDeletingId(qualId);
            const res = await api.delete(`/doctor-channeling/doctors/me/qualifications/${qualId}`);
            setQualifications(res.data.data || []);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete qualification');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#2E7D32' }}>
                    Education &amp; Certifications
                </Typography>
                <Button
                    size="small"
                    startIcon={<Add />}
                    variant="outlined"
                    onClick={() => { setOpen(true); setForm(EMPTY_FORM); setSaveError(''); }}
                    sx={{ borderColor: '#2E7D32', color: '#2E7D32', textTransform: 'none', fontWeight: 600 }}
                >
                    Add
                </Button>
            </Box>

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={28} sx={{ color: '#2E7D32' }} />
                </Box>
            )}

            {!loading && error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {!loading && !error && qualifications.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                    No qualifications added yet. Click <strong>Add</strong> to get started.
                </Typography>
            )}

            {!loading && qualifications.map((q, idx) => {
                const meta = TYPE_META[q.type] || TYPE_META.education;
                return (
                    <React.Fragment key={q._id}>
                        <Box sx={{ display: 'flex', gap: 2, py: 1.5, alignItems: 'flex-start' }}>
                            <Box sx={{
                                width: 42, height: 42, borderRadius: 2, flexShrink: 0,
                                bgcolor: `${meta.color}11`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                {React.cloneElement(meta.icon, { sx: { color: meta.color, fontSize: 20 } })}
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" fontWeight={700}>{q.title}</Typography>
                                    {q.year && (
                                        <Chip label={q.year} size="small"
                                            sx={{ bgcolor: '#F5F5F5', color: '#666', fontSize: 10, height: 18 }}
                                        />
                                    )}
                                    <Chip label={meta.label} size="small"
                                        sx={{ bgcolor: `${meta.color}11`, color: meta.color, fontSize: 10, height: 18, fontWeight: 600 }}
                                    />
                                </Box>
                                {q.institution && (
                                    <Typography variant="caption" color="text.secondary">{q.institution}</Typography>
                                )}
                            </Box>
                            <IconButton
                                size="small"
                                onClick={() => handleDelete(q._id)}
                                disabled={deletingId === q._id}
                                sx={{ color: '#d32f2f', mt: 0.5 }}
                            >
                                {deletingId === q._id
                                    ? <CircularProgress size={16} color="inherit" />
                                    : <Delete fontSize="small" />
                                }
                            </IconButton>
                        </Box>
                        {idx < qualifications.length - 1 && <Divider />}
                    </React.Fragment>
                );
            })}

            {/* Add qualification dialog */}
            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Add Qualification</DialogTitle>
                <DialogContent sx={{ pt: 1 }}>
                    {saveError && <Alert severity="error" sx={{ mb: 2 }}>{saveError}</Alert>}
                    <TextField
                        select fullWidth label="Type" size="small" sx={{ mb: 2, mt: 1 }}
                        value={form.type}
                        onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    >
                        <MenuItem value="education">Education</MenuItem>
                        <MenuItem value="certification">Certification</MenuItem>
                        <MenuItem value="award">Award</MenuItem>
                    </TextField>
                    <TextField
                        fullWidth label="Title *" size="small" sx={{ mb: 2 }}
                        placeholder="e.g. MBBS, MD, MRCP"
                        value={form.title}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    />
                    <TextField
                        fullWidth label="Institution" size="small" sx={{ mb: 2 }}
                        placeholder="e.g. University of Colombo"
                        value={form.institution}
                        onChange={e => setForm(f => ({ ...f, institution: e.target.value }))}
                    />
                    <TextField
                        fullWidth label="Year" size="small"
                        placeholder="e.g. 2018"
                        value={form.year}
                        onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleAdd}
                        disabled={saving}
                        sx={{ bgcolor: '#2E7D32', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#1B5E20' } }}
                    >
                        {saving ? <CircularProgress size={18} color="inherit" /> : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Qualifications;
