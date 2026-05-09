import React from 'react';
import { Button, CircularProgress } from '@mui/material';
import { primaryBtnSx } from './commonStyles';

/**
 * AppButton
 *
 * Standard gradient CTA button used across all user-side screens.
 *
 * Props:
 *   loading    {boolean}  - shows spinner and disables
 *   children   {node}     - button label
 *   endIcon    {node}     - trailing icon (hidden while loading)
 *   ...rest               - forwarded to MUI Button
 */
function AppButton({ loading = false, children, endIcon, disabled, sx, ...rest }) {
  return (
    <Button
      fullWidth
      variant="contained"
      size="large"
      disabled={loading || disabled}
      endIcon={loading ? <CircularProgress size={18} sx={{ color: 'inherit' }} /> : endIcon}
      sx={{ ...primaryBtnSx, ...sx }}
      {...rest}
    >
      {children}
    </Button>
  );
}

export default AppButton;
