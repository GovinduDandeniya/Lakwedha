import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const VALUES = [8, 6, 10, 7, 12, 5, 9];

const AppointmentChart = ({ weeklyData, weekDays }) => {
    const data = weeklyData || VALUES;
    const labels = weekDays || DAYS;
    const peak = Math.max(...data);

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, height: 160, px: 1 }}>
                {data.map((val, i) => {
                    const heightPct = peak > 0 ? (val / peak) * 100 : 0;
                    const isToday = i === new Date().getDay() - 1;
                    return (
                        <Tooltip key={i} title={`${labels[i]}: ${val} appointments`} placement="top">
                            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                                <Typography variant="caption" sx={{ color: '#2E7D32', fontWeight: 700, fontSize: 11 }}>
                                    {val}
                                </Typography>
                                <Box
                                    sx={{
                                        width: '100%', borderRadius: '6px 6px 2px 2px',
                                        height: `${Math.max(heightPct, 8)}%`,
                                        background: isToday
                                            ? 'linear-gradient(180deg, #2E7D32 0%, #1B5E20 100%)'
                                            : 'linear-gradient(180deg, #81C784 0%, #4CAF50 100%)',
                                        boxShadow: isToday ? '0 2px 8px rgba(46,125,50,0.4)' : 'none',
                                        transition: 'height 0.3s ease',
                                        cursor: 'pointer',
                                        '&:hover': { opacity: 0.85 },
                                    }}
                                />
                            </Box>
                        </Tooltip>
                    );
                })}
            </Box>
            {/* X-axis labels */}
            <Box sx={{ display: 'flex', gap: 1.5, px: 1, mt: 0.5 }}>
                {labels.map((day, i) => (
                    <Box key={i} sx={{ flex: 1, textAlign: 'center' }}>
                        <Typography variant="caption" sx={{
                            color: i === new Date().getDay() - 1 ? '#2E7D32' : 'text.secondary',
                            fontWeight: i === new Date().getDay() - 1 ? 700 : 400,
                            fontSize: 11,
                        }}>
                            {day}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

export default AppointmentChart;
