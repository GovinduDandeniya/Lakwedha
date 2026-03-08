import React from 'react';
import { Box, Typography, Chip, Grid } from '@mui/material';
import { CalendarToday } from '@mui/icons-material';

const AvailabilityCalendar = ({ availability }) => {
    if (!availability || availability.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 4, bgcolor: '#F8FAF8', borderRadius: 2 }}>
                <CalendarToday sx={{ color: '#ccc', fontSize: 40, mb: 1 }} />
                <Typography color="text.secondary" variant="body2">No availability scheduled</Typography>
            </Box>
        );
    }

    return (
        <Grid container spacing={2}>
            {availability.map((day) => {
                const dateLabel = new Date(day.date).toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric',
                });
                const booked = day.slots?.filter(s => s.isBooked).length || 0;
                const available = day.slots?.filter(s => !s.isBooked).length || 0;

                return (
                    <Grid item xs={12} sm={6} key={day.id || day.date}>
                        <Box sx={{
                            p: 2, borderRadius: 2, border: '1px solid #E8EDF2',
                            bgcolor: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                                <Typography variant="body2" fontWeight={700}>{dateLabel}</Typography>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    {available > 0 && (
                                        <Chip label={`${available} free`} size="small"
                                            sx={{ bgcolor: '#E8F5E9', color: '#2E7D32', fontWeight: 600, fontSize: 10, height: 20 }}
                                        />
                                    )}
                                    {booked > 0 && (
                                        <Chip label={`${booked} booked`} size="small"
                                            sx={{ bgcolor: '#FFF3E0', color: '#E65100', fontWeight: 600, fontSize: 10, height: 20 }}
                                        />
                                    )}
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {day.slots?.map((slot, i) => (
                                    <Chip
                                        key={i}
                                        label={`${slot.startTime || slot.start}`}
                                        size="small"
                                        sx={{
                                            fontSize: 10, height: 22,
                                            bgcolor: slot.isBooked ? '#FFEBEE' : '#E8F5E9',
                                            color: slot.isBooked ? '#C62828' : '#2E7D32',
                                            fontWeight: 600,
                                        }}
                                    />
                                ))}
                            </Box>
                        </Box>
                    </Grid>
                );
            })}
        </Grid>
    );
};

export default AvailabilityCalendar;
