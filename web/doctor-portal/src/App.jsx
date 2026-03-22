import React, { useState } from 'react';
import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppRoutes from './routes';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import PharmacySidebar from './components/common/PharmacySidebar';

const DRAWER_WIDTH = 240;

const theme = createTheme({
    palette: {
        primary: { main: '#2E7D32' },
        secondary: { main: '#1565C0' },
    },
    components: {
        MuiButton: { styleOverrides: { root: { textTransform: 'none' } } },
    },
});

function App() {
    const { isAuthenticated } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();

    const isPharmacyRoute = location.pathname.startsWith('/pharmacy/dashboard') ||
        location.pathname.startsWith('/pharmacy/prescriptions') ||
        location.pathname.startsWith('/pharmacy/orders');
    const isPharmacyLoggedIn = !!localStorage.getItem('pharmacy_token');
    const showPharmacyLayout = isPharmacyRoute && isPharmacyLoggedIn;
    const showDoctorLayout   = isAuthenticated && !showPharmacyLayout;

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F0F4F8' }}>
                {showDoctorLayout && (
                    <Header onMenuClick={() => setMobileOpen(true)} />
                )}
                {showPharmacyLayout && (
                    <Header onMenuClick={() => setMobileOpen(true)} isPharmacy />
                )}
                {showDoctorLayout && (
                    <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
                )}
                {showPharmacyLayout && (
                    <PharmacySidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
                )}
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        mt: (showDoctorLayout || showPharmacyLayout) ? '64px' : 0,
                        width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` },
                        minHeight: 'calc(100vh - 64px)',
                        overflow: 'auto',
                    }}
                >
                    <AppRoutes />
                </Box>
            </Box>
        </ThemeProvider>
    );
}

export default App;
