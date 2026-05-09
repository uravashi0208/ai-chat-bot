import React, { useRef, useEffect } from 'react';
import { Box } from '@mui/material';
import { COLOR, RADIUS } from '../../theme/tokens';

/**
 * OtpBoxes
 *
 * Six individual character input boxes — WhatsApp / bank-style OTP entry.
 *
 * Props:
 *   value     {string[6]}  - controlled array of single chars
 *   onChange  {fn}         - (newArray) => void
 *   autoFill  {string}     - if provided, pre-fills all boxes on mount
 */
function OtpBoxes({ value, onChange, autoFill }) {
  const refs = useRef([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (autoFill && autoFill.length === 6) {
      onChange(autoFill.split(''));
    }
  }, [autoFill]); // eslint-disable-line

  const handleChange = (index, raw) => {
    const char = raw.replace(/\D/g, '').slice(0, 1);
    const next = [...value];
    next[index] = char;
    onChange(next);
    if (char && index < 5) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      onChange(pasted.split(''));
      refs.current[5]?.focus();
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', mb: 3.5 }} onPaste={handlePaste}>
      {value.map((digit, i) => (
        <Box
          key={i}
          component="input"
          ref={(el) => { refs.current[i] = el; }}
          type="tel"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          sx={{
            width: 50,
            height: 60,
            textAlign: 'center',
            fontSize: '1.5rem',
            fontWeight: 700,
            fontFamily: 'inherit',
            color: COLOR.textPrimary,
            caretColor: COLOR.primary,
            outline: 'none',
            border: `2px solid ${digit ? COLOR.primary : COLOR.border}`,
            borderRadius: `${RADIUS.sm}px`,
            bgcolor: digit ? 'rgba(0,184,124,0.06)' : COLOR.bgInput,
            transition: 'all 0.15s',
            cursor: 'text',
            '&:focus': {
              borderColor: COLOR.primary,
              bgcolor: 'rgba(0,184,124,0.05)',
              boxShadow: `0 0 0 3px rgba(0,184,124,0.15)`,
            },
          }}
        />
      ))}
    </Box>
  );
}

export default OtpBoxes;
