import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box, Button, TextField, Typography, CircularProgress,
  Select, MenuItem, InputAdornment, Paper, Fade, Alert,
  Avatar, IconButton,
} from '@mui/material';
import {
  WhatsApp as WhatsAppIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  CameraAlt as CameraAltIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';

const COUNTRIES = [
  { code: 'IN', name: 'India', dial: '+91', flag: '🇮🇳' },
  { code: 'US', name: 'United States', dial: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧' },
  { code: 'PK', name: 'Pakistan', dial: '+92', flag: '🇵🇰' },
  { code: 'BD', name: 'Bangladesh', dial: '+880', flag: '🇧🇩' },
  { code: 'AU', name: 'Australia', dial: '+61', flag: '🇦🇺' },
  { code: 'AE', name: 'UAE', dial: '+971', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', dial: '+966', flag: '🇸🇦' },
  { code: 'SG', name: 'Singapore', dial: '+65', flag: '🇸🇬' },
  { code: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷' },
  { code: 'BR', name: 'Brazil', dial: '+55', flag: '🇧🇷' },
  { code: 'JP', name: 'Japan', dial: '+81', flag: '🇯🇵' },
  { code: 'CN', name: 'China', dial: '+86', flag: '🇨🇳' },
  { code: 'ZA', name: 'South Africa', dial: '+27', flag: '🇿🇦' },
  { code: 'NG', name: 'Nigeria', dial: '+234', flag: '🇳🇬' },
  { code: 'TR', name: 'Turkey', dial: '+90', flag: '🇹🇷' },
  { code: 'PL', name: 'Poland', dial: '+48', flag: '🇵🇱' },
  { code: 'MY', name: 'Malaysia', dial: '+60', flag: '🇲🇾' },
  { code: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦' },
];

// ── Shared card wrapper ──────────────────────────────────────────────────────
function AuthCard({ children }) {
  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(145deg,#0d1117 0%,#0f1923 40%,#111b21 80%,#0a1929 100%)',
      p: 3,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative orbs */}
      <Box sx={{ position:'absolute', top:-120, right:-80, width:380, height:380, borderRadius:'50%', background:'radial-gradient(circle,rgba(0,168,132,0.08) 0%,transparent 70%)', pointerEvents:'none' }} />
      <Box sx={{ position:'absolute', bottom:-150, left:-100, width:440, height:440, borderRadius:'50%', background:'radial-gradient(circle,rgba(0,168,132,0.05) 0%,transparent 70%)', pointerEvents:'none' }} />

      <Fade in timeout={400}>
        <Paper elevation={0} sx={{
          width: '100%',
          maxWidth: 420,
          bgcolor: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 4,
          p: { xs: 3, sm: 4.5 },
          position: 'relative',
          zIndex: 1,
          boxShadow: '0 32px 64px rgba(0,0,0,0.5)',
        }}>
          {/* Logo */}
          <Box sx={{ display:'flex', alignItems:'center', gap:1.5, mb: 4 }}>
            <Box sx={{ width:44, height:44, borderRadius:2, bgcolor:'primary.main', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px rgba(0,168,132,0.4)' }}>
              <WhatsAppIcon sx={{ color:'#fff', fontSize:26 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight:700, color:'#e9edef', letterSpacing:'-0.3px' }}>
              WhatsApp
            </Typography>
          </Box>
          {children}
        </Paper>
      </Fade>
    </Box>
  );
}

// ── Step 1: Phone ─────────────────────────────────────────────────────────────
function StepPhone({ onNext }) {
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    const digits = phone.trim().replace(/[\s\-]/g, '');
    if (!digits || digits.length < 5) { setError('Please enter a valid phone number'); return; }
    const full = country.dial + digits;
    setLoading(true);
    try {
      const data = await authApi.sendOtp(full);
      onNext(full, data.devOtp || null);
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <>
      <Typography variant="h5" sx={{ fontWeight:700, color:'#e9edef', mb:0.75, letterSpacing:'-0.4px' }}>
        Enter your number
      </Typography>
      <Typography variant="body2" sx={{ color:'text.secondary', mb:3.5, lineHeight:1.6 }}>
        We'll send a 6-digit verification code to confirm your number.
      </Typography>

      {error && <Alert severity="error" sx={{ mb:2.5, borderRadius:2, fontSize:'0.8rem' }}>{error}</Alert>}

      {/* Country selector */}
      <Typography variant="caption" sx={{ color:'text.disabled', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.8px', display:'block', mb:0.75 }}>
        Country
      </Typography>
      <Select
        fullWidth
        value={country.code}
        onChange={e => setCountry(COUNTRIES.find(c => c.code === e.target.value))}
        size="small"
        sx={{
          mb: 2,
          borderRadius: 2,
          bgcolor: 'rgba(134,150,160,0.06)',
          color: '#e9edef',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(134,150,160,0.2)' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(134,150,160,0.4)' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
          '& .MuiSvgIcon-root': { color: 'text.secondary' },
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              bgcolor: '#1e2a33',
              border: '1px solid rgba(134,150,160,0.15)',
              borderRadius: 3,
              maxHeight: 260,
            },
          },
        }}
      >
        {COUNTRIES.map(c => (
          <MenuItem key={c.code + c.dial} value={c.code} sx={{ gap: 1.5 }}>
            <span style={{ fontSize: 18 }}>{c.flag}</span>
            <span style={{ flex: 1, fontSize: '0.875rem' }}>{c.name}</span>
            <span style={{ fontSize: '0.8rem', color: '#8696a0', fontWeight: 600 }}>{c.dial}</span>
          </MenuItem>
        ))}
      </Select>

      {/* Phone number */}
      <Typography variant="caption" sx={{ color:'text.disabled', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.8px', display:'block', mb:0.75 }}>
        Phone Number
      </Typography>
      <TextField
        fullWidth
        value={phone}
        onChange={e => setPhone(e.target.value.replace(/[^\d\s\-]/g, ''))}
        placeholder="98765 43210"
        type="tel"
        autoFocus
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Typography sx={{ color:'#e9edef', fontWeight:700, fontSize:'0.95rem', mr:0.5 }}>
                {country.dial}
              </Typography>
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3 }}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
      />

      <Button
        fullWidth
        variant="contained"
        size="large"
        onClick={handleSubmit}
        disabled={loading || !phone.trim()}
        sx={{ py: 1.5, fontSize: '0.95rem', fontWeight: 700 }}
        endIcon={loading ? <CircularProgress size={18} sx={{ color:'inherit' }} /> : <ArrowForwardIcon />}
      >
        {loading ? 'Sending...' : 'Send Verification Code'}
      </Button>
    </>
  );
}

// ── Step 2: OTP ───────────────────────────────────────────────────────────────
function StepOtp({ phone, devOtp, onExistingUser, onNewUser, onBack }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(30);
  const refs = useRef([]);

  useEffect(() => {
    refs.current[0]?.focus();
    if (devOtp) setOtp(devOtp.split(''));
  }, [devOtp]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleChange = (i, val) => {
    const v = val.replace(/\D/g, '').slice(0, 1);
    const next = [...otp]; next[i] = v; setOtp(next);
    if (v && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handlePaste = e => {
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (p.length === 6) { setOtp(p.split('')); refs.current[5]?.focus(); }
  };

  const handleSubmit = async () => {
    const code = otp.join('');
    if (code.length < 6) { setError('Please enter all 6 digits'); return; }
    setError(''); setLoading(true);
    try {
      const data = await authApi.phoneCheck(phone, code);
      if (data.exists) onExistingUser(data.user, data.token);
      else onNewUser(phone);
    } catch (err) {
      setError(err.message || 'Invalid code. Please try again.');
      setOtp(['', '', '', '', '', '']); refs.current[0]?.focus();
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setResending(true); setError('');
    try {
      await authApi.sendOtp(phone);
      setCountdown(30); setOtp(['', '', '', '', '', '']); refs.current[0]?.focus();
    } catch { setError('Failed to resend.'); }
    finally { setResending(false); }
  };

  const filled = otp.join('').length;

  return (
    <>
      <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:3 }}>
        <IconButton size="small" onClick={onBack} sx={{ color:'text.secondary' }}>
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Box>
          <Typography variant="h5" sx={{ fontWeight:700, color:'#e9edef', letterSpacing:'-0.4px' }}>
            Verify your number
          </Typography>
          <Typography variant="body2" sx={{ color:'text.secondary' }}>
            Code sent to <strong style={{ color:'#e9edef' }}>{phone}</strong>
          </Typography>
        </Box>
      </Box>

      {devOtp && (
        <Alert severity="warning" sx={{ mb:2, borderRadius:2, fontSize:'0.8rem' }}>
          🛠 Dev mode — OTP auto-filled: <strong>{devOtp}</strong>
        </Alert>
      )}
      {error && <Alert severity="error" sx={{ mb:2, borderRadius:2, fontSize:'0.8rem' }}>{error}</Alert>}

      {/* OTP boxes */}
      <Box sx={{ display:'flex', gap:1.5, justifyContent:'center', mb:3.5 }} onPaste={handlePaste}>
        {otp.map((digit, i) => (
          <Box
            key={i}
            component="input"
            ref={el => refs.current[i] = el}
            type="tel"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            sx={{
              width: 48, height: 58,
              bgcolor: digit ? 'rgba(0,168,132,0.12)' : 'rgba(134,150,160,0.07)',
              border: `2px solid ${digit ? 'rgba(0,168,132,0.5)' : 'rgba(134,150,160,0.2)'}`,
              borderRadius: 2,
              textAlign: 'center',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#e9edef',
              outline: 'none',
              fontFamily: 'inherit',
              caretColor: '#00a884',
              transition: 'all 0.15s',
              '&:focus': {
                borderColor: '#00a884',
                bgcolor: 'rgba(0,168,132,0.08)',
              },
            }}
          />
        ))}
      </Box>

      <Button
        fullWidth
        variant="contained"
        size="large"
        onClick={handleSubmit}
        disabled={loading || filled < 6}
        sx={{ py: 1.5, fontWeight: 700, mb: 2.5 }}
        endIcon={loading ? <CircularProgress size={18} sx={{ color:'inherit' }} /> : null}
      >
        {loading ? 'Verifying...' : 'Verify Code'}
      </Button>

      <Box sx={{ display:'flex', alignItems:'center', justifyContent:'center', gap:2 }}>
        {countdown > 0 ? (
          <Typography variant="body2" sx={{ color:'text.disabled' }}>
            Resend code in <strong style={{ color:'#8696a0' }}>{countdown}s</strong>
          </Typography>
        ) : (
          <Button size="small" variant="text" onClick={handleResend} disabled={resending} sx={{ color:'primary.light', fontWeight:600, textTransform:'none' }}>
            {resending ? 'Sending…' : 'Resend code'}
          </Button>
        )}
        <Typography sx={{ color:'rgba(134,150,160,0.3)', fontSize:'1.2rem' }}>·</Typography>
        <Button size="small" variant="text" onClick={onBack} sx={{ color:'text.secondary', fontWeight:500, textTransform:'none' }}>
          Change number
        </Button>
      </Box>
    </>
  );
}

// ── Step 3: Profile ────────────────────────────────────────────────────────────
function StepProfile({ phone, onDone }) {
  const [fullName, setFullName] = useState('');
  const [preview, setPreview] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setPreview(ev.target.result); setAvatarUrl(ev.target.result); };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!fullName.trim()) { setError('Please enter your name'); return; }
    setError(''); setLoading(true);
    try {
      const data = await authApi.phoneRegister({ phone, fullName: fullName.trim(), avatarUrl: avatarUrl || undefined });
      onDone(data.user, data.token);
    } catch (err) {
      setError(err.message || 'Failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <>
      <Typography variant="h5" sx={{ fontWeight:700, color:'#e9edef', mb:0.75, letterSpacing:'-0.4px' }}>
        Your profile
      </Typography>
      <Typography variant="body2" sx={{ color:'text.secondary', mb:3.5, lineHeight:1.6 }}>
        Add a name and optional photo so friends can find you.
      </Typography>

      {error && <Alert severity="error" sx={{ mb:2.5, borderRadius:2, fontSize:'0.8rem' }}>{error}</Alert>}

      {/* Avatar picker */}
      <Box sx={{ display:'flex', justifyContent:'center', mb:3.5 }}>
        <Box
          onClick={() => fileRef.current.click()}
          sx={{
            width: 96, height: 96, borderRadius: '50%', cursor:'pointer',
            bgcolor: 'rgba(134,150,160,0.1)',
            border: '2px dashed rgba(134,150,160,0.3)',
            display: 'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
            overflow:'hidden', position:'relative',
            transition: 'all 0.2s',
            '&:hover': { borderColor:'primary.main', bgcolor:'rgba(0,168,132,0.08)' },
          }}
        >
          {preview ? (
            <Box component="img" src={preview} alt="avatar" sx={{ width:'100%', height:'100%', objectFit:'cover' }} />
          ) : (
            <>
              <PersonIcon sx={{ fontSize:36, color:'text.disabled' }} />
              <Typography sx={{ fontSize:'0.6rem', color:'text.disabled', fontWeight:600, letterSpacing:'0.5px', mt:0.5 }}>ADD PHOTO</Typography>
            </>
          )}
          <Box sx={{ position:'absolute', bottom:4, right:4, width:24, height:24, borderRadius:'50%', bgcolor:'primary.main', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <CameraAltIcon sx={{ fontSize:13, color:'#fff' }} />
          </Box>
        </Box>
        <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFile} />
      </Box>

      <TextField
        fullWidth
        label="Your Name"
        value={fullName}
        onChange={e => setFullName(e.target.value)}
        placeholder="Enter your full name"
        autoFocus
        inputProps={{ maxLength: 100 }}
        sx={{ mb: 2.5 }}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
      />

      {/* Phone chip */}
      <Box sx={{ display:'flex', alignItems:'center', gap:1, bgcolor:'rgba(134,150,160,0.06)', borderRadius:2, px:2, py:1.25, mb:3 }}>
        <Typography variant="caption" sx={{ color:'text.disabled' }}>📱</Typography>
        <Typography variant="body2" sx={{ color:'text.secondary' }}>{phone}</Typography>
      </Box>

      <Button
        fullWidth
        variant="contained"
        size="large"
        onClick={handleSubmit}
        disabled={loading || !fullName.trim()}
        sx={{ py: 1.5, fontWeight: 700 }}
        endIcon={loading ? <CircularProgress size={18} sx={{ color:'inherit' }} /> : <ArrowForwardIcon />}
      >
        {loading ? 'Creating account...' : 'Get Started'}
      </Button>
    </>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function PhoneAuthPage() {
  const { loginWithPhone } = useAuth();
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [devOtp, setDevOtp] = useState(null);

  const handlePhoneDone = (ph, dev) => { setPhone(ph); setDevOtp(dev); setStep('otp'); };
  const handleExistingUser = useCallback((user, token) => loginWithPhone(user, token), [loginWithPhone]);
  const handleNewUser = useCallback(() => setStep('profile'), []);
  const handleProfileDone = useCallback((user, token) => loginWithPhone(user, token), [loginWithPhone]);

  return (
    <AuthCard>
      {step === 'phone' && <StepPhone onNext={handlePhoneDone} />}
      {step === 'otp' && <StepOtp phone={phone} devOtp={devOtp} onExistingUser={handleExistingUser} onNewUser={handleNewUser} onBack={() => setStep('phone')} />}
      {step === 'profile' && <StepProfile phone={phone} onDone={handleProfileDone} />}
    </AuthCard>
  );
}
