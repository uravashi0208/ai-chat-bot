/**
 * @file src/chat/gateway.js
 * @description Socket.IO real-time gateway.
 *
 * Responsibilities:
 *   - Authenticate every incoming connection via JWT
 *   - Maintain an in-memory userId → Set<socketId> registry
 *     (one user may be connected from multiple devices simultaneously)
 *   - Handle real-time events: messaging, typing, reactions, read receipts
 *   - Broadcast presence updates with per-viewer privacy filtering
 *   - Expose helper methods used by the service layer to push server-initiated events
 *
 * socket_id is intentionally NOT persisted to the DB — socket IDs are
 * ephemeral and become stale on every server restart or disconnect.
 * Force-logout for a removed device is achieved by finding the user's
 * active sockets from connectedUsers and emitting directly.
 */

import { Server } from "socket.io";
import { getUserFromToken } from "../middleware/auth.js";
import { usersService } from "../services/users.js";
import { messagesService } from "../services/messages.js";
import { conversationsService } from "../services/conversations.js";
import { privacyService } from "../services/privacy.js";
import { env } from "../config/env.js";
import { nowISO } from "../utils/helpers.js";

export class ChatGateway {
  /** @type {Server|null} */
  io = null;

  /**
   * userId → Set<socketId>
   * A user can have multiple concurrent sockets (multi-device).
   * @type {Map<string, Set<string>>}
   */
  connectedUsers = new Map();

  // ─── Initialisation ────────────────────────────────────────────────────────

  init(httpServer) {
    this.io = new Server(httpServer, {
      cors: { origin: env.FRONTEND_URL, credentials: true },
      path: "/socket.io",
    });

    this.io.on("connection", (socket) => this._handleConnection(socket));
    console.log("🔌 Socket.IO gateway ready");
  }

  // ─── Connection lifecycle ──────────────────────────────────────────────────

  async _handleConnection(socket) {
    try {
      const token =
        socket.handshake.auth?.token ??
        socket.handshake.headers?.authorization?.split(" ")[1];

      const user = await getUserFromToken(token);
      if (!user) { socket.disconnect(); return; }

      socket.userId = user.id;
      this._registerSocket(user.id, socket.id);

      // Join all conversation rooms
      const { data: participations } = await import("../config/supabase.js")
        .then(({ supabase }) =>
          supabase
            .from("conversation_participants")
            .select("conversation_id")
            .eq("user_id", user.id),
        );
      (participations ?? []).forEach((p) =>
        socket.join(`conversation:${p.conversation_id}`),
      );

      // Mark online & broadcast presence
      await usersService.updateStatus(user.id, "online");
      await this._broadcastPresence(user.id, "online");

      // Mark existing messages as delivered
      (participations ?? []).forEach(({ conversation_id }) => {
        messagesService
          .updateMessageStatus(conversation_id, user.id, "delivered")
          .catch(() => {});
      });

      this._registerHandlers(socket, user);

      socket.on("disconnect", () => this._handleDisconnect(socket, user));
    } catch (err) {
      console.error("[Gateway] connection error:", err.message);
      socket.disconnect();
    }
  }

  async _handleDisconnect(socket, user) {
    this._unregisterSocket(user.id, socket.id);

    // Only mark offline when the user has no remaining sockets
    if (!this.connectedUsers.get(user.id)?.size) {
      await usersService.updateStatus(user.id, "offline");
      await this._broadcastPresence(user.id, "offline");
    }
  }

  // ─── In-memory socket registry ─────────────────────────────────────────────

  _registerSocket(userId, socketId) {
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    this.connectedUsers.get(userId).add(socketId);
  }

  _unregisterSocket(userId, socketId) {
    this.connectedUsers.get(userId)?.delete(socketId);
    if (!this.connectedUsers.get(userId)?.size) {
      this.connectedUsers.delete(userId);
    }
  }

  /**
   * Emit an event to every active socket of a given user.
   * @param {string} userId
   * @param {string} event
   * @param {unknown} payload
   */
  emitToUser(userId, event, payload) {
    const sockets = this.connectedUsers.get(userId);
    if (!sockets) return;
    sockets.forEach((sid) => this.io?.to(sid).emit(event, payload));
  }

  // ─── Event handlers ────────────────────────────────────────────────────────

