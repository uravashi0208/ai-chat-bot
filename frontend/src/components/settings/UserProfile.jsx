import React, { useState, useRef } from 'react';
import {
  Box, Typography, IconButton, TextField, Button,
  CircularProgress, alpha,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Edit as EditIcon, Check as CheckIcon, CameraAlt as CameraAltIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { usersApi } from '../../services/api';
import UserAvatar from '../common/UserAvatar';

export default function UserProfile({ onClose }) {
  const { user, updateUser } = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [editingAbout, setEditingAbout] = useState(false);
  const [name, setName] = useState(user?.full_name || '');
  const [about, setAbout] = useState(user?.about || '');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const save = async (field) => {
    setSaving(true);
    try {
      const updates = field === 'name' ? { fullName: name } : { about };
      const updated = await usersApi.updateProfile(updates);
      updateUser(updated);
      if (field === 'name') setEditingName(false);
      else setEditingAbout(false);
    } catch {} finally { setSaving(false); }
  };

  const handleAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // In real app, upload to server; here just update locally
    const reader = new FileReader();
    reader.onload = async ev => {
      try { const updated = await usersApi.updateProfile({ avatarUrl: ev.target.result }); updateUser(updated); }
      catch {}
    };
    reader.readAsDataURL(file);
  };

  return (
    <Box sx={{ display:'flex', flexDirection:'column', height:'100%', bgcolor:'background.sidebar' }}>
      <Box sx={{ px:2, py:1.75, display:'flex', alignItems:'center', gap:1.5, bgcolor:'background.elevated', borderBottom:'1px solid', borderColor:'divider', minHeight:60, flexShrink:0 }}>
        <IconButton size="small" onClick={onClose} sx={{ color:'text.secondary' }}>
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Typography variant="subtitle1" sx={{ fontWeight:700, fontSize:'1.05rem', color:'text.primary' }}>Profile</Typography>
      </Box>

      <Box sx={{ flex:1, overflowY:'auto', pb:4 }}>
        {/* Avatar */}
        <Box sx={{ display:'flex', justifyContent:'center', pt:4, pb:3 }}>
          <Box sx={{ position:'relative', display:'inline-flex' }}>
            <UserAvatar name={user?.full_name} src={user?.avatar_url} size={128} />
            <Box
              onClick={() => fileRef.current.click()}
              sx={{ position:'absolute', bottom:4, right:4, width:36, height:36, borderRadius:'50%', bgcolor:'primary.main', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'0 2px 8px rgba(0,168,132,0.4)', '&:hover':{ bgcolor:'primary.dark' } }}
            >
              <CameraAltIcon sx={{ fontSize:18, color:'#fff' }} />
            </Box>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleAvatar} />
          </Box>
        </Box>

        {/* Phone */}
        <Box sx={{ px:3, mb:0.5 }}>
          <Typography variant="caption" sx={{ color:'text.disabled', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.7px' }}>Phone</Typography>
        </Box>
        <Box sx={{ px:3, pb:2.5 }}>
          <Typography variant="body1" sx={{ color:'text.primary' }}>{user?.phone || '—'}</Typography>
        </Box>

        {/* Name */}
        <Box sx={{ px:3, borderBottom:'1px solid', borderColor:'divider', pb:2.5 }}>
          <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb:0.75 }}>
            <Typography variant="caption" sx={{ color:'primary.main', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.7px' }}>Your name</Typography>
            {!editingName && (
              <IconButton size="small" onClick={() => setEditingName(true)} sx={{ color:'text.secondary' }}>
                <EditIcon sx={{ fontSize:16 }} />
              </IconButton>
            )}
          </Box>
          {editingName ? (
            <Box sx={{ display:'flex', gap:1 }}>
              <TextField fullWidth size="small" value={name} onChange={e => setName(e.target.value)} autoFocus inputProps={{ maxLength:100 }} />
              <IconButton onClick={() => save('name')} disabled={saving} sx={{ color:'primary.main' }}>
                {saving ? <CircularProgress size={18} /> : <CheckIcon />}
              </IconButton>
            </Box>
          ) : (
            <Typography variant="body1" sx={{ color:'text.primary' }}>{user?.full_name}</Typography>
          )}
        </Box>

        {/* About */}
        <Box sx={{ px:3, pt:2.5 }}>
          <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb:0.75 }}>
            <Typography variant="caption" sx={{ color:'primary.main', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.7px' }}>About</Typography>
            {!editingAbout && (
              <IconButton size="small" onClick={() => setEditingAbout(true)} sx={{ color:'text.secondary' }}>
                <EditIcon sx={{ fontSize:16 }} />
              </IconButton>
            )}
          </Box>
          {editingAbout ? (
            <Box sx={{ display:'flex', gap:1 }}>
              <TextField fullWidth size="small" value={about} onChange={e => setAbout(e.target.value)} autoFocus multiline maxRows={3} inputProps={{ maxLength:139 }} />
              <IconButton onClick={() => save('about')} disabled={saving} sx={{ color:'primary.main' }}>
                {saving ? <CircularProgress size={18} /> : <CheckIcon />}
              </IconButton>
            </Box>
          ) : (
            <Typography variant="body1" sx={{ color:'text.primary' }}>{user?.about || 'Hey there! I am using WhatsApp.'}</Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}
