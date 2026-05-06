/**
 * @file src/chat/gateway.js
 * @description Socket.IO real-time gateway.
 *
 * Responsibilities:
 *   - Authenticate every incoming connection via JWT
 *   - Maintain a userId → socketId registry for targeted emissions
 *   - Handle all real-time events: messaging, typing, reactions, read receipts
 *   - Broadcast presence updates with per-viewer privacy filtering
 *   - Expose helper methods used by the service layer to push server-initiated events
 *
 * Architecture note:
 *   This class is a singleton (`export const chatGateway`).  It is initialised
 *   once in `index.js` after the HTTP server is created, then injected into
 *   `conversationsService` via `setChatGateway` to avoid a circular import.
 */

import { Server } from "socket.io";
import { getUserFromToken } from "../middleware/auth.js";
import { usersService } from "../services/users.js";
import { messagesService } from "../services/messages.js";
import { conversationsService } from "../services/conversations.js";
import { privacyService } from "../services/privacy.js";
import { supabase } from "../config/supabase.js";
import { env } from "../config/env.js";
import { nowISO } from "../utils/helpers.js";

export class ChatGateway {
  /** @type {Server|null} */
  io = null;

  /**
   * userId → socketId registry.
   * Used to send events to a specific user without broadcasting to all sockets.
   * @type {Map<string, string>}
   */
  connectedUsers = new Map();

  // ─── Initialisation ────────────────────────────────────────────────────────

