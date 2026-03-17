import React from 'react';
import { Box, Typography, TextField, IconButton, Button } from '@mui/material';
import { Delete, Add, AccessTime } from '@mui/icons-material';

const TimeSlotManager = ({ slots, onAdd, onRemove, onChange }) => (
    <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <AccessTime sx={{ color: '#2E7D32', fontSize: 18 }} />
            <Typography variant="subtitle2" fontWeight={700}>Time Slots</Typography>
        </Box>

        {slots.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                No slots added yet. Click below to add.
            </Typography>
        )}

        {slots.map((slot, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TextField
                    type="time" size="small"
                    value={slot.start}
                    onChange={e => onChange(index, 'start', e.target.value)}
                    label="Start"
                    InputLabelProps={{ shrink: true }}
                    sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <Typography variant="body2" color="text.secondary">→</Typography>
                <TextField
                    type="time" size="small"
                    value={slot.end}
                    onChange={e => onChange(index, 'end', e.target.value)}
                    label="End"
                    InputLabelProps={{ shrink: true }}
                    sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <IconButton size="small" color="error" onClick={() => onRemove(index)}>
                    <Delete fontSize="small" />
                </IconButton>
            </Box>
        ))}

        <Button
            size="small"
            startIcon={<Add />}
            onClick={onAdd}
            sx={{ color: '#2E7D32', fontWeight: 600, mt: 0.5 }}
        >
            Add Slot
        </Button>
    </Box>
);

export default TimeSlotManager;
