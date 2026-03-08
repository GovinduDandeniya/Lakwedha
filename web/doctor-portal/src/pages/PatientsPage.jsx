import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, CircularProgress,
    TextField, InputAdornment,
} from '@mui/material';
import { Search, People } from '@mui/icons-material';
import PatientList from '../components/patients/PatientList';
import PatientProfile from '../components/patients/PatientProfile';
import api from '../services/api';

const PatientsPage = () => {
    const [patients, setPatients] = useState([]);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchPatients = useCallback(async (q = '') => {
        setLoading(true);
        try {
            const res = await api.get('/patients', { params: q ? { search: q } : {} });
            setPatients(res.data.data || []);
        } catch {
            setPatients([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchPatients(); }, [fetchPatients]);

    const handleSearch = (e) => {
        const q = e.target.value;
        setSearch(q);
        fetchPatients(q);
    };

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#F0F4F8', minHeight: '100vh' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <People sx={{ color: '#E65100', fontSize: 28 }} />
                <Box>
                    <Typography variant="h5" fontWeight={700}>Patients</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {patients.length} registered patients
                    </Typography>
                </Box>
            </Box>

            <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #E8EDF2', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                {/* Search bar */}
                <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #F5F5F5' }}>
                    <TextField
                        size="small"
                        placeholder="Search patients by name or condition..."
                        value={search}
                        onChange={handleSearch}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search sx={{ color: '#aaa', fontSize: 18 }} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            width: { xs: '100%', md: 400 },
                            '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 13 },
                        }}
                    />
                </Box>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress sx={{ color: '#2E7D32' }} />
                    </Box>
                ) : (
                    <PatientList patients={patients} onView={setSelected} />
                )}
            </Paper>

            <PatientProfile
                patient={selected}
                open={Boolean(selected)}
                onClose={() => setSelected(null)}
            />
        </Box>
    );
};

export default PatientsPage;
