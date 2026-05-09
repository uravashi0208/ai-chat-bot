import React, { useRef } from 'react';
import { Box, Typography } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import PersonIcon from '@mui/icons-material/Person';
import { COLOR, GRADIENT, RADIUS } from '../../theme/tokens';

/**
 * AvatarPicker
 *
 * Circular tap-to-pick photo element.
 *
 * Props:
 *   preview  {string|null}  - data-URL or remote URL to display
 *   onChange {fn}           - (dataUrl: string) => void
 *   size     {number}       - diameter in px, default 96
 */
function AvatarPicker({ preview, onChange, size = 96 }) {
  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3.5 }}>
      <Box
        onClick={() => fileRef.current.click()}
        sx={{
          width: size,
          height: size,
          borderRadius: '50%',
          cursor: 'pointer',
          border: `2px dashed ${preview ? COLOR.primary : COLOR.border}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          bgcolor: preview ? 'transparent' : COLOR.bgInput,
          transition: 'all 0.2s',
          '&:hover': {
            borderColor: COLOR.primary,
            bgcolor: 'rgba(0,184,124,0.05)',
          },
        }}
      >
        {preview ? (
          <Box
            component="img"
            src={preview}
            alt="avatar"
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <>
            <PersonIcon sx={{ fontSize: 38, color: COLOR.textDisabled }} />
            <Typography sx={{ fontSize: '0.6rem', color: COLOR.textDisabled, fontWeight: 600, letterSpacing: '0.5px', mt: 0.5 }}>
              ADD PHOTO
            </Typography>
          </>
        )}

        {/* Camera badge */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 4,
            right: 4,
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: GRADIENT.brand,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,184,124,0.4)',
          }}
        >
          <CameraAltIcon sx={{ fontSize: 14, color: '#fff' }} />
        </Box>
      </Box>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
    </Box>
  );
}

export default AvatarPicker;
