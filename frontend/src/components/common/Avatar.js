import React from 'react';

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

export default function Avatar({ name, src, size = 40, style = {} }) {
  const [imgError, setImgError] = React.useState(false);

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        onError={() => setImgError(true)}
        style={{
          width: size, height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          display: 'block',
          ...style,
        }}
      />
    );
  }

  const bg = getColor(name);
  const fontSize = size <= 32 ? size * 0.38 : size * 0.35;

  return (
    <div
      style={{
        width: size, height: size,
        borderRadius: '50%',
        background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff',
        fontWeight: 600,
        fontSize,
        flexShrink: 0,
        userSelect: 'none',
        ...style,
      }}
    >
      {getInitials(name)}
    </div>
  );
}
