import React, { useState, useCallback } from 'react';
import { Box } from '@mui/material';
import { useChat } from '../context/ChatContext';
import Sidebar from '../components/sidebar/Sidebar';
import ChatWindow from '../components/chat/ChatWindow';
import AIChat from '../components/chat/AIChat';
import WelcomeScreen from '../components/chat/WelcomeScreen';

export default function ChatPage() {
  const { setActiveConversation } = useChat();
  const [selectedConv, setSelectedConv] = useState(null);
  const [aiActive, setAiActive] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  const handleSelectConversation = useCallback((conv) => {
    setSelectedConv(conv);
    setAiActive(false);
    setActiveConversation(conv);
    setMobileChatOpen(true);
  }, [setActiveConversation]);

  const handleSelectAI = useCallback(() => {
    setAiActive(true);
    setSelectedConv(null);
    setActiveConversation(null);
    setMobileChatOpen(true);
  }, [setActiveConversation]);

  const handleBack = useCallback(() => {
    setMobileChatOpen(false);
  }, []);

  return (
    <Box sx={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      bgcolor: 'background.default',
    }}>
      {/* Sidebar */}
      <Box sx={{
        display: { xs: mobileChatOpen ? 'none' : 'flex', md: 'flex' },
        flexDirection: 'column',
        flexShrink: 0,
      }}>
        <Sidebar
          onSelectConversation={handleSelectConversation}
          onSelectAI={handleSelectAI}
          isAIActive={aiActive}
        />
      </Box>

      {/* Right panel */}
      <Box sx={{
        flex: 1,
        display: { xs: mobileChatOpen ? 'flex' : 'none', md: 'flex' },
        flexDirection: 'column',
        minWidth: 0,
        height: '100vh',
        overflow: 'hidden',
      }}>
        {aiActive ? (
          <AIChat />
        ) : selectedConv ? (
          <ChatWindow
            key={selectedConv.id}
            conversation={selectedConv}
            onBack={handleBack}
          />
        ) : (
          <WelcomeScreen />
        )}
      </Box>
    </Box>
  );
}
