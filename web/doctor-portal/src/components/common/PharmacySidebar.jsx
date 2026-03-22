import React from 'react';
import {
    Drawer, List, ListItemButton, ListItemIcon, ListItemText,
    Toolbar, Box, Typography, Divider, Avatar,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DescriptionIcon from '@mui/icons-material/Description';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LogoutIcon from '@mui/icons-material/Logout';
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';
import { useNavigate, useLocation } from 'react-router-dom';

const DRAWER_WIDTH = 240;
const GREEN = '#0D5C3E';

const navItems = [
    { label: 'Dashboard',     icon: <DashboardIcon />,     path: '/pharmacy/dashboard'      },
    { label: 'Prescriptions', icon: <DescriptionIcon />,   path: '/pharmacy/prescriptions'  },
    { label: 'Orders',        icon: <LocalShippingIcon />, path: '/pharmacy/orders'         },
];

const DrawerContent = ({ onItemClick }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const pharmacy = (() => {
        try { return JSON.parse(localStorage.getItem('pharmacy_user') || '{}'); } catch { return {}; }
    })();

    const handleNav = (path) => {
        navigate(path);
        if (onItemClick) onItemClick();
    };

    const handleLogout = () => {
        localStorage.removeItem('pharmacy_token');
        localStorage.removeItem('pharmacy_user');
        navigate('/login');
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Toolbar sx={{ display: { md: 'none' }, gap: 1.5 }}>
                <LocalPharmacyIcon sx={{ color: GREEN }} />
                <Typography variant="subtitle1" fontWeight={700} color={GREEN}>Lakwedha</Typography>
            </Toolbar>
            <Toolbar sx={{ display: { xs: 'none', md: 'flex' } }} />

            {/* Pharmacy mini profile */}
            <Box sx={{ px: 2, py: 2, bgcolor: '#F0FFF4', borderBottom: '1px solid #C8E6C9' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 38, height: 38, bgcolor: GREEN, fontSize: 14, fontWeight: 700 }}>
                        <LocalPharmacyIcon sx={{ fontSize: 20 }} />
                    </Avatar>
                    <Box sx={{ overflow: 'hidden' }}>
                        <Typography variant="body2" fontWeight={700} noWrap sx={{ fontSize: 13, color: GREEN }}>
                            {pharmacy.pharmacyName || 'Pharmacy'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: 11 }}>
                            {pharmacy.city || 'Pharmacy Portal'}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <Divider />

            <List sx={{ px: 1, py: 1.5, flexGrow: 1 }}>
                {navItems.map((item) => {
                    const active = location.pathname === item.path;
                    return (
                        <ListItemButton
                            key={item.path}
                            onClick={() => handleNav(item.path)}
                            sx={{
                                borderRadius: 2, mb: 0.5, px: 1.5, py: 1,
                                bgcolor: active ? '#E8F5E9' : 'transparent',
                                color:   active ? GREEN : '#555',
                                '&:hover': { bgcolor: active ? '#E8F5E9' : '#F5F5F5' },
                                transition: 'all 0.15s ease',
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 36, color: active ? GREEN : '#888' }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText
                                primary={item.label}
                                primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 700 : 500 }}
                            />
                        </ListItemButton>
                    );
                })}
            </List>

            <Divider />
            <List sx={{ px: 1, py: 1 }}>
                <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2, color: '#C62828' }}>
                    <ListItemIcon sx={{ minWidth: 36, color: '#C62828' }}><LogoutIcon /></ListItemIcon>
                    <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }} />
                </ListItemButton>
            </List>
            <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.disabled">Lakwedha Pharmacy Portal</Typography>
            </Box>
        </Box>
    );
};

const PharmacySidebar = ({ mobileOpen, onMobileClose }) => (
    <>
        <Drawer variant="temporary" open={mobileOpen} onClose={onMobileClose}
            ModalProps={{ keepMounted: true }}
            sx={{
                display: { xs: 'block', md: 'none' },
                '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', border: 'none' },
            }}>
            <DrawerContent onItemClick={onMobileClose} />
        </Drawer>
        <Drawer variant="permanent"
            sx={{
                display: { xs: 'none', md: 'block' },
                width: DRAWER_WIDTH, flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: DRAWER_WIDTH, boxSizing: 'border-box',
                    border: 'none', borderRight: '1px solid #E8EDF2',
                },
            }}>
            <DrawerContent />
        </Drawer>
    </>
);

export default PharmacySidebar;
