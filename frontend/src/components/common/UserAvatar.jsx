import React from 'react';
import { Avatar, Box } from '@mui/material';

const COLORS = [
  '#00a884','#0094d3','#e63f6e','#f57c00','#8e24aa',
  '#00838f','#2e7d32','#c62828','#4527a0','#558b2f',
];

function getColor(name) {
  if (!name) return COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

export default function UserAvatar({ name, src, size = 40, online, sx = {} }) {
  const [imgError, setImgError] = React.useState(false);
  const bgColor = getColor(name);

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
      <Avatar
        src={src && !imgError ? src : undefined}
        onError={() => setImgError(true)}
        sx={{
          width: size,
          height: size,
          bgcolor: bgColor,
          fontSize: size <= 32 ? size * 0.38 : size * 0.34,
          fontWeight: 600,
          flexShrink: 0,
          ...sx,
        }}
      >
        {getInitials(name)}
      </Avatar>
      {online !== undefined && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 1,
            right: 1,
            width: size * 0.28,
            height: size * 0.28,
            minWidth: 8,
            minHeight: 8,
            bgcolor: online ? '#00a884' : 'transparent',
            border: online ? '2px solid #111b21' : 'none',
            borderRadius: '50%',
            transition: 'background-color 0.3s',
          }}
        />
      )}
    </Box>
  );
}
