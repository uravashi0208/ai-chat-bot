import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, Box, Typography,
  IconButton, Divider, alpha,
} from '@mui/material';
import { Close as CloseIcon, DoneAll as DoneAllIcon, Schedule as ScheduleIcon } from '@mui/icons-material';
import { format } from 'date-fns';

export default function MessageInfoModal({ message, onClose }) {
  const fmt = d => d ? format(new Date(d), 'MMM d, yyyy · HH:mm') : '—';

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', pb:1 }}>
        <Typography variant="h6" sx={{ fontWeight:700, fontSize:'1rem' }}>Message Info</Typography>
        <IconButton size="small" onClick={onClose} sx={{ color:'text.secondary' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt:0 }}>
        {/* Message preview */}
        <Box sx={{ bgcolor:alpha('#00a884',0.1), border:'1px solid', borderColor:alpha('#00a884',0.25), borderRadius:2.5, px:2, py:1.5, mb:2.5 }}>
          <Typography variant="body2" sx={{ color:'text.primary', wordBreak:'break-word', lineHeight:1.6 }}>
            {message.is_deleted ? '🚫 Deleted message' : message.content || `[${message.type}]`}
          </Typography>
          <Typography variant="caption" sx={{ color:'text.disabled', display:'block', mt:0.5 }}>
            {fmt(message.created_at)}
          </Typography>
        </Box>

        {/* Status rows */}
        <Box sx={{ display:'flex', flexDirection:'column', gap:1.75 }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:1.75 }}>
            <DoneAllIcon sx={{ color:'#8696a0', fontSize:20, flexShrink:0 }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight:600, color:'text.primary', lineHeight:1.3 }}>Sent</Typography>
              <Typography variant="caption" sx={{ color:'text.secondary' }}>{fmt(message.created_at)}</Typography>
            </Box>
          </Box>

          <Divider />

          <Box sx={{ display:'flex', alignItems:'center', gap:1.75 }}>
            <DoneAllIcon sx={{ color: message.delivered_at ? '#8696a0' : alpha('#8696a0',0.3), fontSize:20, flexShrink:0 }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight:600, color: message.delivered_at ? 'text.primary' : 'text.disabled', lineHeight:1.3 }}>Delivered</Typography>
              <Typography variant="caption" sx={{ color:'text.secondary' }}>{message.delivered_at ? fmt(message.delivered_at) : 'Not yet'}</Typography>
            </Box>
          </Box>

          <Divider />

          <Box sx={{ display:'flex', alignItems:'center', gap:1.75 }}>
            <DoneAllIcon sx={{ color: message.read_at ? '#00a884' : alpha('#8696a0',0.3), fontSize:20, flexShrink:0 }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight:600, color: message.read_at ? 'text.primary' : 'text.disabled', lineHeight:1.3 }}>Read</Typography>
              <Typography variant="caption" sx={{ color:'text.secondary' }}>{message.read_at ? fmt(message.read_at) : 'Not yet'}</Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
