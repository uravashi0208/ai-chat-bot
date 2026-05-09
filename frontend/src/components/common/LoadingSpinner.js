import React from 'react';
import { Box, CircularProgress } from '@mui/material';

export default function LoadingSpinner({ size = 32, sx = {} }) {
  return (
    <Box sx={{ display:'flex', alignItems:'center', justifyContent:'center', py:4, ...sx }}>
      <CircularProgress size={size} sx={{ color:'primary.main' }} />
    </Box>
  );
}
