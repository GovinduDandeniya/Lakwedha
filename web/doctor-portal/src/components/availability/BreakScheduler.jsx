import React from 'react';
import { Box, Typography, TextField, IconButton, Button, Chip } from '@mui/material';
import { Delete, Add, FreeBreakfast } from '@mui/icons-material';

const BreakScheduler = ({ breaks, onAdd, onRemove, onChange }) => (
    <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <FreeBreakfast sx={{ color: '#E65100', fontSize: 18 }} />
            <Typography variant="subtitle2" fontWeight={700}>Breaks</Typography>
            <Chip label="Optional" size="small" sx={{ bgcolor: '#FFF3E0', color: '#E65100', fontSize: 10, height: 18 }} />
        </Box>

        {(!breaks || breaks.length === 0) && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                No breaks scheduled.
            </Typography>
        )}

        {(breaks || []).map((br, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TextField
                    type="time" size="small"
                    value={br.start}
                    onChange={e => onChange(index, 'start', e.target.value)}
                    label="Break Start"
                    InputLabelProps={{ shrink: true }}
                    sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <Typography variant="body2" color="text.secondary">→</Typography>
                <TextField
                    type="time" size="small"
                    value={br.end}
                    onChange={e => onChange(index, 'end', e.target.value)}
                    label="Break End"
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
            sx={{ color: '#E65100', fontWeight: 600, mt: 0.5 }}
        >
            Add Break
        </Button>
    </Box>
);

export default BreakScheduler;
