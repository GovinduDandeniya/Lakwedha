import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import AppointmentCard from './AppointmentCard';

const COLS = ['Appt. #', 'Patient Name', 'Time', 'Hospital', 'Status', 'Actions'];
const WIDTHS = [100, null, 100, null, 100, 80];

const AppointmentList = ({ appointments, onView, onMarkComplete }) => {
    if (!appointments || appointments.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography color="text.secondary">No appointments found</Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center', px: 2, py: 1,
                bgcolor: '#F8FAF8', borderBottom: '1px solid #EEEEEE',
            }}>
                {COLS.map((col, i) => (
                    <Typography key={col} sx={{
                        fontSize: 12, fontWeight: 700, color: '#666',
                        width: WIDTHS[i] || undefined,
                        flex: WIDTHS[i] ? undefined : 1,
                    }}>
                        {col}
                    </Typography>
                ))}
            </Box>
            {appointments.map((apt, idx) => (
                <React.Fragment key={apt.id}>
                    <AppointmentCard appointment={apt} onView={onView} onMarkComplete={onMarkComplete} />
                    {idx < appointments.length - 1 && <Divider />}
                </React.Fragment>
            ))}
        </Box>
    );
};

export default AppointmentList;