  /**
   * Attach Socket.IO to an existing HTTP server.
   * Must be called once during bootstrap before any connections arrive.
   *
   * @param {import('http').Server} httpServer
   */
  init(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: env.FRONTEND_URL,
        credentials: true,
      },
      path: "/socket.io",
    });

    this.io.on("connection", (socket) => this._handleConnection(socket));
    console.log("🔌 Socket.IO gateway ready");
  }

  // ─── Connection lifecycle ──────────────────────────────────────────────────

  /**
   * Authenticate the connecting socket and set up its session.
   * Unauthenticated sockets are immediately disconnected.
   *
   * @param {import('socket.io').Socket} socket
   */
  async _handleConnection(socket) {
    try {
      // Accept token from handshake auth object or Authorization header
      const token =
        socket.handshake.auth?.token ??
        socket.handshake.headers?.authorization?.split(" ")[1];

      const user = await getUserFromToken(token);
      if (!user) {
        socket.disconnect();
        return;
      }

      socket.data.userId = user.id;
      this.connectedUsers.set(user.id, socket.id);

      // Sync socket_id to linked_devices so force-logout reaches the right socket
      await supabase
        .from("linked_devices")
        .update({ socket_id: socket.id })
        .eq("user_id", user.id)
        .eq("is_active", true);

      await usersService.updateStatus(user.id, "online");

      // Privacy-aware presence: tell this socket about other online users it can see
      await this._sendCurrentPresenceToSocket(socket, user.id);

      // Notify others that this user is online (respecting their privacy settings)
      await this._broadcastPresence(user.id, "online", socket);

      // Join all existing conversation rooms
      const conversations = await conversationsService.getUserConversations(
        user.id,
      );
      conversations.forEach((conv) => socket.join(`conversation:${conv.id}`));

      console.log(`[WS] ✅ User ${user.id} connected`);

      this._registerEventHandlers(socket);
    } catch (err) {
      console.error("[WS] Connection error:", err.message);
      socket.disconnect();
    }
  }

  /**
   * Clean up when a socket disconnects.
   * @param {import('socket.io').Socket} socket
   */
  async _handleDisconnect(socket) {
    const { userId } = socket.data;
    if (!userId) return;

    this.connectedUsers.delete(userId);
    await usersService.updateStatus(userId, "offline");
    await this._broadcastPresence(userId, "offline", socket);
    console.log(`[WS] ❌ User ${userId} disconnected`);
  }

  // ─── Presence helpers ──────────────────────────────────────────────────────

  /**
   * Emit `user:status` to all connected viewers who are permitted to see
   * the target user's presence, according to their privacy settings.
   *
   * @param {string}                     userId  - The user whose status changed
   * @param {'online'|'offline'}         status
   * @param {import('socket.io').Socket} excludeSocket - Don't echo back to the source
   */
  async _broadcastPresence(userId, status, excludeSocket) {
    for (const [viewerId, viewerSocketId] of this.connectedUsers) {
      if (viewerId === userId) continue;
      try {
        const canSee = await privacyService.canViewField(
          viewerId,
          userId,
          "last_seen",
        );
        if (canSee)
          this.io.to(viewerSocketId).emit("user:status", { userId, status });
      } catch {
        // Privacy check failed — err on the side of privacy and skip
      }
    }
  }

  /**
   * Tell a newly connected socket about all currently-online users it can see.
   * @param {import('socket.io').Socket} socket
   * @param {string}                     viewerId
   */
  async _sendCurrentPresenceToSocket(socket, viewerId) {
    for (const [onlineUserId] of this.connectedUsers) {
      if (onlineUserId === viewerId) continue;
      try {
        const canSee = await privacyService.canViewField(
          viewerId,
          onlineUserId,
          "last_seen",
        );
        if (canSee)
          socket.emit("user:status", {
            userId: onlineUserId,
            status: "online",
          });
      } catch {
        // skip
      }
    }
  }

  // ─── Event handlers ────────────────────────────────────────────────────────

  /**
   * Register all socket event handlers for a connected client.
   * @param {import('socket.io').Socket} socket
   */
  _registerEventHandlers(socket) {
    socket.on("disconnect", () => this._handleDisconnect(socket));

    // ── Messages ────────────────────────────────────────────────────────────

    socket.on("message:send", async (data, callback) => {
      try {
        const { userId } = socket.data;
        const message = await messagesService.sendMessage(
          data.conversationId,
          userId,
          data.content,
          data.type ?? "text",
          {
            mediaUrl: data.mediaUrl,
            replyToId: data.replyToId,
            isForwarded: data.isForwarded,
          },
        );

        // Broadcast to everyone in the conversation room (including sender)
        this.io.to(`conversation:${data.conversationId}`).emit("message:new", {
          conversationId: data.conversationId,
          message,
        });

        // Auto-deliver if any recipient is currently connected
        await this._autoDeliver(message, data.conversationId, userId);

        callback?.({ success: true, message });
      } catch (err) {
        callback?.({ success: false, error: err.message });
      }
    });

    socket.on("message:edit", async (data, callback) => {
      try {
        const message = await messagesService.editMessage(
          data.messageId,
          socket.data.userId,
          data.content,
        );
        this.io
          .to(`conversation:${data.conversationId}`)
          .emit("message:edited", {
            conversationId: data.conversationId,
            message,
          });
        callback?.({ success: true });
      } catch (err) {
        callback?.({ success: false, error: err.message });
      }
    });

    socket.on("message:delete", async (data, callback) => {
      try {
        await messagesService.deleteMessage(data.messageId, socket.data.userId);
        this.io
          .to(`conversation:${data.conversationId}`)
          .emit("message:deleted", {
            conversationId: data.conversationId,
            messageId: data.messageId,
          });
        callback?.({ success: true });
      } catch (err) {
        callback?.({ success: false, error: err.message });
      }
    });

    // ── Reactions ───────────────────────────────────────────────────────────

    socket.on("message:reaction", async (data, callback) => {
      const { userId } = socket.data;
      try {
        if (data.action === "add") {
          await messagesService.addReaction(data.messageId, userId, data.emoji);
        } else {
          await messagesService.removeReaction(
            data.messageId,
            userId,
            data.emoji,
          );
        }
        this.io
          .to(`conversation:${data.conversationId}`)
          .emit("message:reaction", {
            conversationId: data.conversationId,
            messageId: data.messageId,
            userId,
            emoji: data.emoji,
            action: data.action,
          });
        callback?.({ success: true });
      } catch (err) {
        callback?.({ success: false, error: err.message });
      }
    });

    // ── Typing indicators ───────────────────────────────────────────────────

    socket.on("typing:start", (data) => {
      socket.to(`conversation:${data.conversationId}`).emit("typing:start", {
        conversationId: data.conversationId,
        userId: socket.data.userId,
      });
    });

    socket.on("typing:stop", (data) => {
      socket.to(`conversation:${data.conversationId}`).emit("typing:stop", {
        conversationId: data.conversationId,
        userId: socket.data.userId,
      });
    });

    // ── Conversation events ─────────────────────────────────────────────────

    socket.on("conversation:join", async (data, callback) => {
      socket.join(`conversation:${data.conversationId}`);
      await messagesService.updateMessageStatus(
        data.conversationId,
        socket.data.userId,
        "read",
      );
      callback?.({ success: true });
    });

    socket.on("conversation:read", async (data) => {
      const { userId } = socket.data;
      const readAt = nowISO();

      await conversationsService.markAsRead(data.conversationId, userId);
      this.io
        .to(`conversation:${data.conversationId}`)
        .emit("conversation:read", {
          conversationId: data.conversationId,
          userId,
        });

      // Notify senders that their messages have been read
      await this._emitReadReceiptsToSenders(
        data.conversationId,
        userId,
        readAt,
      );
    });

    // ── Device events ───────────────────────────────────────────────────────

    socket.on("register-device", async ({ deviceId }) => {
      await supabase
        .from("linked_devices")
        .update({ socket_id: socket.id })
        .eq("id", deviceId);
    });

    // ── Privacy changes ─────────────────────────────────────────────────────

    socket.on("privacy:changed", async ({ field }) => {
      // Only last_seen affects live presence visibility
      if (field !== "last_seen") return;
      const { userId } = socket.data;
      const isOnline = this.connectedUsers.has(userId);

      for (const [viewerId, viewerSocketId] of this.connectedUsers) {
        if (viewerId === userId) continue;
        try {
          const canSee = await privacyService.canViewField(
            viewerId,
            userId,
            "last_seen",
          );
          this.io.to(viewerSocketId).emit("user:status", {
            userId,
            status: canSee && isOnline ? "online" : "offline",
          });
        } catch {
          // skip
        }
      }
    });
  }

  // ─── Private: delivery helpers ─────────────────────────────────────────────

  /**
   * Mark a message as delivered if at least one recipient is currently online.
   * Emits `message:status` back to the sender so the UI updates the tick icon.
   */
  async _autoDeliver(message, conversationId, senderId) {
    try {
      const conv = await conversationsService.getConversationById(
        conversationId,
        senderId,
      );
      if (!conv?.participants) return;

      const recipients = conv.participants.filter(
        (p) => (p.user?.id ?? p.user_id) !== senderId,
      );
      const anyOnline = recipients.some((p) =>
        this.connectedUsers.has(p.user?.id ?? p.user_id),
      );
      if (!anyOnline) return;

      const deliveredAt = nowISO();
      await supabase
        .from("messages")
        .update({ status: "delivered", delivered_at: deliveredAt })
        .eq("id", message.id)
        .eq("status", "sent");

      const senderSocketId = this.connectedUsers.get(senderId);
      if (senderSocketId) {
        this.io.to(senderSocketId).emit("message:status", {
          messageId: message.id,
          status: "delivered",
          deliveredAt,
        });
      }
    } catch {
      // Non-critical — delivery status can be reconciled later
    }
  }

  /**
   * After a conversation is marked read, notify original senders via socket.
   */
  async _emitReadReceiptsToSenders(conversationId, readerId, readAt) {
    try {
      const { data: msgs } = await supabase
        .from("messages")
        .select("id, sender_id")
        .eq("conversation_id", conversationId)
        .neq("sender_id", readerId)
        .neq("status", "read");

      if (!msgs?.length) return;

      await supabase
        .from("messages")
        .update({ status: "read", read_at: readAt })
        .eq("conversation_id", conversationId)
        .neq("sender_id", readerId);

      const senderIds = [...new Set(msgs.map((m) => m.sender_id))];
      senderIds.forEach((senderId) => {
        const senderSocketId = this.connectedUsers.get(senderId);
        if (!senderSocketId) return;
        msgs
          .filter((m) => m.sender_id === senderId)
          .forEach((m) => {
            this.io.to(senderSocketId).emit("message:status", {
              messageId: m.id,
              status: "read",
              readAt,
            });
          });
      });
    } catch (err) {
      console.error("[WS] Failed to emit read receipts:", err.message);
    }
  }

  // ─── Public helpers (called by service layer) ──────────────────────────────

  /**
   * Push a `conversation:new` event to a specific user's socket and join them
   * to the conversation room. Safe to call even if the user is offline.
   *
   * @param {string} userId
   * @param {object} conversation
   */
  notifyNewConversation(userId, conversation) {
    const socketId = this.connectedUsers.get(userId);
    if (!socketId) return;
    const targetSocket = this.io.sockets.sockets.get(socketId);
    targetSocket?.join(`conversation:${conversation.id}`);
    this.io.to(socketId).emit("conversation:new", conversation);
  }

  /**
   * Add a user's socket to a conversation room. Called when a new participant
   * is added to a group or a new direct conversation is created.
   *
   * @param {string} userId
   * @param {string} conversationId
   */
  joinUserToConversation(userId, conversationId) {
    const socketId = this.connectedUsers.get(userId);
    if (!socketId) return;
    const targetSocket = this.io.sockets.sockets.get(socketId);
    targetSocket?.join(`conversation:${conversationId}`);
  }
}

// Singleton — import this instance everywhere
export const chatGateway = new ChatGateway();
