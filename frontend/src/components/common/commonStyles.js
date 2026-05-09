/**
 * commonStyles.js
 *
 * Reusable MUI `sx` objects and style helpers.
 * Import named exports; never duplicate these inline.
 */

import { COLOR, GRADIENT, RADIUS, SHADOW, FONT } from '../../theme/tokens';

// ── Page / Layout ──────────────────────────────────────────────────────────

export const pageCenter = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export const authBackground = {
  ...pageCenter,
  background: GRADIENT.hero,
  p: 3,
  position: 'relative',
  overflow: 'hidden',
};

// ── Card ───────────────────────────────────────────────────────────────────

export const authCard = {
  width: '100%',
  maxWidth: 420,
  bgcolor: COLOR.bgCard,
  borderRadius: `${RADIUS.lg}px`,
  p: { xs: 3, sm: 4.5 },
  boxShadow: SHADOW.elevated,
  border: `1px solid ${COLOR.border}`,
  position: 'relative',
  zIndex: 1,
};

// ── Typography helpers ─────────────────────────────────────────────────────

export const labelText = {
  color: COLOR.textDisabled,
  fontWeight: FONT.weight.semibold,
  fontSize: FONT.size.xs,
  textTransform: 'uppercase',
  letterSpacing: '0.8px',
  display: 'block',
  mb: 0.75,
};

export const headingText = {
  fontWeight: FONT.weight.bold,
  color: COLOR.textPrimary,
  letterSpacing: '-0.4px',
};

export const subText = {
  color: COLOR.textSecondary,
  lineHeight: 1.6,
};

// ── Gradient text ──────────────────────────────────────────────────────────

export const gradientText = {
  background: GRADIENT.brand,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  display: 'inline-block',
};

// ── Input shared ───────────────────────────────────────────────────────────

export const inputSx = {
  mb: 2.5,
  '& .MuiOutlinedInput-root': {
    bgcolor: COLOR.bgInput,
  },
};

// ── Button primary large ───────────────────────────────────────────────────

export const primaryBtnSx = {
  py: 1.5,
  fontSize: FONT.size.md,
  fontWeight: FONT.weight.bold,
  borderRadius: `${RADIUS.sm}px`,
  background: GRADIENT.brandBtn,
};

// ── Brand logo pill ────────────────────────────────────────────────────────

export const logoPill = {
  width: 48,
  height: 48,
  borderRadius: `${RADIUS.sm}px`,
  background: GRADIENT.brand,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: SHADOW.button,
};

// ── Decorative background orbs ─────────────────────────────────────────────

export const orb = (top, right, bottom, left, size, color) => ({
  position: 'absolute',
  top,
  right,
  bottom,
  left,
  width: size,
  height: size,
  borderRadius: '50%',
  background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
  pointerEvents: 'none',
});
