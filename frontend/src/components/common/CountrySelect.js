import React from 'react';
import { Select, MenuItem, Box, Typography } from '@mui/material';
import { COLOR, RADIUS } from '../../theme/tokens';
import { labelText } from './commonStyles';

export const COUNTRIES = [
  { code: 'IN', name: 'India',          dial: '+91',  flag: '🇮🇳' },
  { code: 'US', name: 'United States',  dial: '+1',   flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dial: '+44',  flag: '🇬🇧' },
  { code: 'PK', name: 'Pakistan',       dial: '+92',  flag: '🇵🇰' },
  { code: 'BD', name: 'Bangladesh',     dial: '+880', flag: '🇧🇩' },
  { code: 'AU', name: 'Australia',      dial: '+61',  flag: '🇦🇺' },
  { code: 'AE', name: 'UAE',            dial: '+971', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia',   dial: '+966', flag: '🇸🇦' },
  { code: 'SG', name: 'Singapore',      dial: '+65',  flag: '🇸🇬' },
  { code: 'DE', name: 'Germany',        dial: '+49',  flag: '🇩🇪' },
  { code: 'FR', name: 'France',         dial: '+33',  flag: '🇫🇷' },
  { code: 'BR', name: 'Brazil',         dial: '+55',  flag: '🇧🇷' },
  { code: 'JP', name: 'Japan',          dial: '+81',  flag: '🇯🇵' },
  { code: 'CN', name: 'China',          dial: '+86',  flag: '🇨🇳' },
  { code: 'ZA', name: 'South Africa',   dial: '+27',  flag: '🇿🇦' },
  { code: 'NG', name: 'Nigeria',        dial: '+234', flag: '🇳🇬' },
  { code: 'TR', name: 'Turkey',         dial: '+90',  flag: '🇹🇷' },
  { code: 'PL', name: 'Poland',         dial: '+48',  flag: '🇵🇱' },
  { code: 'MY', name: 'Malaysia',       dial: '+60',  flag: '🇲🇾' },
  { code: 'CA', name: 'Canada',         dial: '+1',   flag: '🇨🇦' },
];

/**
 * CountrySelect
 *
 * Dropdown showing flag + country name + dial code.
 *
 * Props:
 *   value    {object}   - selected country object from COUNTRIES
 *   onChange {fn}       - (countryObject) => void
 */
function CountrySelect({ value, onChange }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography component="span" sx={labelText}>Country</Typography>
      <Select
        fullWidth
        value={value.code}
        onChange={(e) => onChange(COUNTRIES.find((c) => c.code === e.target.value))}
        size="small"
        sx={{
          borderRadius: `${RADIUS.sm}px`,
          bgcolor: COLOR.bgInput,
          color: COLOR.textPrimary,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: COLOR.border },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#C4C9D4' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: COLOR.primary },
          '& .MuiSvgIcon-root': { color: COLOR.textSecondary },
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              bgcolor: COLOR.bgCard,
              border: `1px solid ${COLOR.border}`,
              borderRadius: `${RADIUS.md}px`,
              maxHeight: 260,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            },
          },
        }}
      >
        {COUNTRIES.map((c) => (
          <MenuItem key={c.code + c.dial} value={c.code} sx={{ gap: 1.5 }}>
            <span style={{ fontSize: 18 }}>{c.flag}</span>
            <span style={{ flex: 1, fontSize: '0.875rem', color: COLOR.textPrimary }}>{c.name}</span>
            <span style={{ fontSize: '0.8rem', color: COLOR.textSecondary, fontWeight: 600 }}>{c.dial}</span>
          </MenuItem>
        ))}
      </Select>
    </Box>
  );
}

export default CountrySelect;
