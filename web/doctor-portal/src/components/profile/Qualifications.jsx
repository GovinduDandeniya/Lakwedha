import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    IconButton,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { DeleteOutline, School, VerifiedUser, WorkspacePremium } from '@mui/icons-material';
import api from '../../services/api';

const TYPE_META = {
    education: { icon: <School />, color: '#1565C0', label: 'Education' },
    certification: { icon: <VerifiedUser />, color: '#2E7D32', label: 'Certification' },
    award: { icon: <WorkspacePremium />, color: '#E65100', label: 'Award' },
};

const EMPTY_FORM = {
    type: 'education',
    title: '',
    institution: '',
    year: '',
};

const Qualifications = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState(EMPTY_FORM);

    const canSave = useMemo(() => form.title.trim().length > 0 && !saving, [form.title, saving]);

    const loadQualifications = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await api.get('/doctor-channeling/doctors/me/qualifications');
            setItems(Array.isArray(res.data?.data) ? res.data.data : []);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load qualifications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadQualifications();
    }, []);

    const handleAdd = async () => {
        if (!canSave) return;
        try {
            setSaving(true);
            setError('');
            await api.post('/doctor-channeling/doctors/me/qualifications', {
                type: form.type,
                title: form.title.trim(),
                institution: form.institution.trim(),
                year: form.year.trim(),
            });
            setForm(EMPTY_FORM);
            await loadQualifications();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to add qualification');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (qualId) => {
        try {
            setError('');
            await api.delete(`/doctor-channeling/doctors/me/qualifications/${qualId}`);
            await loadQualifications();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete qualification');
        }
    };

    return (
        <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, color: '#2E7D32' }}>
                Education & Certifications
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} sx={{ mb: 2 }}>
                <TextField
                    select
                    size="small"
                    label="Type"
                    value={form.type}
                    onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                    sx={{ minWidth: 150 }}
                >
                    <MenuItem value="education">Education</MenuItem>
                    <MenuItem value="certification">Certification</MenuItem>
                    <MenuItem value="award">Award</MenuItem>
                </TextField>
                <TextField
                    size="small"
                    label="Title"
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    fullWidth
                />
                <TextField
                    size="small"
                    label="Institution"
                    value={form.institution}
                    onChange={(e) => setForm((prev) => ({ ...prev, institution: e.target.value }))}
                    fullWidth
                />
                <TextField
                    size="small"
                    label="Year"
                    value={form.year}
                    onChange={(e) => setForm((prev) => ({ ...prev, year: e.target.value }))}
                    sx={{ width: { xs: '100%', sm: 120 } }}
                />
                <Button
                    variant="contained"
                    onClick={handleAdd}
                    disabled={!canSave}
                    sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#256628' } }}
                >
                    {saving ? 'Saving...' : 'Add'}
                </Button>
            </Stack>

            {loading ? (
                <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress size={24} />
                </Box>
            ) : items.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                    No qualifications added yet.
                </Typography>
            ) : (
                items.map((q, idx) => {
                    const meta = TYPE_META[q.type] || TYPE_META.education;
                    return (
                        <React.Fragment key={q._id || `${q.title}-${idx}`}>
                            <Box sx={{ display: 'flex', gap: 2, py: 1.5 }}>
                                <Box sx={{
                                    width: 42,
                                    height: 42,
                                    borderRadius: 2,
                                    flexShrink: 0,
                                    bgcolor: `${meta.color}11`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    {React.cloneElement(meta.icon, { sx: { color: meta.color, fontSize: 20 } })}
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                        <Typography variant="body2" fontWeight={700}>{q.title}</Typography>
                                        {q.year ? (
                                            <Chip
                                                label={q.year}
                                                size="small"
                                                sx={{ bgcolor: '#F5F5F5', color: '#666', fontSize: 10, height: 18 }}
                                            />
                                        ) : null}
                                        <Chip
                                            label={meta.label}
                                            size="small"
                                            sx={{ bgcolor: `${meta.color}11`, color: meta.color, fontSize: 10, height: 18 }}
                                        />
                                    </Box>
                                    <Typography variant="caption" color="text.secondary">
                                        {q.institution || '—'}
                                    </Typography>
                                </Box>
                                {q._id ? (
                                    <IconButton
                                        aria-label="Delete qualification"
                                        size="small"
                                        onClick={() => handleDelete(q._id)}
                                    >
                                        <DeleteOutline fontSize="small" />
                                    </IconButton>
                                ) : null}
                            </Box>
                            {idx < items.length - 1 && <Divider />}
                        </React.Fragment>
                    );
                })
            )}
        </Box>
    );
};

export default Qualifications;
