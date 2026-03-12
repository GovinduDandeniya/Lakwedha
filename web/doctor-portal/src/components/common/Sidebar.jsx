import React from 'react';
import {
    Drawer, List, ListItemButton, ListItemIcon, ListItemText,
    Toolbar, Box, Typography, Divider, Avatar,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EventIcon from '@mui/icons-material/Event';
import PeopleIcon from '@mui/icons-material/People';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const DRAWER_WIDTH = 240;

const navItems = [
    { label: 'Dashboard',     icon: <DashboardIcon />, path: '/dashboard' },
    { label: 'Appointments',  icon: <EventIcon />,     path: '/appointments' },
    { label: 'Patients',      icon: <PeopleIcon />,    path: '/patients' },
    { label: 'Availability',   icon: <ScheduleIcon />,          path: '/availability' },
    { label: 'Extra Requests', icon: <AddCircleOutlineIcon />,   path: '/extra-requests' },
    { label: 'Profile',        icon: <PersonIcon />,             path: '/profile' },
    { label: 'Settings',      icon: <SettingsIcon />,  path: '/settings' },
];

const DrawerContent = ({ onItemClick }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const handleNav = (path) => {
        navigate(path);
        if (onItemClick) onItemClick();
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Brand header inside drawer (for mobile where AppBar is above) */}
            <Toolbar sx={{ display: { md: 'none' }, gap: 1.5 }}>
                <Box sx={{
                    width: 32, height: 32, borderRadius: '50%',
                    bgcolor: '#2E7D32',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <LocalHospitalIcon sx={{ color: '#fff', fontSize: 18 }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={700} color="#2E7D32">
                    Aurveda
                </Typography>
            </Toolbar>
            <Toolbar sx={{ display: { xs: 'none', md: 'flex' } }} />

            {/* Doctor mini profile */}
            <Box sx={{ px: 2, py: 2, bgcolor: '#F8FAF8', borderBottom: '1px solid #E8EDF2' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 38, height: 38, bgcolor: '#2E7D32', fontSize: 14, fontWeight: 700 }}>
                        {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'DR'}
                    </Avatar>
                    <Box sx={{ overflow: 'hidden' }}>
                        <Typography variant="body2" fontWeight={700} noWrap sx={{ fontSize: 13 }}>
                            {user?.name || 'Doctor'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: 11 }}>
                            {user?.specialization || 'General Physician'}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <Divider />

            {/* Nav items */}
            <List sx={{ px: 1, py: 1.5, flexGrow: 1 }}>
                {navItems.map((item) => {
                    const active = location.pathname === item.path;
                    return (
                        <ListItemButton
                            key={item.path}
                            onClick={() => handleNav(item.path)}
                            sx={{
                                borderRadius: 2,
                                mb: 0.5,
                                px: 1.5,
                                py: 1,
                                bgcolor: active ? '#E8F5E9' : 'transparent',
                                color: active ? '#2E7D32' : '#555',
                                '&:hover': {
                                    bgcolor: active ? '#E8F5E9' : '#F5F5F5',
                                },
                                transition: 'all 0.15s ease',
                            }}
                        >
                            <ListItemIcon sx={{
                                minWidth: 36,
                                color: active ? '#2E7D32' : '#888',
                            }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText
                                primary={item.label}
                                primaryTypographyProps={{
                                    fontSize: 14,
                                    fontWeight: active ? 700 : 500,
                                }}
                            />
                            {active && (
                                <Box sx={{
                                    width: 4, height: 4, borderRadius: '50%',
                                    bgcolor: '#2E7D32',
                                }} />
                            )}
                        </ListItemButton>
                    );
                })}
            </List>

            <Divider />
            <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.disabled">
                    Aurveda Doctor Portal v1.0
                </Typography>
            </Box>
        </Box>
    );
};

const Sidebar = ({ mobileOpen, onMobileClose }) => {
    return (
        <>
            {/* Mobile: temporary drawer */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={onMobileClose}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    '& .MuiDrawer-paper': {
                        width: DRAWER_WIDTH,
                        boxSizing: 'border-box',
                        border: 'none',
                        boxShadow: '4px 0 20px rgba(0,0,0,0.1)',
                    },
                }}
            >
                <DrawerContent onItemClick={onMobileClose} />
            </Drawer>

            {/* Desktop: permanent drawer */}
            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', md: 'block' },
                    width: DRAWER_WIDTH,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: DRAWER_WIDTH,
                        boxSizing: 'border-box',
                        border: 'none',
                        borderRight: '1px solid #E8EDF2',
                        boxShadow: '2px 0 8px rgba(0,0,0,0.04)',
                    },
                }}
            >
                <DrawerContent />
            </Drawer>
        </>
    );
};

export default Sidebar;
