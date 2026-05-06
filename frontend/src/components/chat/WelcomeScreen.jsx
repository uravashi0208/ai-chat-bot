import React from 'react';
import { Box, Typography, alpha } from '@mui/material';
import { LockOutlined as LockIcon } from '@mui/icons-material';

export default function WelcomeScreen() {
  return (
    <Box sx={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      bgcolor: 'background.chatPanel',
      backgroundImage: 'radial-gradient(ellipse at 50% 40%, rgba(0,168,132,0.04) 0%, transparent 60%)',
      gap: 3,
      px: 4,
      userSelect: 'none',
    }}>
      {/* Logo graphic */}
      <Box sx={{
        width: 120, height: 120, borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(0,168,132,0.15), rgba(0,168,132,0.05))',
        border: '1px solid',
        borderColor: alpha('#00a884', 0.2),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 60px rgba(0,168,132,0.08)',
      }}>
        <Box sx={{ fontSize: '3.5rem', lineHeight: 1 }}>💬</Box>
      </Box>

      <Box sx={{ textAlign: 'center', maxWidth: 380 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', mb: 1.5, letterSpacing: '-0.3px' }}>
          WhatsApp Web
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
          Send and receive messages without keeping your phone online.
          Use WhatsApp on up to 4 linked devices and 1 phone at the same time.
        </Typography>
      </Box>

      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 1,
        bgcolor: alpha('#8696a0', 0.06),
        border: '1px solid',
        borderColor: alpha('#8696a0', 0.12),
        borderRadius: 2.5,
        px: 2, py: 1,
      }}>
        <LockIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
        <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 500 }}>
          End-to-end encrypted
        </Typography>
      </Box>
    </Box>
  );
}
