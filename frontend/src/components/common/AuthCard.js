import React from 'react';
import { Box, Paper, Fade } from '@mui/material';
import { authBackground, authCard } from './commonStyles';
import { COLOR, GRADIENT, RADIUS } from '../../theme/tokens';

/**
 * AuthCard
 *
 * Full-page centred wrapper with gradient background and white card.
 * Every auth step (Phone, OTP, Profile) renders inside this.
 *
 * Props:
 *   children {node}
 */
function AuthCard({ children }) {
  return (
    <Box sx={authBackground}>
      {/* Decorative gradient orb — top right */}
      <Box
        sx={{
          position: 'absolute', top: -140, right: -100,
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,200,150,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      {/* Decorative gradient orb — bottom left */}
      <Box
        sx={{
          position: 'absolute', bottom: -160, left: -120,
          width: 460, height: 460, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,163,255,0.10) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      {/* Small accent orb — mid-left */}
      <Box
        sx={{
          position: 'absolute', top: '40%', left: -60,
          width: 180, height: 180, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,200,150,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <Fade in timeout={350}>
        <Paper elevation={0} sx={authCard}>
          {/* Brand logo strip */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
            <Box
              sx={{
                width: 48, height: 48,
                borderRadius: `${RADIUS.sm}px`,
                background: GRADIENT.brand,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(0,184,124,0.35)',
                fontSize: 26,
              }}
            >
              💬
            </Box>
            <Box>
              <Box
                component="span"
                sx={{
                  fontWeight: 700,
                  fontSize: '1.15rem',
                  background: GRADIENT.brand,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  letterSpacing: '-0.3px',
                  display: 'block',
                }}
              >
                WhatsApp
              </Box>
              <Box component="span" sx={{ fontSize: '0.7rem', color: COLOR.textDisabled, letterSpacing: '1px' }}>
                SECURE MESSAGING
              </Box>
            </Box>
          </Box>

          {children}
        </Paper>
      </Fade>
    </Box>
  );
}

export default AuthCard;
