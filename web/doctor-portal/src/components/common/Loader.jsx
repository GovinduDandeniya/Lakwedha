import React from 'react';
import { Box, CircularProgress } from '@mui/material';

const Loader = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
);

export default Loader;
