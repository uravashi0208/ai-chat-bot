import React, { useState } from "react";
import { useChat } from "../context/ChatContext";
import Sidebar from "../components/Sidebar/Sidebar";
import ChatWindow from "../components/ChatWindow/ChatWindow";
import WelcomeScreen from "../components/WelcomeScreen";
import "./ChatPage.css";

export default function ChatPage() {
  const { activeConversation, setActiveConversation } = useChat();
  const [sidebarView, setSidebarView] = useState("chats"); // 'chats' | 'contacts' | 'profile'

  return (
    <div className="chat-page">
      <Sidebar
        view={sidebarView}
        setView={setSidebarView}
        onSelectConversation={setActiveConversation}
      />
      <div className={`chat-main${activeConversation ? " active" : ""}`}>
        {activeConversation ? (
          <ChatWindow
            conversation={activeConversation}
            onBack={() => setActiveConversation(null)}
          />
        ) : (
          <WelcomeScreen />
        )}
      </div>
    </div>
  );
}
