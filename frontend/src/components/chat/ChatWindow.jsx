import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { messagesApi } from '../../services/api';
import { getSocket } from '../../services/socket';
import * as socketService from '../../services/socket';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import MessageInfoModal from './MessageInfoModal';

export default function ChatWindow({ conversation, onBack }) {
  const { user } = useAuth();
  const { getTypingUsersForConversation } = useChat();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [msgInfo, setMsgInfo] = useState(null);

  const loadMessages = useCallback(async (before = undefined) => {
    try {
      const rawData = await messagesApi.getMessages(conversation.id, 50, before);
      const data = rawData.map(m => ({ ...m, sender_id: m.sender_id || m.sender?.id }));
      if (before) setMessages(prev => [...data, ...prev]);
      else setMessages(data);
      setHasMore(data.length === 50);
    } catch (err) {
      console.error('Failed to load messages', err);
    } finally { setLoading(false); }
  }, [conversation.id]);

  useEffect(() => {
    setLoading(true);
    setMessages([]);
    setReplyTo(null);
    loadMessages();
    socketService.joinConversation(conversation.id);
    socketService.markConversationRead(conversation.id);
  }, [conversation.id, loadMessages]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onNewMessage = ({ conversationId, message }) => {
      if (conversationId !== conversation.id) return;
      const normalized = { ...message, sender_id: message.sender_id || message.sender?.id };
      setMessages(prev => {
        if (prev.find(m => m.id === normalized.id)) return prev;
        const tempIndex = prev.findIndex(m =>
          typeof m.id === 'string' && m.id.startsWith('temp-') &&
          m.sender_id === normalized.sender_id && m.content === normalized.content
        );
        if (tempIndex !== -1) {
          const updated = [...prev]; updated[tempIndex] = normalized; return updated;
        }
        return [...prev, normalized];
      });
      socketService.markConversationRead(conversation.id);
    };

    const onEdited = ({ conversationId, message }) => {
      if (conversationId !== conversation.id) return;
      setMessages(prev => prev.map(m => m.id === message.id ? { ...m, ...message } : m));
    };

    const onDeleted = ({ conversationId, messageId }) => {
      if (conversationId !== conversation.id) return;
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, type:'deleted', content:null, is_deleted:true } : m));
    };

    const onConversationRead = ({ conversationId, userId }) => {
      if (conversationId !== conversation.id) return;
      if (userId === user.id) return;
      const readAt = new Date().toISOString();
      setMessages(prev => prev.map(m => m.sender_id === user.id && m.status !== 'read' ? { ...m, status:'read', read_at:readAt } : m));
    };

    const onMessageStatus = ({ messageId, status, deliveredAt, readAt }) => {
      setMessages(prev => prev.map(m => {
        if (m.id !== messageId) return m;
        return { ...m, status, ...(deliveredAt ? { delivered_at:deliveredAt } : {}), ...(readAt ? { read_at:readAt } : {}) };
      }));
    };

    const onReaction = ({ conversationId, messageId, userId, emoji, action }) => {
      if (conversationId !== conversation.id) return;
      setMessages(prev => prev.map(m => {
        if (m.id !== messageId) return m;
        const reactions = m.reactions ? [...m.reactions] : [];
        if (action === 'add') {
          if (!reactions.find(r => r.user_id === userId && r.emoji === emoji)) reactions.push({ user_id:userId, emoji });
        } else {
          const idx = reactions.findIndex(r => r.user_id === userId && r.emoji === emoji);
          if (idx > -1) reactions.splice(idx, 1);
        }
        return { ...m, reactions };
      }));
    };

    socket.on('message:new', onNewMessage);
    socket.on('message:edited', onEdited);
    socket.on('message:deleted', onDeleted);
    socket.on('message:reaction', onReaction);
    socket.on('conversation:read', onConversationRead);
    socket.on('message:status', onMessageStatus);

    return () => {
      socket.off('message:new', onNewMessage);
      socket.off('message:edited', onEdited);
      socket.off('message:deleted', onDeleted);
      socket.off('message:reaction', onReaction);
      socket.off('conversation:read', onConversationRead);
      socket.off('message:status', onMessageStatus);
    };
  }, [conversation.id, user.id]);

  const handleSend = useCallback(async ({ content, type = 'text', mediaUrl, replyToId }) => {
    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId, content, type, media_url: mediaUrl,
      sender_id: user.id,
      sender: { id:user.id, full_name:user.full_name, username:user.username, avatar_url:user.avatar_url },
      reply_to: replyTo,
      created_at: new Date().toISOString(),
      status: 'sending', reactions: [],
    };
    setMessages(prev => [...prev, optimistic]);
    setReplyTo(null);
    try {
      socketService.sendMessage({ conversationId:conversation.id, content, type, mediaUrl, replyToId: replyToId || replyTo?.id });
    } catch {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status:'failed' } : m));
    }
  }, [conversation.id, user, replyTo]);

  const handleDeleteMessage = useCallback(messageId => {
    socketService.deleteMessage({ messageId, conversationId: conversation.id });
  }, [conversation.id]);

  const handleReaction = useCallback((messageId, emoji) => {
    const msg = messages.find(m => m.id === messageId);
    const hasReaction = msg?.reactions?.find(r => r.user_id === user.id && r.emoji === emoji);
    if (hasReaction) socketService.removeReaction({ messageId, conversationId:conversation.id, emoji });
    else socketService.addReaction({ messageId, conversationId:conversation.id, emoji });
  }, [conversation.id, messages, user.id]);

  const handleStar = useCallback(async (messageId, currentlyStarred) => {
    if (currentlyStarred) await messagesApi.unstar(conversation.id, messageId);
    else await messagesApi.star(conversation.id, messageId);
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_starred:!currentlyStarred } : m));
  }, [conversation.id]);

  const typingUsers = getTypingUsersForConversation(conversation.id);

  return (
    <Box sx={{ flex:1, display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden' }}>
      <ChatHeader conversation={conversation} typingUsers={typingUsers} onBack={onBack} />
      <MessageList
        messages={messages}
        loading={loading}
        hasMore={hasMore}
        currentUserId={user.id}
        onLoadMore={() => { if (messages.length > 0) loadMessages(messages[0].created_at); }}
        onReply={setReplyTo}
        onDelete={handleDeleteMessage}
        onReaction={handleReaction}
        onStar={handleStar}
        onMessageInfo={setMsgInfo}
        typingUsers={typingUsers}
        conversation={conversation}
      />
      <MessageInput
        onSend={handleSend}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        conversationId={conversation.id}
      />
      {msgInfo && <MessageInfoModal message={msgInfo} onClose={() => setMsgInfo(null)} />}
    </Box>
  );
}
