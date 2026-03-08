import React, { useState } from 'react';
import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { useAuth } from './context/AuthContext';
import AppRoutes from './routes';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';

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

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F0F4F8' }}>
                {isAuthenticated && (
                    <Header onMenuClick={() => setMobileOpen(true)} />
                )}
                {isAuthenticated && (
                    <Sidebar
                        mobileOpen={mobileOpen}
                        onMobileClose={() => setMobileOpen(false)}
                    />
                )}
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        mt: '64px',
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
