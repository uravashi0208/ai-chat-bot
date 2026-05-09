import React from 'react';
import { TextField, Typography, Box } from '@mui/material';
import { labelText, inputSx } from './commonStyles';

/**
 * AppInput
 *
 * Labelled text field with the shared light-theme style.
 *
 * Props:
 *   label    {string}  - uppercase micro-label rendered above field
 *   sx       {object}  - extra sx overrides
 *   ...rest           - forwarded to MUI TextField
 */
function AppInput({ label, sx, ...rest }) {
  return (
    <Box>
      {label && (
        <Typography component="span" sx={labelText}>
          {label}
        </Typography>
      )}
      <TextField fullWidth sx={{ ...inputSx, ...sx }} {...rest} />
    </Box>
  );
}

export default AppInput;
