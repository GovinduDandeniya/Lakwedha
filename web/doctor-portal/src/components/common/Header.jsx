import React, { useState, useEffect } from 'react';
import {
    AppBar, Toolbar, Typography, IconButton, Box, Badge,
    Menu, MenuItem, Avatar, Divider, Tooltip, ListItemIcon,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import EventIcon from '@mui/icons-material/Event';
import CancelIcon from '@mui/icons-material/Cancel';
import PaymentIcon from '@mui/icons-material/Payment';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import api from '../../services/api';

const NOTIFICATION_ICONS = {
    booking: <EventIcon fontSize="small" sx={{ color: '#1565C0' }} />,
    cancellation: <CancelIcon fontSize="small" sx={{ color: '#C62828' }} />,
    payment: <PaymentIcon fontSize="small" sx={{ color: '#2E7D32' }} />,
};

const Header = ({ onMenuClick }) => {
    const { user, logout } = useAuth();
    const { unreadCount, setUnreadCount, notifications, setNotifications } = useNotification();
    const navigate = useNavigate();

    const [profileAnchor, setProfileAnchor] = useState(null);
    const [notifAnchor, setNotifAnchor] = useState(null);

    useEffect(() => {
        api.get('/dashboard/notifications')
            .then(res => {
                setNotifications(res.data.data || []);
                setUnreadCount(res.data.unreadCount || 0);
            })
            .catch(() => {});
    }, [setNotifications, setUnreadCount]);

    const handleProfileOpen = (e) => setProfileAnchor(e.currentTarget);
    const handleProfileClose = () => setProfileAnchor(null);
    const handleNotifOpen = (e) => {
        setNotifAnchor(e.currentTarget);
        setUnreadCount(0);
    };
    const handleNotifClose = () => setNotifAnchor(null);

    const handleLogout = () => {
        handleProfileClose();
        logout();
    };

    const getInitials = (name) =>
        name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'DR';

    return (
        <AppBar
            position="fixed"
            elevation={0}
            sx={{
                zIndex: (theme) => theme.zIndex.drawer + 1,
                background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 60%, #388E3C 100%)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}
        >
            <Toolbar sx={{ gap: 1 }}>
                {/* Hamburger — mobile only */}
                <IconButton
                    color="inherit"
                    edge="start"
                    onClick={onMenuClick}
                    sx={{ display: { md: 'none' }, mr: 0.5 }}
                >
                    <MenuIcon />
                </IconButton>

                {/* Brand */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                        width: 36, height: 36, borderRadius: '50%',
                        bgcolor: 'rgba(255,255,255,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <LocalHospitalIcon sx={{ color: '#fff', fontSize: 22 }} />
                    </Box>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff', lineHeight: 1.1, letterSpacing: 0.5 }}>
                            Aurveda
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', letterSpacing: 1, fontSize: 9 }}>
                            DOCTOR PORTAL
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ flexGrow: 1 }} />

                {/* Notifications Bell */}
                <Tooltip title="Notifications">
                    <IconButton color="inherit" onClick={handleNotifOpen}>
                        <Badge badgeContent={unreadCount} color="error" max={9}>
                            <NotificationsIcon />
                        </Badge>
                    </IconButton>
                </Tooltip>

                {/* Profile Chip */}
                <Tooltip title="My Account">
                    <Box
                        onClick={handleProfileOpen}
                        sx={{
                            display: 'flex', alignItems: 'center', gap: 1,
                            cursor: 'pointer', px: 1.5, py: 0.5, borderRadius: 2,
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
                            transition: 'background 0.2s',
                        }}
                    >
                        <Avatar sx={{ width: 34, height: 34, bgcolor: 'rgba(255,255,255,0.25)', fontWeight: 700, fontSize: 13 }}>
                            {getInitials(user?.name)}
                        </Avatar>
                        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                            <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, lineHeight: 1.2 }}>
                                {user?.name || 'Doctor'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>
                                {user?.specialization || 'Physician'}
                            </Typography>
                        </Box>
                    </Box>
                </Tooltip>

                {/* Profile Dropdown */}
                <Menu
                    anchorEl={profileAnchor}
                    open={Boolean(profileAnchor)}
                    onClose={handleProfileClose}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    PaperProps={{ sx: { mt: 1, minWidth: 200, borderRadius: 2, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' } }}
                >
                    <Box sx={{ px: 2, py: 1.5 }}>
                        <Typography variant="body2" fontWeight={700}>{user?.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
                    </Box>
                    <Divider />
                    <MenuItem onClick={() => { handleProfileClose(); navigate('/profile'); }} sx={{ py: 1.2 }}>
                        <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                        View Profile
                    </MenuItem>
                    <MenuItem onClick={() => { handleProfileClose(); navigate('/settings'); }} sx={{ py: 1.2 }}>
                        <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
                        Settings
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={handleLogout} sx={{ py: 1.2, color: '#C62828' }}>
                        <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: '#C62828' }} /></ListItemIcon>
                        Logout
                    </MenuItem>
                </Menu>

                {/* Notifications Dropdown */}
                <Menu
                    anchorEl={notifAnchor}
                    open={Boolean(notifAnchor)}
                    onClose={handleNotifClose}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    PaperProps={{ sx: { mt: 1, width: 340, borderRadius: 2, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' } }}
                >
                    <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <NotificationsActiveIcon sx={{ color: '#2E7D32' }} />
                        <Typography variant="subtitle2" fontWeight={700}>Notifications</Typography>
                    </Box>
                    <Divider />
                    {notifications.length === 0 ? (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">No notifications</Typography>
                        </Box>
                    ) : (
                        notifications.slice(0, 5).map((n) => (
                            <MenuItem
                                key={n.id}
                                onClick={handleNotifClose}
                                sx={{
                                    py: 1.2, px: 2, whiteSpace: 'normal',
                                    bgcolor: n.read ? 'transparent' : 'rgba(46,125,50,0.06)',
                                    borderLeft: n.read ? 'none' : '3px solid #2E7D32',
                                    alignItems: 'flex-start',
                                }}
                            >
                                <ListItemIcon sx={{ mt: 0.3, minWidth: 32 }}>
                                    {NOTIFICATION_ICONS[n.type] || <NotificationsIcon fontSize="small" />}
                                </ListItemIcon>
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: n.read ? 400 : 600, fontSize: 13 }}>
                                        {n.message}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">{n.time}</Typography>
                                </Box>
                            </MenuItem>
                        ))
                    )}
                    <Divider />
                    <Box sx={{ p: 1, textAlign: 'center' }}>
                        <Typography
                            variant="caption"
                            sx={{ color: '#2E7D32', cursor: 'pointer', fontWeight: 600 }}
                            onClick={handleNotifClose}
                        >
                            View all notifications
                        </Typography>
                    </Box>
                </Menu>
            </Toolbar>
        </AppBar>
    );
};

export default Header;
