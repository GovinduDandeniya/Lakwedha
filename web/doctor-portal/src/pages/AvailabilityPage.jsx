import React, { useState, useEffect } from 'react';
import {
    Paper,
    Typography,
    Box,
    Button,
    Grid,
    Card,
    CardContent,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
} from '@mui/material';
import {
    Add,
    Delete,
    Edit,
    AccessTime,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import api from '../services/api';
import { toast } from 'react-toastify';

const AvailabilityPage = () => {
    const [availability, setAvailability] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [timeSlots, setTimeSlots] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchAvailability();
    }, []);

    const fetchAvailability = async () => {
        try {
            const response = await api.get('/doctor-channeling/availability');
            setAvailability(response.data);
        } catch (error) {
            toast.error('Failed to load availability');
        }
    };

    const handleAddSlot = () => {
        setTimeSlots([...timeSlots, { start: '09:00', end: '09:30', isBooked: false }]);
    };

    const handleRemoveSlot = (index) => {
        const newSlots = timeSlots.filter((_, i) => i !== index);
        setTimeSlots(newSlots);
    };

    const handleSlotChange = (index, field, value) => {
        const newSlots = [...timeSlots];
        newSlots[index][field] = value;
        setTimeSlots(newSlots);
    };

    const handleSaveAvailability = async () => {
        setLoading(true);
        try {
            await api.post('/doctor-channeling/availability', {
                date: selectedDate,
                slots: timeSlots,
            });
            toast.success('Availability saved successfully');
            setOpenDialog(false);
            fetchAvailability();
        } catch (error) {
            toast.error('Failed to save availability');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Manage Availability</Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setOpenDialog(true)}
                >
                    Add Availability
                </Button>
            </Box>

            <Grid container spacing={3}>
                {availability.map((day) => (
                    <Grid item xs={12} md={6} lg={4} key={day.id}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    {new Date(day.date).toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </Typography>
                                <Box sx={{ mt: 2 }}>
                                    {day.slots.map((slot, index) => (
                                        <Chip
                                            key={index}
                                            label={`${slot.startTime} - ${slot.endTime}`}
                                            color={slot.isBooked ? 'default' : 'success'}
                                            size="small"
                                            sx={{ m: 0.5 }}
                                        />
                                    ))}
                                </Box>
                                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                    <IconButton size="small">
                                        <Edit/>
                                    </IconButton>
                                    <IconButton size="small" color="error">
                                        <Delete />
                                    </IconButton>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add Availability</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <DatePicker
                            label="Select Date"
                            value={selectedDate}
                            onChange={(newValue) => setSelectedDate(newValue)}
                            renderInput={(params) => <TextField {...params} fullWidth sx={{ mb: 2 }} />}
                        />

                        <Typography variant="subtitle1" gutterBottom>
                            Time Slots
                        </Typography>

                        {timeSlots.map((slot, index) => (
                            <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                <TextField
                                    type="time"
                                    size="small"
                                    value={slot.start}
                                    onChange={(e) => handleSlotChange(index, 'start', e.target.value)}
                                    sx={{ flex: 1 }}
                                />
                                <TextField
                                    type="time"
                                    size="small"
                                    value={slot.end}
                                    onChange={(e) => handleSlotChange(index, 'end', e.target.value)}
                                    sx={{ flex: 1 }}
                                />
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleRemoveSlot(index)}
                                >
                                    <Delete />
                                </IconButton>
                            </Box>
                        ))}
                        <Button
                            startIcon={<Add />}
                            onClick={handleAddSlot}
                            sx={{ mt: 1 }}
                        >
                            Add Time Slot
                        </Button>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleSaveAvailability}
                        disabled={loading || timeSlots.length === 0}
                    >
                        {loading ? 'Saving...' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AvailabilityPage;