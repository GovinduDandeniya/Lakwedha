import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, Divider, CircularProgress,
} from '@mui/material';
import { Add, EventAvailable } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import api from '../services/api';
import AvailabilityCalendar from '../components/availability/AvailabilityCalendar';
import TimeSlotManager from '../components/availability/TimeSlotManager';
import BreakScheduler from '../components/availability/BreakScheduler';

const AvailabilityPage = () => {
    const [availability, setAvailability] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [timeSlots, setTimeSlots] = useState([]);
    const [breaks, setBreaks] = useState([]);

    const fetchAvailability = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/doctor-channeling/availability');
            setAvailability(res.data || []);
        } catch {
            toast.error('Failed to load availability');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAvailability(); }, [fetchAvailability]);

    const openAddDialog = () => {
        setSelectedDate(dayjs());
        setTimeSlots([]);
        setBreaks([]);
        setOpenDialog(true);
    };

    // TimeSlotManager handlers
    const handleAddSlot = () => setTimeSlots(prev => [...prev, { start: '09:00', end: '09:30' }]);
    const handleRemoveSlot = (i) => setTimeSlots(prev => prev.filter((_, idx) => idx !== i));
    const handleSlotChange = (i, field, value) => setTimeSlots(prev => {
        const next = [...prev];
        next[i] = { ...next[i], [field]: value };
        return next;
    });

    // BreakScheduler handlers
    const handleAddBreak = () => setBreaks(prev => [...prev, { start: '13:00', end: '14:00' }]);
    const handleRemoveBreak = (i) => setBreaks(prev => prev.filter((_, idx) => idx !== i));
    const handleBreakChange = (i, field, value) => setBreaks(prev => {
        const next = [...prev];
        next[i] = { ...next[i], [field]: value };
        return next;
    });

    const handleSave = async () => {
        if (timeSlots.length === 0) {
            toast.error('Add at least one time slot.');
            return;
        }
        setSaving(true);
        try {
            await api.post('/doctor-channeling/availability', {
                date: selectedDate?.toISOString() ?? selectedDate,
                slots: timeSlots,
                breaks,
            });
            toast.success('Availability saved!');
            setOpenDialog(false);
            fetchAvailability();
        } catch {
            toast.error('Failed to save availability.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#F0F4F8', minHeight: '100vh' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <EventAvailable sx={{ color: '#2E7D32', fontSize: 28 }} />
                    <Box>
                        <Typography variant="h5" fontWeight={700}>Availability</Typography>
                        <Typography variant="body2" color="text.secondary">Manage your schedule</Typography>
                    </Box>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={openAddDialog}
                    sx={{ bgcolor: '#2E7D32', borderRadius: 2, fontWeight: 600, '&:hover': { bgcolor: '#1B5E20' } }}
                >
                    Add Availability
                </Button>
            </Box>

            {/* Calendar grid */}
            <Paper elevation={0} sx={{ borderRadius: 3, p: 2.5, border: '1px solid #E8EDF2', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress sx={{ color: '#2E7D32' }} />
                    </Box>
                ) : (
                    <AvailabilityCalendar availability={availability} />
                )}
            </Paper>

            {/* Add Availability Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 700, fontSize: 17 }}>Add Availability</DialogTitle>
                <Divider />
                <DialogContent sx={{ pt: 2.5 }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label="Select Date"
                            value={selectedDate}
                            onChange={setSelectedDate}
                            slotProps={{
                                textField: {
                                    fullWidth: true, size: 'small',
                                    sx: { mb: 2.5, '& .MuiOutlinedInput-root': { borderRadius: 2 } },
                                },
                            }}
                        />
                    </LocalizationProvider>

                    <TimeSlotManager
                        slots={timeSlots}
                        onAdd={handleAddSlot}
                        onRemove={handleRemoveSlot}
                        onChange={handleSlotChange}
                    />

                    <Divider sx={{ my: 2 }} />

                    <BreakScheduler
                        breaks={breaks}
                        onAdd={handleAddBreak}
                        onRemove={handleRemoveBreak}
                        onChange={handleBreakChange}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setOpenDialog(false)}
                        sx={{ borderRadius: 2, color: '#555', borderColor: '#ddd' }} variant="outlined">
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={saving}
                        sx={{ bgcolor: '#2E7D32', borderRadius: 2, fontWeight: 600, '&:hover': { bgcolor: '#1B5E20' } }}
                    >
                        {saving ? 'Saving…' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AvailabilityPage;