  _registerHandlers(socket, user) {
    // ── Send message ─────────────────────────────────────────────────────────
    socket.on("send-message", async (data, ack) => {
      try {
        const message = await messagesService.sendMessage(
          data.conversationId,
          user.id,
          data.content,
          data.type ?? "text",
          {
            mediaUrl:       data.mediaUrl,
            mediaThumbnail: data.mediaThumbnail,
            mediaSize:      data.mediaSize,
            mediaDuration:  data.mediaDuration,
            replyToId:      data.replyToId,
            isForwarded:    data.isForwarded,
          },
        );

        this.io
          ?.to(`conversation:${data.conversationId}`)
          .emit("new-message", message);

        ack?.({ success: true, message });
      } catch (err) {
        ack?.({ success: false, error: err.message });
      }
    });

    // ── Typing indicators ─────────────────────────────────────────────────────
    socket.on("typing-start", ({ conversationId }) => {
      socket
        .to(`conversation:${conversationId}`)
        .emit("user-typing", { userId: user.id, conversationId });
    });

    socket.on("typing-stop", ({ conversationId }) => {
      socket
        .to(`conversation:${conversationId}`)
        .emit("user-stopped-typing", { userId: user.id, conversationId });
    });

    // ── Mark read ─────────────────────────────────────────────────────────────
    socket.on("mark-read", async ({ conversationId }) => {
      try {
        const result = await messagesService.updateMessageStatus(
          conversationId,
          user.id,
          "read",
        );
        if (result) {
          this.io
            ?.to(`conversation:${conversationId}`)
            .emit("messages-read", { conversationId, userId: user.id, readAt: result.now });
        }
      } catch (err) {
        console.error("[Gateway] mark-read error:", err.message);
      }
    });

    // ── Reactions ─────────────────────────────────────────────────────────────
    socket.on("add-reaction", async ({ messageId, conversationId, emoji }, ack) => {
      try {
        const reaction = await messagesService.addReaction(messageId, user.id, emoji);
        this.io
          ?.to(`conversation:${conversationId}`)
          .emit("reaction-added", { messageId, reaction, userId: user.id });
        ack?.({ success: true });
      } catch (err) {
        ack?.({ success: false, error: err.message });
      }
    });

    socket.on("remove-reaction", async ({ messageId, conversationId, emoji }, ack) => {
      try {
        await messagesService.removeReaction(messageId, user.id, emoji);
        this.io
          ?.to(`conversation:${conversationId}`)
          .emit("reaction-removed", { messageId, userId: user.id, emoji });
        ack?.({ success: true });
      } catch (err) {
        ack?.({ success: false, error: err.message });
      }
    });

    // ── Edit / Delete ─────────────────────────────────────────────────────────
    socket.on("edit-message", async ({ messageId, conversationId, content }, ack) => {
      try {
        const message = await messagesService.editMessage(messageId, user.id, content);
        this.io
          ?.to(`conversation:${conversationId}`)
          .emit("message-edited", message);
        ack?.({ success: true, message });
      } catch (err) {
        ack?.({ success: false, error: err.message });
      }
    });

    socket.on("delete-message", async ({ messageId, conversationId }, ack) => {
      try {
        const message = await messagesService.deleteMessage(messageId, user.id);
        this.io
          ?.to(`conversation:${conversationId}`)
          .emit("message-deleted", message);
        ack?.({ success: true });
      } catch (err) {
        ack?.({ success: false, error: err.message });
      }
    });
  }

  // ─── Server-initiated helpers (called by service layer) ────────────────────

  /**
   * Add a user to a conversation's socket room.
   * Called after creating a new conversation.
   */
  joinUserToConversation(userId, conversationId) {
    const sockets = this.connectedUsers.get(userId);
    if (!sockets) return;
    sockets.forEach((sid) => {
      this.io?.in(sid).socketsJoin(`conversation:${conversationId}`);
    });
  }

  /**
   * Push a new conversation object to a user who was added to it.
   */
  notifyNewConversation(userId, conversation) {
    this.emitToUser(userId, "new-conversation", conversation);
  }

  /**
   * Force-logout all sockets for a given user (e.g. device removed).
   */
  forceLogoutUser(userId) {
    this.emitToUser(userId, "force-logout", {});
  }

  // ─── Presence broadcasting ─────────────────────────────────────────────────

  async _broadcastPresence(userId, status) {
    try {
      // Find all conversations this user is in
      const { supabase } = await import("../config/supabase.js");
      const { data: participations } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", userId);

      const convIds = (participations ?? []).map((p) => p.conversation_id);

      // Collect unique other participant IDs
      if (convIds.length === 0) return;
      const { data: others } = await supabase
        .from("conversation_participants")
        .select("user_id")
        .in("conversation_id", convIds)
        .neq("user_id", userId);

      const otherIds = [...new Set((others ?? []).map((o) => o.user_id))];

      const presencePayload = {
        userId,
        status,
        lastSeen: status === "offline" ? nowISO() : null,
      };

      // Apply privacy filter per viewer before emitting
      await Promise.all(
        otherIds.map(async (viewerId) => {
          try {
            const canSee = await privacyService.canViewField(
              viewerId,
              userId,
              "last_seen",
            );
            if (canSee) {
              this.emitToUser(viewerId, "presence-update", presencePayload);
            }
          } catch {
            // Best-effort; don't crash presence broadcasting
          }
        }),
      );
    } catch (err) {
      console.error("[Gateway] broadcastPresence error:", err.message);
    }
  }
}

export const chatGateway = new ChatGateway();
