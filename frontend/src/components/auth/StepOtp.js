import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  AppButton,
  AppAlert,
  OtpBoxes,
  headingText,
  subText,
} from '../common';
import { authApi } from '../../services/api';
import { COLOR, GRADIENT } from '../../theme/tokens';

const RESEND_SECONDS = 30;

/**
 * StepOtp
 *
 * Step 2 — user enters the 6-digit code sent to their phone.
 * Calls onExistingUser(user, token) for returning users.
 * Calls onNewUser(phone) for first-time sign-ups.
 */
function StepOtp({ phone, devOtp, onExistingUser, onNewUser, onBack }) {
  const [otp, setOtp]           = useState(['', '', '', '', '', '']);
  const [loading, setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError]       = useState('');
  const [countdown, setCountdown] = useState(RESEND_SECONDS);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSubmit = async () => {
    const code = otp.join('');
    if (code.length < 6) { setError('Please enter all 6 digits.'); return; }
    setError('');
    setLoading(true);
    try {
      const data = await authApi.phoneCheck(phone, code);
      if (data.exists) {
        onExistingUser(data.user, data.token);
      } else {
        onNewUser(phone);
      }
    } catch (err) {
      setError(err.message || 'Invalid code. Please try again.');
      setOtp(['', '', '', '', '', '']);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      await authApi.sendOtp(phone);
      setCountdown(RESEND_SECONDS);
      setOtp(['', '', '', '', '', '']);
    } catch {
      setError('Failed to resend. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const filledCount = otp.join('').length;

  return (
    <>
      {/* Back + heading row */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 3 }}>
        <IconButton size="small" onClick={onBack} sx={{ color: COLOR.textSecondary, mt: 0.25 }}>
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Box>
          <Typography variant="h5" sx={{ ...headingText, mb: 0.4 }}>
            Verify your number
          </Typography>
          <Typography variant="body2" sx={subText}>
            Code sent to{' '}
            <Box component="span" sx={{ fontWeight: 700, background: GRADIENT.brand, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {phone}
            </Box>
          </Typography>
        </Box>
      </Box>

      {/* Dev OTP hint */}
      {devOtp && (
        <AppAlert severity="warning" sx={{ mb: 2 }}>
          🛠 Dev mode — OTP pre-filled: <strong>{devOtp}</strong>
        </AppAlert>
      )}

      <AppAlert>{error}</AppAlert>

      {/* 6-box OTP entry */}
      <OtpBoxes value={otp} onChange={setOtp} autoFill={devOtp} />

      <AppButton
        loading={loading}
        disabled={filledCount < 6}
        onClick={handleSubmit}
      >
        Verify Code
      </AppButton>

      {/* Resend / change number row */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mt: 2.5 }}>
        {countdown > 0 ? (
          <Typography variant="body2" sx={{ color: COLOR.textDisabled }}>
            Resend in{' '}
            <Box component="span" sx={{ fontWeight: 700, color: COLOR.primary }}>
              {countdown}s
            </Box>
          </Typography>
        ) : (
          <Button
            size="small"
            variant="text"
            onClick={handleResend}
            disabled={resending}
            sx={{ color: COLOR.primary, fontWeight: 600, textTransform: 'none', fontSize: '0.85rem' }}
          >
            {resending ? 'Sending…' : 'Resend code'}
          </Button>
        )}

        <Box component="span" sx={{ color: COLOR.border, fontSize: '1.2rem' }}>·</Box>

        <Button
          size="small"
          variant="text"
          onClick={onBack}
          sx={{ color: COLOR.textSecondary, fontWeight: 500, textTransform: 'none', fontSize: '0.85rem' }}
        >
          Change number
        </Button>
      </Box>
    </>
  );
}

export default StepOtp;
