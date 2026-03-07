import React, { useState, useEffect } from 'react';
import {
    Grid,
    Paper,
    Typography,
    Box,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Divider,
} from '@mui/material';
import {
    TrendingUp,
    CalendarToday,
    People,
    MonetizationOn,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AppointmentChart from '../components/dashboard/AppointmentChart';

const DashboardPage = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalAppointments: 0,
        todayAppointments: 0,
        totalPatients: 0,
        earnings: 0,
    });
    const [recentAppointments, setRecentAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, appointmentsRes] = await Promise.all([
                api.get('/doctor-channeling/stats'),
                api.get('/doctor-channeling/appointments/recent'),
            ]);

            setStats(statsRes.data);
            setRecentAppointments(appointmentsRes.data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, icon, color }) => (
        <Card>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography color="textSecondary" gutterBottom variant="body2">
                            {title}
                        </Typography>
                        <Typography variant="h5" component="h2">
                            {value}
                        </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
                        {icon}
                    </Avatar>
                </Box>
            </CardContent>
        </Card>
    );

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Welcome back, Dr. {user?.name}
            </Typography>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Today's Appointments"
                        value={stats.todayAppointments}
                        icon={<CalendarToday />}
                        color="#1976d2"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Appointments"
                        value={stats.totalAppointments}
                        icon={<TrendingUp />}
                        color="#2e7d32"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Patients"
                        value={stats.totalPatients}
                        icon={<People />}
                        color="#ed6c02"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Earnings (LKR)"
                        value={stats.earnings.toLocaleString()}
                        icon={<MonetizationOn />}
                        color="#9c27b0"
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Appointment Trends
                        </Typography>
                        <AppointmentChart />
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Recent Appointments
                        </Typography>
                        <List>
                            {recentAppointments.map((appointment, index) => (
                                <React.Fragment key={appointment.id}>
                                    <ListItem alignItems="flex-start">
                                        <ListItemAvatar>
                                            <Avatar alt={appointment.patientName} />
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={appointment.patientName}
                                            secondary={
                                                <>
                                                <Typography component="span" variant="body2" color="textPrimary">
                                                    {appointment.time}
                                                </Typography>
                                                    {` — ${appointment.status}`}
                                                </>
                                            }
                                        />
                                    </ListItem>
                                    {index < recentAppointments.length - 1 && <Divider />}
                                </React.Fragment>
                            ))}
                        </List>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default DashboardPage;