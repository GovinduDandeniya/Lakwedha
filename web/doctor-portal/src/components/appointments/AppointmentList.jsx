import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import AppointmentCard from './AppointmentCard';

const COLS  = ['No.',  'Patient',  'Age',  'Time', 'Hospital', 'Status', 'Actions'];
const SIZES = [70,     null,       64,     90,     null,       100,      56];

const AppointmentList = ({ appointments, onMarkComplete }) => {
    if (!appointments || appointments.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography color="text.secondary">No appointments found</Typography>
            </Box>
        );
    }

    return (
        <Box>
            {/* Column headers — desktop only */}
            <Box sx={{
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center', px: 2, py: 1,
                bgcolor: '#F8FAF8', borderBottom: '1px solid #EEEEEE',
            }}>
                {COLS.map((col, i) => (
                    <Typography key={col} sx={{
                        fontSize: 12, fontWeight: 700, color: '#666',
                        width: SIZES[i] || undefined,
                        flex: SIZES[i] ? undefined : 1,
                        display: col === 'Age' ? { xs: 'none', sm: 'block' } : undefined,
                    }}>
                        {col}
                    </Typography>
                ))}
            </Box>

            {appointments.map((apt, idx) => (
                <React.Fragment key={apt.id}>
                    <AppointmentCard appointment={apt} onMarkComplete={onMarkComplete} />
                    {idx < appointments.length - 1 && <Divider />}
                </React.Fragment>
            ))}
        </Box>
    );
};

export default AppointmentList;
