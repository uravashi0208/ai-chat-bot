import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import {
  AppButton,
  AppInput,
  AppAlert,
  AvatarPicker,
  headingText,
  subText,
} from '../common';
import { authApi } from '../../services/api';
import { COLOR } from '../../theme/tokens';

/**
 * StepProfile
 *
 * Step 3 — new user sets their display name and optional avatar.
 * Only shown when phoneCheck returns exists=false.
 * Calls onDone(user, token) when registration succeeds.
 */
function StepProfile({ phone, onDone }) {
  const [fullName, setFullName] = useState('');
  const [preview, setPreview]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async () => {
    if (!fullName.trim()) { setError('Please enter your name.'); return; }
    setError('');
    setLoading(true);
    try {
      const data = await authApi.phoneRegister({
        phone,
        fullName: fullName.trim(),
        avatarUrl: preview || undefined,
      });
      onDone(data.user, data.token);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Typography variant="h5" sx={{ ...headingText, mb: 0.75 }}>
        Set up your profile
      </Typography>
      <Typography variant="body2" sx={{ ...subText, mb: 3.5 }}>
        Add your name so friends can recognise you. Photo is optional.
      </Typography>

      <AppAlert>{error}</AppAlert>

      {/* Avatar */}
      <AvatarPicker preview={preview} onChange={setPreview} />

      {/* Name field */}
      <AppInput
        label="Your Name"
        autoFocus
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Enter your full name"
        inputProps={{ maxLength: 100 }}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        sx={{ mb: 2 }}
      />

      {/* Phone chip */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          bgcolor: 'rgba(0,184,124,0.06)',
          border: '1px solid rgba(0,184,124,0.18)',
          borderRadius: '8px',
          px: 2,
          py: 1.25,
          mb: 3,
        }}
      >
        <Typography variant="caption" sx={{ fontSize: '1rem' }}>📱</Typography>
        <Typography variant="body2" sx={{ color: COLOR.textSecondary }}>{phone}</Typography>
      </Box>

      <AppButton
        loading={loading}
        disabled={!fullName.trim()}
        onClick={handleSubmit}
        endIcon={<ArrowForwardIcon />}
      >
        {loading ? 'Creating account…' : 'Get Started'}
      </AppButton>
    </>
  );
}

export default StepProfile;
