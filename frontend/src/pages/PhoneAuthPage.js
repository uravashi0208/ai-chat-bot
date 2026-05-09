import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box, Button, TextField, Typography, CircularProgress,
  Select, MenuItem, InputAdornment, Paper, Fade, Alert,
  IconButton,
} from '@mui/material';
import {
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  CameraAlt as CameraAltIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';

// ─── Design tokens (inlined — zero external import risk) ─────────────────────

const C = {
  primary:       '#00B87C',
  accent:        '#0084FF',
  bgCard:        '#FFFFFF',
  bgInput:       '#F7F9FB',
  border:        'rgba(0,0,0,0.08)',
  textPrimary:   '#1A1F2E',
  textSecondary: '#667085',
  textDisabled:  '#A0AABA',
  bubbleGreen:   'rgba(0,184,124,0.06)',
};
const GRAD      = 'linear-gradient(135deg,#00C896 0%,#00A3FF 100%)';
const GRAD_BTN  = 'linear-gradient(135deg,#00B87C 0%,#0084FF 100%)';
const GRAD_HERO = 'linear-gradient(160deg,#E8FFF7 0%,#EFF6FF 50%,#F0F4FF 100%)';

// ─── Countries list ───────────────────────────────────────────────────────────

const COUNTRIES = [
  { code:'IN', name:'India',          dial:'+91',  flag:'🇮🇳' },
  { code:'US', name:'United States',  dial:'+1',   flag:'🇺🇸' },
  { code:'GB', name:'United Kingdom', dial:'+44',  flag:'🇬🇧' },
  { code:'PK', name:'Pakistan',       dial:'+92',  flag:'🇵🇰' },
  { code:'BD', name:'Bangladesh',     dial:'+880', flag:'🇧🇩' },
  { code:'AU', name:'Australia',      dial:'+61',  flag:'🇦🇺' },
  { code:'AE', name:'UAE',            dial:'+971', flag:'🇦🇪' },
  { code:'SA', name:'Saudi Arabia',   dial:'+966', flag:'🇸🇦' },
  { code:'SG', name:'Singapore',      dial:'+65',  flag:'🇸🇬' },
  { code:'DE', name:'Germany',        dial:'+49',  flag:'🇩🇪' },
  { code:'FR', name:'France',         dial:'+33',  flag:'🇫🇷' },
  { code:'BR', name:'Brazil',         dial:'+55',  flag:'🇧🇷' },
  { code:'JP', name:'Japan',          dial:'+81',  flag:'🇯🇵' },
  { code:'CN', name:'China',          dial:'+86',  flag:'🇨🇳' },
  { code:'ZA', name:'South Africa',   dial:'+27',  flag:'🇿🇦' },
  { code:'NG', name:'Nigeria',        dial:'+234', flag:'🇳🇬' },
  { code:'TR', name:'Turkey',         dial:'+90',  flag:'🇹🇷' },
  { code:'PL', name:'Poland',         dial:'+48',  flag:'🇵🇱' },
  { code:'MY', name:'Malaysia',       dial:'+60',  flag:'🇲🇾' },
  { code:'CA', name:'Canada',         dial:'+1',   flag:'🇨🇦' },
];

// ─── Shared sx ────────────────────────────────────────────────────────────────

const sx = {
  heading: { fontWeight:700, color:C.textPrimary, letterSpacing:'-0.4px', mb:0.75 },
  sub:     { color:C.textSecondary, lineHeight:1.6, mb:3.5 },
  label:   { display:'block', color:C.textDisabled, fontWeight:600, fontSize:'0.70rem', textTransform:'uppercase', letterSpacing:'0.8px', mb:0.75 },
  input:   {
    mb:2.5,
    '& .MuiOutlinedInput-root':{
      borderRadius:'8px', backgroundColor:C.bgInput,
      '& fieldset':{ borderColor:C.border },
      '&:hover fieldset':{ borderColor:'#C4C9D4' },
      '&.Mui-focused fieldset':{ borderColor:C.primary, borderWidth:1.5 },
    },
    '& .MuiInputBase-input':{ color:C.textPrimary },
    '& .MuiInputLabel-root':{ color:C.textSecondary },
    '& .MuiInputLabel-root.Mui-focused':{ color:C.primary },
  },
  btn: {
    py:1.5, fontWeight:700, fontSize:'1rem', borderRadius:'8px',
    background:GRAD_BTN,
    boxShadow:'0 4px 16px rgba(0,184,124,0.30)',
    '&:hover':{ background:GRAD_BTN, transform:'translateY(-1px)', boxShadow:'0 6px 24px rgba(0,184,124,0.40)', filter:'brightness(1.05)' },
    '&:active':{ transform:'translateY(0)' },
    '&.Mui-disabled':{ background:'#E5E7EB', color:'#9CA3AF', boxShadow:'none', transform:'none', filter:'none' },
  },
};

// ─── AuthCard wrapper ─────────────────────────────────────────────────────────

function AuthCard({ children }) {
  return (
    <Box sx={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:GRAD_HERO, p:3, position:'relative', overflow:'hidden' }}>
      <Box sx={{ position:'absolute', top:-140, right:-100, width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle,rgba(0,200,150,0.15) 0%,transparent 70%)', pointerEvents:'none' }} />
      <Box sx={{ position:'absolute', bottom:-160, left:-120, width:460, height:460, borderRadius:'50%', background:'radial-gradient(circle,rgba(0,163,255,0.10) 0%,transparent 70%)', pointerEvents:'none' }} />
      <Fade in timeout={350}>
        <Paper elevation={0} sx={{ width:'100%', maxWidth:420, bgcolor:C.bgCard, borderRadius:'16px', p:{ xs:3, sm:4.5 }, boxShadow:'0 8px 32px rgba(0,0,0,0.12)', border:`1px solid ${C.border}`, position:'relative', zIndex:1 }}>
          {/* Logo strip */}
          <Box sx={{ display:'flex', alignItems:'center', gap:1.5, mb:4 }}>
            <Box sx={{ width:48, height:48, borderRadius:'8px', background:GRAD, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px rgba(0,184,124,0.35)', fontSize:26 }}>💬</Box>
            <Box>
              <Box component="span" sx={{ fontWeight:700, fontSize:'1.15rem', background:GRAD, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', letterSpacing:'-0.3px', display:'block' }}>WhatsApp</Box>
              <Box component="span" sx={{ fontSize:'0.68rem', color:C.textDisabled, letterSpacing:'1px' }}>SECURE MESSAGING</Box>
            </Box>
          </Box>
          {children}
        </Paper>
      </Fade>
    </Box>
  );
}

// ─── Step 1 : Phone ───────────────────────────────────────────────────────────

function StepPhone({ onNext }) {
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [phone,   setPhone]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const submit = async () => {
    setError('');
    const digits = phone.trim().replace(/[\s\-]/g, '');
    if (!digits || digits.length < 5) { setError('Please enter a valid phone number.'); return; }
    setLoading(true);
    try {
      const data = await authApi.sendOtp(country.dial + digits);
      onNext(country.dial + digits, data.devOtp || null);
    } catch (e) { setError(e.message || 'Failed to send OTP.'); }
    finally { setLoading(false); }
  };

  return (
    <>
      <Typography variant="h5" sx={sx.heading}>Enter your phone number</Typography>
      <Typography variant="body2" sx={sx.sub}>We'll send a 6-digit code to verify your identity.</Typography>

      {error && <Alert severity="error" sx={{ borderRadius:'8px', mb:2.5, fontSize:'0.8rem' }}>{error}</Alert>}

      <Typography component="span" sx={sx.label}>Country</Typography>
      <Select fullWidth value={country.code} size="small"
        onChange={(e) => setCountry(COUNTRIES.find((c) => c.code === e.target.value))}
        sx={{ mb:2, borderRadius:'8px', bgcolor:C.bgInput, color:C.textPrimary, '& .MuiOutlinedInput-notchedOutline':{ borderColor:C.border }, '&:hover .MuiOutlinedInput-notchedOutline':{ borderColor:'#C4C9D4' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline':{ borderColor:C.primary }, '& .MuiSvgIcon-root':{ color:C.textSecondary } }}
        MenuProps={{ PaperProps:{ sx:{ bgcolor:C.bgCard, border:`1px solid ${C.border}`, borderRadius:'12px', maxHeight:260, boxShadow:'0 8px 32px rgba(0,0,0,0.12)' } } }}
      >
        {COUNTRIES.map((c) => (
          <MenuItem key={c.code+c.dial} value={c.code} sx={{ gap:1.5 }}>
            <span style={{ fontSize:18 }}>{c.flag}</span>
            <span style={{ flex:1, fontSize:'0.875rem', color:C.textPrimary }}>{c.name}</span>
            <span style={{ fontSize:'0.8rem', color:C.textSecondary, fontWeight:600 }}>{c.dial}</span>
          </MenuItem>
        ))}
      </Select>

      <Typography component="span" sx={sx.label}>Phone Number</Typography>
      <TextField fullWidth autoFocus size="small" type="tel" placeholder="98765 43210"
        value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d\s\-]/g, ''))}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        InputProps={{ startAdornment:<InputAdornment position="start"><Typography sx={{ color:C.textPrimary, fontWeight:700, fontSize:'0.95rem', mr:0.5 }}>{country.dial}</Typography></InputAdornment> }}
        sx={{ ...sx.input, mb:3 }}
      />

      <Button fullWidth variant="contained" size="large" disabled={loading || !phone.trim()} onClick={submit}
        endIcon={loading ? <CircularProgress size={18} sx={{ color:'inherit' }} /> : <ArrowForwardIcon />}
        sx={sx.btn}
      >
        {loading ? 'Sending…' : 'Send Verification Code'}
      </Button>

      <Typography variant="caption" sx={{ display:'block', textAlign:'center', mt:2.5, color:C.textDisabled, lineHeight:1.6 }}>
        By continuing you agree to our Terms of Service and Privacy Policy.
      </Typography>
    </>
  );
}

// ─── Step 2 : OTP ─────────────────────────────────────────────────────────────

function StepOtp({ phone, devOtp, onExistingUser, onNewUser, onBack }) {
  const [otp,       setOtp]       = useState(['','','','','','']);
  const [loading,   setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [error,     setError]     = useState('');
  const [countdown, setCountdown] = useState(30);
  const refs = useRef([]);

  useEffect(() => { refs.current[0]?.focus(); if (devOtp) setOtp(devOtp.split('')); }, [devOtp]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const change = (i, v) => {
    const d = v.replace(/\D/g,'').slice(0,1);
    const n = [...otp]; n[i] = d; setOtp(n);
    if (d && i < 5) refs.current[i+1]?.focus();
  };
  const keyDown = (i, e) => { if (e.key === 'Backspace' && !otp[i] && i > 0) refs.current[i-1]?.focus(); };
  const paste = (e) => { const p = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6); if (p.length === 6) { setOtp(p.split('')); refs.current[5]?.focus(); } };

  const submit = async () => {
    const code = otp.join('');
    if (code.length < 6) { setError('Please enter all 6 digits.'); return; }
    setError(''); setLoading(true);
    try {
      const data = await authApi.phoneCheck(phone, code);
      if (data.exists) onExistingUser(data.user, data.token); else onNewUser(phone);
    } catch (e) { setError(e.message || 'Invalid code.'); setOtp(['','','','','','']); refs.current[0]?.focus(); }
    finally { setLoading(false); }
  };

  const resend = async () => {
    setResending(true); setError('');
    try { await authApi.sendOtp(phone); setCountdown(30); setOtp(['','','','','','']); refs.current[0]?.focus(); }
    catch { setError('Failed to resend.'); } finally { setResending(false); }
  };

  return (
    <>
      <Box sx={{ display:'flex', alignItems:'flex-start', gap:1, mb:3 }}>
        <IconButton size="small" onClick={onBack} sx={{ color:C.textSecondary, mt:0.25 }}><ArrowBackIcon fontSize="small" /></IconButton>
        <Box>
          <Typography variant="h5" sx={{ ...sx.heading, mb:0.4 }}>Verify your number</Typography>
          <Typography variant="body2" sx={{ color:C.textSecondary }}>
            Code sent to <Box component="span" sx={{ fontWeight:700, background:GRAD, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>{phone}</Box>
          </Typography>
        </Box>
      </Box>

      {devOtp && <Alert severity="warning" sx={{ borderRadius:'8px', mb:2, fontSize:'0.8rem' }}>🛠 Dev — OTP: <strong>{devOtp}</strong></Alert>}
      {error   && <Alert severity="error"   sx={{ borderRadius:'8px', mb:2.5, fontSize:'0.8rem' }}>{error}</Alert>}

      {/* OTP boxes */}
      <Box sx={{ display:'flex', gap:1.5, justifyContent:'center', mb:3.5 }} onPaste={paste}>
        {otp.map((digit, i) => (
          <Box key={i} component="input" ref={(el) => { refs.current[i] = el; }}
            type="tel" inputMode="numeric" maxLength={1} value={digit}
            onChange={(e) => change(i, e.target.value)}
            onKeyDown={(e) => keyDown(i, e)}
            sx={{
              width:50, height:60, textAlign:'center', fontSize:'1.5rem', fontWeight:700,
              fontFamily:'inherit', color:C.textPrimary, caretColor:C.primary, outline:'none',
              border:`2px solid ${digit ? C.primary : C.border}`,
              borderRadius:'8px', bgcolor:digit ? C.bubbleGreen : C.bgInput,
              transition:'all 0.15s', cursor:'text',
              '&:focus':{ borderColor:C.primary, bgcolor:C.bubbleGreen, boxShadow:'0 0 0 3px rgba(0,184,124,0.15)' },
            }}
          />
        ))}
      </Box>

      <Button fullWidth variant="contained" size="large" disabled={loading || otp.join('').length < 6} onClick={submit}
        endIcon={loading ? <CircularProgress size={18} sx={{ color:'inherit' }} /> : null}
        sx={{ ...sx.btn, mb:2.5 }}
      >
        {loading ? 'Verifying…' : 'Verify Code'}
      </Button>

      <Box sx={{ display:'flex', alignItems:'center', justifyContent:'center', gap:2 }}>
        {countdown > 0
          ? <Typography variant="body2" sx={{ color:C.textDisabled }}>Resend in <Box component="span" sx={{ fontWeight:700, color:C.primary }}>{countdown}s</Box></Typography>
          : <Button size="small" variant="text" onClick={resend} disabled={resending} sx={{ color:C.primary, fontWeight:600, textTransform:'none', fontSize:'0.85rem' }}>{resending ? 'Sending…' : 'Resend code'}</Button>
        }
        <Box component="span" sx={{ color:C.border, fontSize:'1.2rem' }}>·</Box>
        <Button size="small" variant="text" onClick={onBack} sx={{ color:C.textSecondary, fontWeight:500, textTransform:'none', fontSize:'0.85rem' }}>Change number</Button>
      </Box>
    </>
  );
}

// ─── Step 3 : Profile ─────────────────────────────────────────────────────────

function StepProfile({ phone, onDone }) {
  const [fullName, setFullName] = useState('');
  const [preview,  setPreview]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const fileRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader(); r.onload = (ev) => setPreview(ev.target.result); r.readAsDataURL(f);
  };

  const submit = async () => {
    if (!fullName.trim()) { setError('Please enter your name.'); return; }
    setError(''); setLoading(true);
    try {
      const data = await authApi.phoneRegister({ phone, fullName:fullName.trim(), avatarUrl:preview||undefined });
      onDone(data.user, data.token);
    } catch (e) { setError(e.message || 'Registration failed.'); } finally { setLoading(false); }
  };

  return (
    <>
      <Typography variant="h5" sx={sx.heading}>Set up your profile</Typography>
      <Typography variant="body2" sx={sx.sub}>Add your name so friends can recognise you. Photo is optional.</Typography>

      {error && <Alert severity="error" sx={{ borderRadius:'8px', mb:2.5, fontSize:'0.8rem' }}>{error}</Alert>}

      {/* Avatar */}
      <Box sx={{ display:'flex', justifyContent:'center', mb:3.5 }}>
        <Box onClick={() => fileRef.current.click()}
          sx={{ width:96, height:96, borderRadius:'50%', cursor:'pointer', border:`2px dashed ${preview ? C.primary : C.border}`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', overflow:'hidden', position:'relative', bgcolor:preview?'transparent':C.bgInput, transition:'all 0.2s', '&:hover':{ borderColor:C.primary, bgcolor:C.bubbleGreen } }}
        >
          {preview
            ? <Box component="img" src={preview} alt="avatar" sx={{ width:'100%', height:'100%', objectFit:'cover' }} />
            : <><PersonIcon sx={{ fontSize:38, color:C.textDisabled }} /><Typography sx={{ fontSize:'0.6rem', color:C.textDisabled, fontWeight:600, letterSpacing:'0.5px', mt:0.5 }}>ADD PHOTO</Typography></>
          }
          <Box sx={{ position:'absolute', bottom:4, right:4, width:26, height:26, borderRadius:'50%', background:GRAD, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(0,184,124,0.4)' }}>
            <CameraAltIcon sx={{ fontSize:14, color:'#fff' }} />
          </Box>
        </Box>
        <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFile} />
      </Box>

      <Typography component="span" sx={sx.label}>Your Name</Typography>
      <TextField fullWidth autoFocus size="small" placeholder="Enter your full name"
        value={fullName} onChange={(e) => setFullName(e.target.value)}
        inputProps={{ maxLength:100 }} onKeyDown={(e) => e.key === 'Enter' && submit()}
        sx={{ ...sx.input, mb:2 }}
      />

      <Box sx={{ display:'flex', alignItems:'center', gap:1, bgcolor:C.bubbleGreen, border:'1px solid rgba(0,184,124,0.18)', borderRadius:'8px', px:2, py:1.25, mb:3 }}>
        <Typography variant="caption" sx={{ fontSize:'1rem' }}>📱</Typography>
        <Typography variant="body2" sx={{ color:C.textSecondary }}>{phone}</Typography>
      </Box>

      <Button fullWidth variant="contained" size="large" disabled={loading || !fullName.trim()} onClick={submit}
        endIcon={loading ? <CircularProgress size={18} sx={{ color:'inherit' }} /> : <ArrowForwardIcon />}
        sx={sx.btn}
      >
        {loading ? 'Creating account…' : 'Get Started'}
      </Button>
    </>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

const STEP = { PHONE:'phone', OTP:'otp', PROFILE:'profile' };

export default function PhoneAuthPage() {
  const { loginWithPhone } = useAuth();
  const [step,   setStep]   = useState(STEP.PHONE);
  const [phone,  setPhone]  = useState('');
  const [devOtp, setDevOtp] = useState(null);

  const onPhoneDone    = useCallback((ph, dev) => { setPhone(ph); setDevOtp(dev); setStep(STEP.OTP); }, []);
  const onExistingUser = useCallback((u, t) => loginWithPhone(u, t), [loginWithPhone]);
  const onNewUser      = useCallback(() => setStep(STEP.PROFILE), []);
  const onProfileDone  = useCallback((u, t) => loginWithPhone(u, t), [loginWithPhone]);

  return (
    <AuthCard>
      {step === STEP.PHONE   && <StepPhone   onNext={onPhoneDone} />}
      {step === STEP.OTP     && <StepOtp     phone={phone} devOtp={devOtp} onExistingUser={onExistingUser} onNewUser={onNewUser} onBack={() => setStep(STEP.PHONE)} />}
      {step === STEP.PROFILE && <StepProfile phone={phone} onDone={onProfileDone} />}
    </AuthCard>
  );
}
