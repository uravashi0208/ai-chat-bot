import React, { useState } from 'react';
import {
  Box, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, IconButton, Avatar, alpha,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Star as StarIcon,
  Campaign as BroadcastIcon,
  Devices as DevicesIcon,
  ManageAccounts as AccountIcon,
  Lock as PrivacyIcon,
  Chat as ChatIcon,
  Notifications as NotifIcon,
  Storage as StorageIcon,
  PersonAdd as InviteIcon,
  Help as HelpIcon,
  ChevronRight as ChevronIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../common/UserAvatar';
import UserProfile from './UserProfile';
import StarredMessages from './submodules/StarredMessages';
import BroadcastMessages from './submodules/BroadcastMessages';
import LinkedDevices from './submodules/LinkedDevices';
import AccountSettings from './submodules/AccountSettings';
import PrivacySettings from './submodules/PrivacySettings';
import ChatSettings from './submodules/ChatSettings';
import NotificationSettings from './submodules/NotificationSettings';
import StorageData from './submodules/StorageData';
import InviteFriend from './submodules/InviteFriend';
import HelpFeedback from './submodules/HelpFeedback';

const MENU_SECTIONS = [
  {
    items: [
      { id:'starred', label:'Starred messages', desc:'View all starred messages', icon:<StarIcon/>, color:'#f59e0b' },
      { id:'broadcast', label:'Broadcast messages', desc:'Send to multiple contacts', icon:<BroadcastIcon/>, color:'#3b82f6' },
    ],
  },
  {
    items: [
      { id:'linked', label:'Linked devices', desc:'Manage your linked devices', icon:<DevicesIcon/>, color:'#10b981' },
    ],
  },
  {
    items: [
      { id:'account', label:'Account', desc:'Privacy, security, change number', icon:<AccountIcon/>, color:'#6366f1' },
      { id:'privacy', label:'Privacy', desc:'Last seen, profile photo, status', icon:<PrivacyIcon/>, color:'#7c3aed' },
      { id:'chats', label:'Chats', desc:'Theme, wallpaper, chat backup', icon:<ChatIcon/>, color:'#0ea5e9' },
      { id:'notifications', label:'Notifications', desc:'Message, group & call tones', icon:<NotifIcon/>, color:'#ec4899' },
      { id:'storage', label:'Storage and data', desc:'Network usage, auto-download', icon:<StorageIcon/>, color:'#64748b' },
    ],
  },
  {
    items: [
      { id:'invite', label:'Invite a friend', desc:'Share WhatsApp with friends', icon:<InviteIcon/>, color:'#00a884' },
      { id:'help', label:'Help', desc:'FAQ, contact us, privacy policy', icon:<HelpIcon/>, color:'#f97316' },
    ],
  },
];

const SUB_MAP = {
  starred: StarredMessages,
  broadcast: BroadcastMessages,
  linked: LinkedDevices,
  account: AccountSettings,
  privacy: PrivacySettings,
  chats: ChatSettings,
  notifications: NotificationSettings,
  storage: StorageData,
  invite: InviteFriend,
  help: HelpFeedback,
};

export default function Settings({ onClose }) {
  const { user } = useAuth();
  const [active, setActive] = useState(null);
  const [showProfile, setShowProfile] = useState(false);

  if (showProfile) return <UserProfile onClose={() => setShowProfile(false)} />;

  if (active) {
    const Sub = SUB_MAP[active];
    return Sub ? <Sub onClose={() => setActive(null)} /> : null;
  }

  return (
    <Box sx={{ display:'flex', flexDirection:'column', height:'100%', bgcolor:'background.sidebar' }}>
      {/* Header */}
      <Box sx={{ px:2, py:1.75, display:'flex', alignItems:'center', gap:1.5, bgcolor:'background.elevated', borderBottom:'1px solid', borderColor:'divider', minHeight:60, flexShrink:0 }}>
        <IconButton size="small" onClick={onClose} sx={{ color:'text.secondary' }}>
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Typography variant="subtitle1" sx={{ fontWeight:700, fontSize:'1.05rem', color:'text.primary' }}>
          Settings
        </Typography>
      </Box>

      <Box sx={{ flex:1, overflowY:'auto' }}>
        {/* Profile block */}
        <ListItemButton
          onClick={() => setShowProfile(true)}
          sx={{ px:2, py:2, gap:2, borderBottom:'1px solid', borderColor:'divider', '&:hover':{ bgcolor:alpha('#8696a0',0.06) } }}
        >
          <UserAvatar name={user?.full_name} src={user?.avatar_url} size={52} />
          <Box sx={{ minWidth:0 }}>
            <Typography variant="subtitle1" noWrap sx={{ fontWeight:700, fontSize:'1.0rem', color:'text.primary' }}>
              {user?.full_name}
            </Typography>
            <Typography variant="body2" noWrap sx={{ color:'text.secondary', fontSize:'0.83rem' }}>
              {user?.about || 'Hey there! I am using WhatsApp.'}
            </Typography>
          </Box>
        </ListItemButton>

        {/* Menu sections */}
        {MENU_SECTIONS.map((section, si) => (
          <Box key={si}>
            <List disablePadding>
              {section.items.map(item => (
                <ListItemButton
                  key={item.id}
                  onClick={() => setActive(item.id)}
                  sx={{ px:2, py:1.25, gap:1.75, borderBottom:'1px solid', borderColor:'divider' }}
                >
                  <Box sx={{
                    width:38, height:38, borderRadius:2.5, flexShrink:0,
                    bgcolor: alpha(item.color, 0.12),
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    <Box sx={{ color:item.color, display:'flex' }}>{item.icon}</Box>
                  </Box>
                  <Box sx={{ flex:1, minWidth:0 }}>
                    <Typography variant="body2" sx={{ fontWeight:600, color:'text.primary', fontSize:'0.9rem' }}>
                      {item.label}
                    </Typography>
                    <Typography variant="caption" noWrap sx={{ color:'text.secondary' }}>
                      {item.desc}
                    </Typography>
                  </Box>
                  <ChevronIcon sx={{ color:'text.disabled', fontSize:18, flexShrink:0 }} />
                </ListItemButton>
              ))}
            </List>
          </Box>
        ))}

        <Box sx={{ py:3, textAlign:'center' }}>
          <Typography variant="caption" sx={{ color:'text.disabled' }}>WhatsApp v2.0.0</Typography>
        </Box>
      </Box>
    </Box>
  );
}
