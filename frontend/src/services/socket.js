import { io } from "socket.io-client";

let socket = null;

export const initSocket = (token) => {
  if (socket) socket.disconnect();
  socket = io(process.env.REACT_APP_WS_URL || "http://localhost:4000", {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  // Force-logout: server sends this when the device is removed from Linked Devices
  socket.on("force-logout", () => {
    localStorage.removeItem("wa_token");
    localStorage.removeItem("wa_user");
    socket.disconnect();
    socket = null;
    window.location.href = "/login";
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Emit helpers
export const socketEmit = (event, data) => {
  if (socket?.connected) socket.emit(event, data);
};

export const sendMessage = (data) => socketEmit("message:send", data);
export const editMessage = (data) => socketEmit("message:edit", data);
export const deleteMessage = (data) => socketEmit("message:delete", data);
export const addReaction = (data) =>
  socketEmit("message:reaction", { ...data, action: "add" });
export const removeReaction = (data) =>
  socketEmit("message:reaction", { ...data, action: "remove" });
export const startTyping = (conversationId) =>
  socketEmit("typing:start", { conversationId });
export const stopTyping = (conversationId) =>
  socketEmit("typing:stop", { conversationId });
export const joinConversation = (conversationId) =>
  socketEmit("conversation:join", { conversationId });
export const markConversationRead = (conversationId) =>
  socketEmit("conversation:read", { conversationId });
