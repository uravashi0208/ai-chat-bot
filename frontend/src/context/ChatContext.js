import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { getSocket } from "../services/socket";
import { conversationsApi, privacyApi, usersApi } from "../services/api";
import { useAuth } from "./AuthContext";

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState({});
  const [loading, setLoading] = useState(false);
  // Set of contact user IDs that the current user has blocked
  const [blockedContactIds, setBlockedContactIds] = useState(new Set());
  // Map of contactUserId → nickname (display name override)
  const [contactsMap, setContactsMap] = useState({});
  // Keep a ref so socket callbacks always see the latest blocked set
  // without needing to be re-registered when the set changes.
  const blockedContactIdsRef = useRef(new Set());
  useEffect(() => {
    blockedContactIdsRef.current = blockedContactIds;
  }, [blockedContactIds]);
  const socketRef = useRef(null);
  // Track active conversation in a ref so socket callbacks can access latest value
  const activeConversationRef = useRef(null);

  // Sync ref with state
  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  // Clear unread count when a conversation is set as active
  const setActiveConversationAndClear = useCallback((conv) => {
    setActiveConversation(conv);
    if (conv) {
      setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, unread_count: 0 } : c)),
      );
    }
  }, []);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await conversationsApi.getAll();
      // Deduplicate by id (safety net)
      const unique = Array.from(new Map(data.map((c) => [c.id, c])).values());
      setConversations(unique);

      // FIX #4: Pre-populate onlineUsers from the status field in loaded conversations.
      // The participants array includes each user's current `status` column from DB.
      // This means we show correct online state immediately on page load,
      // before any socket user:status events arrive.
      const initialOnline = new Set();
      unique.forEach((conv) => {
        (conv.participants || []).forEach((p) => {
          if (p.user?.id !== user.id && p.user?.status === "online") {
            initialOnline.add(p.user.id);
          }
        });
      });
      setOnlineUsers(initialOnline);
    } catch (err) {
      console.error("Failed to load conversations", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadConversations();
  }, [user, loadConversations]);

  // Load blocked contacts list on mount
  useEffect(() => {
    if (!user) return;
    privacyApi
      .getBlockedContacts()
      .then((list) => {
        setBlockedContactIds(
          new Set(list.map((b) => b.contact?.id).filter(Boolean)),
        );
      })
      .catch(() => {});
  }, [user]);

  // Load contacts map (userId → nickname) on mount
  useEffect(() => {
    if (!user) return;
    usersApi
      .getContacts()
      .then((list) => {
        const map = {};
        (list || []).forEach((c) => {
          if (c.contact?.id && c.nickname) {
            map[c.contact.id] = c.nickname;
          }
        });
        setContactsMap(map);
      })
      .catch(() => {});
  }, [user]);

  // Socket event listeners
  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    if (!socket) return;
    socketRef.current = socket;

    const onNewMessage = ({ conversationId, message }) => {
      // If the sender is someone we have blocked, silently drop the event.
      // The backend already prevents the message being stored when the blocker
      // is the *sender*, but we also guard here so that if User1 blocked User2,
      // User1 never sees User2's messages appear in the sidebar list.
      if (
        message.sender_id &&
        message.sender_id !== user?.id &&
        blockedContactIdsRef.current?.has(message.sender_id)
      ) {
        return;
      }

      setConversations((prev) =>
        prev
          .map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  last_message: message,
                  last_message_at: message.created_at,
                  // If this message is NOT from me and this is NOT the active conversation, increment unread
                  unread_count:
                    message.sender_id !== user?.id &&
                    activeConversationRef.current?.id !== conversationId
                      ? (c.unread_count || 0) + 1
                      : c.unread_count || 0,
                }
              : c,
          )
          .sort(
            (a, b) =>
              new Date(b.last_message_at || b.created_at) -
              new Date(a.last_message_at || a.created_at),
          ),
      );
    };

    // FIX #3: When the other user starts a conversation with us,
    // the backend now emits conversation:new — add it to the list here
    const onNewConversation = (conv) => {
      setConversations((prev) => {
        // Avoid duplicates
        const exists = prev.find((c) => c.id === conv.id);
        if (exists) return prev;
        const updated = [conv, ...prev];
        return updated.sort(
          (a, b) =>
            new Date(b.last_message_at || b.created_at) -
            new Date(a.last_message_at || a.created_at),
        );
      });
    };

    // FIX #4: user:status events from socket keep onlineUsers in sync in real-time
    const onUserStatus = ({ userId, status }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (status === "online") next.add(userId);
        else next.delete(userId);
        return next;
      });

      // Also update status inside conversations participants so the green dot stays correct
      setConversations((prev) =>
        prev.map((conv) => ({
          ...conv,
          participants: (conv.participants || []).map((p) =>
            p.user?.id === userId ? { ...p, user: { ...p.user, status } } : p,
          ),
        })),
      );
    };

    const onTypingStart = ({ conversationId, userId }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [conversationId]: new Set([...(prev[conversationId] || []), userId]),
      }));
    };

    const onTypingStop = ({ conversationId, userId }) => {
      setTypingUsers((prev) => {
        const set = new Set(prev[conversationId] || []);
        set.delete(userId);
        return { ...prev, [conversationId]: set };
      });
    };

    socket.on("message:new", onNewMessage);
    socket.on("conversation:new", onNewConversation);
    socket.on("user:status", onUserStatus);
    socket.on("typing:start", onTypingStart);
    socket.on("typing:stop", onTypingStop);

    return () => {
      socket.off("message:new", onNewMessage);
      socket.off("conversation:new", onNewConversation);
      socket.off("user:status", onUserStatus);
      socket.off("typing:start", onTypingStart);
      socket.off("typing:stop", onTypingStop);
    };
  }, [user]);

  const openConversation = useCallback(
    async (targetUserId) => {
      try {
        const conv = await conversationsApi.findOrCreateDirect(targetUserId);
        setActiveConversationAndClear(conv);
        setConversations((prev) => {
          const exists = prev.find((c) => c.id === conv.id);
          if (exists) return prev;
          const updated = [conv, ...prev];
          return updated.sort(
            (a, b) =>
              new Date(b.last_message_at || b.created_at) -
              new Date(a.last_message_at || a.created_at),
          );
        });
        return conv;
      } catch (err) {
        console.error("Failed to open conversation", err);
      }
    },
    [setActiveConversationAndClear],
  );

  const getTypingUsersForConversation = useCallback(
    (conversationId) => typingUsers[conversationId] || new Set(),
    [typingUsers],
  );

  // FIX #4: isUserOnline now correctly reflects both socket events AND pre-loaded status
  const isUserOnline = useCallback(
    (userId) => onlineUsers.has(userId),
    [onlineUsers],
  );

  const blockUser = useCallback(async (contactId, reason) => {
    await privacyApi.blockContact(contactId, reason);
    setBlockedContactIds((prev) => new Set([...prev, contactId]));
  }, []);

  const unblockUser = useCallback(async (contactId) => {
    await privacyApi.unblockContact(contactId);
    setBlockedContactIds((prev) => {
      const next = new Set(prev);
      next.delete(contactId);
      return next;
    });
  }, []);

  const isUserBlocked = useCallback(
    (userId) => blockedContactIds.has(userId),
    [blockedContactIds],
  );

  // Update nickname in local map after edit (no reload needed)
  const updateContactNickname = useCallback((contactUserId, nickname) => {
    setContactsMap((prev) => ({ ...prev, [contactUserId]: nickname }));
  }, []);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        setConversations,
        activeConversation,
        setActiveConversation: setActiveConversationAndClear,
        loading,
        loadConversations,
        openConversation,
        isUserOnline,
        getTypingUsersForConversation,
        onlineUsers,
        blockedContactIds,
        isUserBlocked,
        blockUser,
        unblockUser,
        contactsMap,
        updateContactNickname,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
};
