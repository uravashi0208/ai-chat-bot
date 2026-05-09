import React, { useState } from 'react';
import { Box, Typography, InputAdornment } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import {
  AppButton,
  AppInput,
  AppAlert,
  CountrySelect,
  COUNTRIES,
  headingText,
  subText,
  labelText,
} from '../common';
import { authApi } from '../../services/api';
import { COLOR } from '../../theme/tokens';

/**
 * StepPhone
 *
 * Step 1 of OTP auth — user enters country + mobile number.
 * On success calls onNext(fullPhone, devOtp).
 */
function StepPhone({ onNext }) {
  const [country, setCountry]   = useState(COUNTRIES[0]);
  const [phone, setPhone]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async () => {
    setError('');
    const digits = phone.trim().replace(/[\s\-]/g, '');
    if (!digits || digits.length < 5) {
      setError('Please enter a valid phone number.');
      return;
    }
    const fullPhone = country.dial + digits;
    setLoading(true);
    try {
      const data = await authApi.sendOtp(fullPhone);
      onNext(fullPhone, data.devOtp || null);
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Heading */}
      <Typography variant="h5" sx={{ ...headingText, mb: 0.75 }}>
        Enter your phone number
      </Typography>
      <Typography variant="body2" sx={{ ...subText, mb: 3.5 }}>
        We'll send a 6-digit verification code to confirm your identity.
      </Typography>

      <AppAlert>{error}</AppAlert>

      {/* Country dropdown */}
      <CountrySelect value={country} onChange={setCountry} />

      {/* Phone number field */}
      <AppInput
        label="Phone Number"
        type="tel"
        autoFocus
        value={phone}
        onChange={(e) => setPhone(e.target.value.replace(/[^\d\s\-]/g, ''))}
        placeholder="98765 43210"
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Typography sx={{ color: COLOR.textPrimary, fontWeight: 700, fontSize: '0.95rem', mr: 0.5 }}>
                {country.dial}
              </Typography>
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3 }}
      />

      <AppButton
        loading={loading}
        disabled={!phone.trim()}
        onClick={handleSubmit}
        endIcon={<ArrowForwardIcon />}
      >
        Send Verification Code
      </AppButton>

      {/* Privacy note */}
      <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 2.5, color: COLOR.textDisabled, lineHeight: 1.6 }}>
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </Typography>
    </>
  );
}

export default StepPhone;
