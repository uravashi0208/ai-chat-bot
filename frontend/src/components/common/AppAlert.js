import React from 'react';
import { Alert } from '@mui/material';
import { RADIUS } from '../../theme/tokens';

/**
 * AppAlert
 *
 * Thin wrapper around MUI Alert with shared corner radius.
 *
 * Props:
 *   severity  {'error'|'warning'|'success'|'info'}
 *   children  {node}
 *   sx        {object}
 */
function AppAlert({ severity = 'error', children, sx }) {
  if (!children) return null;
  return (
    <Alert
      severity={severity}
      sx={{ borderRadius: `${RADIUS.sm}px`, fontSize: '0.8rem', mb: 2.5, ...sx }}
    >
      {children}
    </Alert>
  );
}

export default AppAlert;
