import React, { useMemo } from "react";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../common/Avatar";
import {
  formatConversationTime,
  getConversationName,
  getConversationAvatar,
  getOtherParticipant,
} from "../../utils/helpers";
import "./ConversationList.css";

const DoubleCheckIcon = ({ read }) => (
  <svg
    viewBox="0 0 18 18"
    width="16"
    height="16"
    fill={read ? "#53bdeb" : "#8696a0"}
  >
    <path d="M17.394 5.035l-.57-.444a.434.434 0 00-.609.076L8.97 15.17l-4.08-3.397a.434.434 0 00-.609.076l-.44.571a.434.434 0 00.076.609l4.873 4.057a.434.434 0 00.609-.076L17.47 5.644a.434.434 0 00-.076-.609z" />
    <path d="M12.395 5.035l-.57-.444a.434.434 0 00-.609.076L3.97 15.17l-1.5-1.248a.434.434 0 00-.609.076l-.44.571a.434.434 0 00.076.609l2.293 1.909a.434.434 0 00.609-.076L12.47 5.644a.434.434 0 00-.076-.609z" />
  </svg>
);

const MutedIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
  </svg>
);

export default function ConversationList({ searchQuery, onSelect }) {
  // FIX #4: Pull isUserOnline from context — it now merges pre-loaded DB status
  // with real-time socket events, so the green dot is always accurate
  const { conversations, activeConversation, loading, isUserOnline } =
    useChat();
  const { user } = useAuth();

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) => {
      const name = getConversationName(c, user.id).toLowerCase();
      const lastMsg = c.last_message?.content?.toLowerCase() || "";
      return name.includes(q) || lastMsg.includes(q);
    });
  }, [conversations, searchQuery, user.id]);

  if (loading) {
    return (
      <div className="conv-list-loading">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="conv-skeleton">
            <div className="skel-avatar" />
            <div className="skel-lines">
              <div className="skel-line skel-name" />
              <div className="skel-line skel-msg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!filtered.length) {
    return (
      <div className="conv-list-empty">
        {searchQuery
          ? `No results for "${searchQuery}"`
          : "No conversations yet"}
      </div>
    );
  }

  return (
    <div className="conv-list">
      {filtered.map((conv) => {
        const name = getConversationName(conv, user.id);
        const avatar = getConversationAvatar(conv, user.id);
        const other = getOtherParticipant(conv, user.id);
        const isActive = activeConversation?.id === conv.id;
        const lastMsg = conv.last_message;
        const isMine = lastMsg?.sender_id === user.id;

        // FIX #4: Use isUserOnline() from context instead of reading conv.participants status
        // This correctly reflects real-time socket events AND pre-loaded status
        const showOnlineDot =
          conv.type === "direct" &&
          other?.user?.id &&
          isUserOnline(other.user.id);

        return (
          <button
            key={conv.id}
            className={`conv-item ${isActive ? "active" : ""}`}
            onClick={() => onSelect(conv)}
          >
            <div className="conv-avatar">
              <Avatar name={name} src={avatar} size={49} />
              {showOnlineDot && <span className="online-dot" />}
            </div>
            <div className="conv-info">
              <div className="conv-top">
                <span className="conv-name truncate">{name}</span>
                <span className="conv-time">
                  {formatConversationTime(
                    conv.last_message_at || conv.created_at,
                  )}
                </span>
              </div>
              <div className="conv-bottom">
                <div className="conv-preview truncate">
                  {isMine && (
                    <DoubleCheckIcon read={lastMsg?.status === "read"} />
                  )}
                  {lastMsg ? (
                    lastMsg.type === "deleted" ? (
                      <em>This message was deleted</em>
                    ) : lastMsg.type !== "text" ? (
                      `📎 ${lastMsg.type}`
                    ) : (
                      lastMsg.content
                    )
                  ) : (
                    <em>Start a conversation</em>
                  )}
                </div>
                {conv.is_muted && <MutedIcon />}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
