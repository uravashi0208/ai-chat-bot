import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box, IconButton, InputBase, Tooltip, alpha,
  CircularProgress, Typography, LinearProgress,
} from '@mui/material';
import {
  SentimentSatisfiedAlt as EmojiIcon,
  AttachFile as AttachIcon,
  Send as SendIcon,
  Mic as MicIcon,
  Close as CloseIcon,
  Reply as ReplyIcon,
  Image as ImageIcon,
  Videocam as VideoIcon,
  Description as DocIcon,
  CameraAlt as CameraIcon,
} from '@mui/icons-material';
import * as socketService from '../../services/socket';
import { useChatPrefs } from '../../context/ChatPrefsContext';
import { mediaApi } from '../../services/api';

const EMOJI_CATEGORIES = [
  { id:'recent', label:'⏱', emojis:['😂','❤️','👍','🔥','😭','🙏','😍','🥺','✨','💯','😊','🎉'] },
  { id:'faces', label:'😀', emojis:['😀','😁','😂','🤣','😊','😇','🥰','😍','🤩','😎','🥳','😏','😒','😞','😔','😟','😕','😣','😫','😩','🥱','😴','😌','😛','😜','🤤','😷','🤒','🤕','🥵','🥶','🥴','😵','🤯','🤠','🥸','🤓','🧐'] },
  { id:'gestures', label:'👋', emojis:['👋','🤚','✋','👌','✌','🤞','👍','👎','✊','👊','👏','🙌','🫶','🤝','🙏','💪','👀','👅','👄'] },
  { id:'hearts', label:'❤️', emojis:['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','💌','💋','💯','🌹'] },
  { id:'nature', label:'🌿', emojis:['🌸','🌺','🌻','🌹','🌷','🌱','🌿','🍀','🍁','🍂','🌾','🌵','🍄','🌊','🌈','⭐','🌙','☀️','❄️','💧','🔥','🌍','💫','✨','☄️'] },
  { id:'food', label:'🍕', emojis:['🍕','🍔','🍟','🌮','🌯','🍜','🍣','🍱','🥗','🍰','🎂','🧁','🍫','🍬','🍭','☕','🧋','🍺','🥂','🍾'] },
  { id:'fun', label:'🎮', emojis:['🎮','🕹','🎲','🎯','🏆','🥇','🎵','🎶','🎤','🎧','🎬','📸','💻','📱','🔭','💡','🔑','🎁','🎈','🎉','🪄'] },
];

const ATTACH_OPTIONS = [
  { id:'photo', label:'Photo', icon:<ImageIcon sx={{ fontSize:20 }}/>, accept:'image/*', color:'#7c3aed', bg:alpha('#7c3aed',0.15), type:'image' },
  { id:'video', label:'Video', icon:<VideoIcon sx={{ fontSize:20 }}/>, accept:'video/*', color:'#2563eb', bg:alpha('#2563eb',0.15), type:'video' },
  { id:'document', label:'Document', icon:<DocIcon sx={{ fontSize:20 }}/>, accept:'.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv', color:'#0d9488', bg:alpha('#0d9488',0.15), type:'document' },
  { id:'camera', label:'Camera', icon:<CameraIcon sx={{ fontSize:20 }}/>, accept:'image/*', color:'#db2777', bg:alpha('#db2777',0.15), type:'image', capture:true },
];

function fmtSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
  return (bytes/(1024*1024)).toFixed(1) + ' MB';
}

