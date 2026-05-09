import React from 'react';
import { Box, Typography } from '@mui/material';

export default function EmptyState({ icon, title, subtitle, sx = {} }) {
  return (
    <Box sx={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2, py:6, px:3, textAlign:'center', ...sx }}>
      {icon && (
        <Box sx={{ fontSize: 48, opacity: 0.35, lineHeight: 1 }}>
          {icon}
        </Box>
      )}
      {title && (
        <Typography variant="subtitle1" sx={{ color: 'text.secondary', fontWeight: 600 }}>
          {title}
        </Typography>
      )}
      {subtitle && (
        <Typography variant="body2" sx={{ color: 'text.disabled', maxWidth: 260 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}
