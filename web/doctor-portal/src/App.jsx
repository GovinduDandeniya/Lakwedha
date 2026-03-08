import React from 'react';
import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { useAuth } from './context/AuthContext';
import AppRoutes from './routes';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';

const theme = createTheme({
    palette: {
        primary: {
            main: '#0D5C3E',
        },
        secondary: {
            main: '#D4AF37',
        },
    },
});

function App() {
    const { isAuthenticated } = useAuth();

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ display: 'flex' }}>
                {isAuthenticated && <Header />}
                {isAuthenticated && <Sidebar />}
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        p: 3,
                        mt: 8,
                        ml: isAuthenticated ? '240px' : 0,
                    }}
                >
                    <AppRoutes />
                </Box>
            </Box>
        </ThemeProvider>
    );
}

export default App;