function MediaPreviewModal({ file, preview, onCancel, onSend, uploading, progress, caption, onCaption }) {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');

  return (
    <Box sx={{
      position:'fixed', inset:0, bgcolor:'rgba(0,0,0,0.85)', backdropFilter:'blur(8px)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:1300, p:2,
    }}>
      <Box sx={{
        bgcolor:'background.elevated', borderRadius:3, overflow:'hidden',
        maxWidth:480, width:'100%',
        border:'1px solid', borderColor:'divider',
        boxShadow:'0 24px 64px rgba(0,0,0,0.7)',
      }}>
        {/* Header */}
        <Box sx={{ px:2, py:1.5, display:'flex', alignItems:'center', gap:1.5, borderBottom:'1px solid', borderColor:'divider' }}>
          <IconButton size="small" onClick={onCancel} sx={{ color:'text.secondary' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
          <Typography variant="subtitle2" sx={{ fontWeight:600, flex:1 }}>
            {isImage ? '📷 Photo' : isVideo ? '🎬 Video' : '📄 Document'}
          </Typography>
          <Typography variant="caption" sx={{ color:'text.disabled' }}>{fmtSize(file.size)}</Typography>
        </Box>

        {/* Preview */}
        <Box sx={{ bgcolor:alpha('#000',0.4), display:'flex', alignItems:'center', justifyContent:'center', minHeight:200, maxHeight:360, overflow:'hidden' }}>
          {isImage && <Box component="img" src={preview} sx={{ maxWidth:'100%', maxHeight:360, objectFit:'contain' }} />}
          {isVideo && <Box component="video" src={preview} controls sx={{ maxWidth:'100%', maxHeight:360 }} />}
          {!isImage && !isVideo && (
            <Box sx={{ display:'flex', flexDirection:'column', alignItems:'center', gap:1.5, py:4 }}>
              <Typography sx={{ fontSize:'3rem' }}>📄</Typography>
              <Typography variant="body2" sx={{ color:'text.secondary', px:3, textAlign:'center', wordBreak:'break-all' }}>{file.name}</Typography>
            </Box>
          )}
        </Box>

        {/* Caption */}
        <Box sx={{ px:2, py:1.5, borderTop:'1px solid', borderColor:'divider' }}>
          <InputBase
            fullWidth
            placeholder="Add a caption..."
            value={caption}
            onChange={e => onCaption(e.target.value)}
            inputProps={{ maxLength:500 }}
            sx={{ fontSize:'0.9rem', color:'text.primary', '& input::placeholder':{ color:'text.disabled' } }}
          />
        </Box>

        {/* Progress */}
        {uploading && (
          <Box sx={{ px:2, pb:1 }}>
            <LinearProgress variant="determinate" value={progress} sx={{ borderRadius:1, bgcolor:alpha('#00a884',0.15), '& .MuiLinearProgress-bar':{ bgcolor:'primary.main' } }} />
            <Typography variant="caption" sx={{ color:'text.secondary', mt:0.5, display:'block', textAlign:'center' }}>{progress}%</Typography>
          </Box>
        )}

        {/* Actions */}
        <Box sx={{ display:'flex', gap:1.5, px:2, pb:2 }}>
          <Box
            component="button"
            onClick={onCancel}
            disabled={uploading}
            sx={{ flex:1, py:1.25, borderRadius:2, border:'1px solid', borderColor:'divider', bgcolor:'transparent', color:'text.secondary', cursor:'pointer', fontSize:'0.9rem', fontWeight:600, fontFamily:'inherit', '&:hover':{ bgcolor:alpha('#8696a0',0.08) }, '&:disabled':{ opacity:0.4 } }}
          >
            Cancel
          </Box>
          <Box
            component="button"
            onClick={onSend}
            disabled={uploading}
            sx={{ flex:2, py:1.25, borderRadius:2, border:'none', background:'linear-gradient(135deg,#00a884,#00cf9e)', color:'#fff', cursor:'pointer', fontSize:'0.9rem', fontWeight:700, fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:1, '&:hover':{ opacity:0.9 }, '&:disabled':{ opacity:0.5 } }}
          >
            {uploading ? <><CircularProgress size={16} sx={{ color:'#fff' }} /> Uploading...</> : <><SendIcon sx={{ fontSize:18 }} /> Send</>}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default function MessageInput({ onSend, replyTo, onCancelReply, conversationId }) {
  const { prefs } = useChatPrefs();
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [activeCategory, setActiveCategory] = useState('recent');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  const inputRef = useRef(null);
  const typingTimerRef = useRef(null);
  const isTypingRef = useRef(false);
  const fileInputRef = useRef(null);
  const attachRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordTimerRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, [conversationId]);

  useEffect(() => {
    if (!showAttach) return;
    const handler = e => { if (attachRef.current && !attachRef.current.contains(e.target)) setShowAttach(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showAttach]);

  useEffect(() => () => { if (mediaPreview) URL.revokeObjectURL(mediaPreview); }, [mediaPreview]);

  const handleTyping = useCallback(() => {
    if (!isTypingRef.current) { isTypingRef.current = true; socketService.startTyping(conversationId); }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => { isTypingRef.current = false; socketService.stopTyping(conversationId); }, 1500);
  }, [conversationId]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend({ content: trimmed, type: 'text' });
    setText('');
    setShowEmoji(false);
    clearTimeout(typingTimerRef.current);
    isTypingRef.current = false;
    socketService.stopTyping(conversationId);
    inputRef.current?.focus();
  }, [text, onSend, conversationId]);

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey && prefs?.enter_is_send) { e.preventDefault(); handleSend(); }
  };

  const handleAttach = opt => {
    setShowAttach(false);
    if (fileInputRef.current) {
      fileInputRef.current.accept = opt.accept;
      if (opt.capture) fileInputRef.current.setAttribute('capture', 'environment');
      else fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };

  const handleFileChange = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
    setCaption('');
    setUploadProgress(0);
    e.target.value = '';
  };

  const handleMediaSend = async () => {
    if (!mediaFile || uploading) return;
    setUploading(true);
    try {
      const result = await mediaApi.uploadMedia(mediaFile, pct => setUploadProgress(pct));
      onSend({ content: caption.trim() || null, type: result.type, mediaUrl: result.url });
      URL.revokeObjectURL(mediaPreview);
      setMediaFile(null); setMediaPreview(null); setCaption('');
    } catch (err) { alert('Upload failed: ' + err.message); }
    finally { setUploading(false); setUploadProgress(0); }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
        try { const res = await mediaApi.uploadMedia(file, () => {}); onSend({ content: null, type: 'audio', mediaUrl: res.url }); }
        catch (err) { alert('Voice upload failed: ' + err.message); }
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true); setRecordSeconds(0);
      recordTimerRef.current = setInterval(() => setRecordSeconds(s => s + 1), 1000);
    } catch (err) { alert('Microphone access denied: ' + err.message); }
  };

  const stopRecording = () => {
    clearInterval(recordTimerRef.current);
    setIsRecording(false); setRecordSeconds(0);
    if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current.stop();
  };

  const cancelRecording = () => {
    clearInterval(recordTimerRef.current);
    setIsRecording(false); setRecordSeconds(0);
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current.onstop = () => {};
      mediaRecorderRef.current.stop();
    }
  };

  const fmtTime = s => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  return (
    <Box sx={{ flexShrink:0, bgcolor:'background.elevated', borderTop:'1px solid', borderColor:'divider' }}>

      {/* Reply preview */}
      {replyTo && (
        <Box sx={{ display:'flex', alignItems:'center', gap:1.5, px:2, py:1, borderBottom:'1px solid', borderColor:'divider', bgcolor:alpha('#00a884',0.06) }}>
          <ReplyIcon sx={{ color:'primary.main', fontSize:18, flexShrink:0 }} />
          <Box sx={{ flex:1, minWidth:0 }}>
            <Typography variant="caption" sx={{ color:'primary.light', fontWeight:700, display:'block' }}>
              {replyTo.sender?.full_name}
            </Typography>
            <Typography variant="caption" noWrap sx={{ color:'text.secondary' }}>
              {replyTo.type !== 'text' ? `📎 ${replyTo.type}` : replyTo.content}
            </Typography>
          </Box>
          <IconButton size="small" onClick={onCancelReply} sx={{ color:'text.secondary', width:24, height:24 }}>
            <CloseIcon sx={{ fontSize:16 }} />
          </IconButton>
        </Box>
      )}

      {/* Emoji panel */}
      {showEmoji && (
        <Box sx={{ bgcolor:'background.paper', borderTop:'1px solid', borderColor:'divider' }}>
          {/* Category tabs */}
          <Box sx={{ display:'flex', px:1, pt:1, gap:0.5 }}>
            {EMOJI_CATEGORIES.map(cat => (
              <Box
                key={cat.id}
                component="button"
                onClick={() => setActiveCategory(cat.id)}
                sx={{
                  width:36, height:32, border:'none', cursor:'pointer', fontSize:'1rem',
                  borderRadius:1.5, bgcolor: activeCategory === cat.id ? alpha('#00a884',0.2) : 'transparent',
                  border: activeCategory === cat.id ? `1px solid ${alpha('#00a884',0.4)}` : '1px solid transparent',
                  transition:'all 0.15s',
                  '&:hover':{ bgcolor: alpha('#8696a0',0.1) },
                }}
              >
                {cat.label}
              </Box>
            ))}
          </Box>
          {/* Emoji grid */}
          <Box sx={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,36px)', gap:0.25, px:1.25, py:1, maxHeight:180, overflowY:'auto' }}>
            {EMOJI_CATEGORIES.find(c => c.id === activeCategory)?.emojis.map(e => (
              <Box
                key={e}
                component="button"
                onClick={() => { setText(p => p + e); inputRef.current?.focus(); }}
                sx={{
                  width:36, height:36, fontSize:'1.3rem', cursor:'pointer', border:'none',
                  bgcolor:'transparent', borderRadius:1.5, display:'flex', alignItems:'center', justifyContent:'center',
                  transition:'all 0.12s',
                  '&:hover':{ transform:'scale(1.25)', bgcolor: alpha('#8696a0',0.1) },
                }}
              >
                {e}
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Recording bar */}
      {isRecording && (
        <Box sx={{ display:'flex', alignItems:'center', gap:1.5, px:2, py:1.25, bgcolor:alpha('#ef4444',0.08), borderTop:'1px solid', borderColor:alpha('#ef4444',0.2) }}>
          <Box sx={{ width:8, height:8, borderRadius:'50%', bgcolor:'error.main', animation:'pulse 1s infinite', '@keyframes pulse':{ '0%,100%':{ opacity:1 }, '50%':{ opacity:0.3 } } }} />
          <Typography variant="body2" sx={{ color:'text.primary', fontWeight:600 }}>
            Recording… {fmtTime(recordSeconds)}
          </Typography>
          <Box sx={{ flex:1 }} />
          <IconButton size="small" onClick={cancelRecording} sx={{ color:'error.main' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      {/* Main input row */}
      <Box sx={{ display:'flex', alignItems:'center', gap:0.75, px:1.5, py:1 }}>
        <Tooltip title="Emoji">
          <IconButton
            size="small"
            onClick={() => { setShowEmoji(p => !p); setShowAttach(false); }}
            sx={{ color: showEmoji ? 'primary.main' : 'text.secondary', transition:'color 0.2s' }}
          >
            <EmojiIcon />
          </IconButton>
        </Tooltip>

        {/* Attach */}
        <Box ref={attachRef} sx={{ position:'relative' }}>
          <Tooltip title="Attach">
            <IconButton
              size="small"
              onClick={() => { setShowAttach(p => !p); setShowEmoji(false); }}
              sx={{ color: showAttach ? 'primary.main' : 'text.secondary', transition:'color 0.2s' }}
            >
              <AttachIcon />
            </IconButton>
          </Tooltip>
          {showAttach && (
            <Box sx={{
              position:'absolute', bottom:'calc(100% + 8px)', left:0,
              display:'flex', flexDirection:'column', gap:0.75,
              bgcolor:'background.elevated', border:'1px solid', borderColor:'divider',
              borderRadius:3, p:1.25, boxShadow:5, zIndex:20, minWidth:140,
            }}>
              {ATTACH_OPTIONS.map(opt => (
                <Box
                  key={opt.id}
                  component="button"
                  onClick={() => handleAttach(opt)}
                  sx={{
                    display:'flex', alignItems:'center', gap:1.25, px:1.25, py:0.75,
                    border:'none', bgcolor:'transparent', cursor:'pointer', borderRadius:2,
                    color:'text.primary', fontFamily:'inherit', fontSize:'0.875rem',
                    transition:'background-color 0.15s',
                    '&:hover':{ bgcolor: alpha('#8696a0',0.1) },
                  }}
                >
                  <Box sx={{ width:34, height:34, borderRadius:2, bgcolor:opt.bg, color:opt.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {opt.icon}
                  </Box>
                  {opt.label}
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* Text input */}
        <Box sx={{
          flex:1, bgcolor:alpha('#8696a0',0.08), borderRadius:3.5, px:2, py:0.75,
          border:'1px solid transparent', transition:'all 0.2s',
          '&:focus-within':{ bgcolor:alpha('#8696a0',0.12), borderColor:alpha('#00a884',0.3) },
        }}>
          <InputBase
            inputRef={inputRef}
            multiline
            maxRows={5}
            value={text}
            onChange={e => { setText(e.target.value); handleTyping(); }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message"
            sx={{ width:'100%', fontSize:'0.9375rem', color:'text.primary', '& textarea::placeholder':{ color:'text.disabled' }, lineHeight:1.5 }}
          />
        </Box>

        {/* Send / Mic */}
        <Box
          component="button"
          onClick={text.trim() ? handleSend : isRecording ? stopRecording : startRecording}
          sx={{
            width:42, height:42, borderRadius:'50%', border:'none', cursor:'pointer',
            background: 'linear-gradient(135deg,#00a884,#00cf9e)',
            display:'flex', alignItems:'center', justifyContent:'center',
            flexShrink:0, boxShadow:'0 2px 8px rgba(0,168,132,0.35)',
            transition:'all 0.2s',
            '&:hover':{ transform:'scale(1.08)', boxShadow:'0 4px 16px rgba(0,168,132,0.45)' },
            '&:active':{ transform:'scale(0.95)' },
          }}
        >
          {text.trim() || isRecording
            ? <SendIcon sx={{ color:'#fff', fontSize:20, ml:0.25 }} />
            : <MicIcon sx={{ color:'#fff', fontSize:20 }} />
          }
        </Box>
      </Box>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" style={{ display:'none' }} onChange={handleFileChange} />

      {/* Media preview modal */}
      {mediaFile && (
        <MediaPreviewModal
          file={mediaFile} preview={mediaPreview} caption={caption} onCaption={setCaption}
          uploading={uploading} progress={uploadProgress}
          onCancel={() => { if (!uploading) { URL.revokeObjectURL(mediaPreview); setMediaFile(null); setMediaPreview(null); } }}
          onSend={handleMediaSend}
        />
      )}
    </Box>
  );
}
