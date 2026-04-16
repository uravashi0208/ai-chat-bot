import React from "react";
import "./MessageInfoModal.css";


function formatFullTime(isoString) {
  if (!isoString) return null;
  const d = new Date(isoString);
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

const TickIcon = ({ color }) => (
  <svg viewBox="0 0 18 18" fill={color} width="16" height="16">
    <path d="M17.394 5.035l-.57-.444a.434.434 0 00-.609.076L8.97 15.17l-4.08-3.397a.434.434 0 00-.609.076l-.44.571a.434.434 0 00.076.609l4.873 4.057a.434.434 0 00.609-.076L17.47 5.644a.434.434 0 00-.076-.609z" />
    <path d="M12.395 5.035l-.57-.444a.434.434 0 00-.609.076L3.97 15.17l-1.5-1.248a.434.434 0 00-.609.076l-.44.571a.434.434 0 00.076.609l2.293 1.909a.434.434 0 00.609-.076L12.47 5.644a.434.434 0 00-.076-.609z" />
  </svg>
);

export default function MessageInfoModal({ message, onClose }) {
  if (!message) return null;

  const rows = [
    {
      label: "Sent",
      time: message.created_at,
      icon: <TickIcon color="#6b7194" />,
    },
    {
      label: "Delivered",
      time: message.delivered_at || null,
      icon: <TickIcon color="#6b7194" />,
    },
    {
      label: "Seen",
      time: message.read_at || null,
      icon: <TickIcon color="#a78bfa" />,
    },
  ];

  return (
    <div className="msg-info-overlay" onClick={onClose}>
      <div className="msg-info-modal" onClick={(e) => e.stopPropagation()}>
        <div className="msg-info-header">
          <span>Message Info</span>
          <button className="msg-info-close" onClick={onClose}>✕</button>
        </div>

        {/* Message preview */}
        <div className="msg-info-preview">
          {message.is_deleted || message.type === "deleted" ? (
            <span className="msg-info-deleted">🚫 This message was deleted</span>
          ) : (
            <p>{message.content}</p>
          )}
        </div>

        {/* Status rows */}
        <div className="msg-info-rows">
          {rows.map(({ label, time, icon }) => (
            <div className="msg-info-row" key={label}>
              <div className="msg-info-row-icon">{icon}</div>
              <div className="msg-info-row-body">
                <span className="msg-info-row-label">{label}</span>
                <span className={`msg-info-row-time ${!time ? "pending" : ""}`}>
                  {time ? formatFullTime(time) : "Pending…"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
