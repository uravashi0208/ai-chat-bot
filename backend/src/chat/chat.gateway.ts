import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { forwardRef, Inject } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { JwtService } from "@nestjs/jwt";
import { MessagesService } from "../messages/messages.service";
import { UsersService } from "../users/users.service";
import { ConversationsService } from "../conversations/conversations.service";

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  },
  namespace: "/",
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // FIX #4: Track connected users as Map<userId, socketId>
  private connectedUsers = new Map<string, string>();

  constructor(
    private jwtService: JwtService,
    private messagesService: MessagesService,
    private usersService: UsersService,
    @Inject(forwardRef(() => ConversationsService))
    private conversationsService: ConversationsService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(" ")[1];

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      client.data.userId = userId;
      this.connectedUsers.set(userId, client.id);

      // Update user status to online
      await this.usersService.updateStatus(userId, "online");

      // Broadcast to ALL others that this user is online
      client.broadcast.emit("user:status", { userId, status: "online" });

      // FIX #4: Send current online users to the newly connected client
      // so their UI immediately shows who is already online
      this.connectedUsers.forEach((socketId, onlineUserId) => {
        if (onlineUserId !== userId) {
          client.emit("user:status", {
            userId: onlineUserId,
            status: "online",
          });
        }
      });

      // Join conversation rooms
      const conversations =
        await this.conversationsService.getUserConversations(userId);
      conversations.forEach((conv: any) => {
        client.join(`conversation:${conv.id}`);
      });

      console.log(`User ${userId} connected`);
    } catch (err) {
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.connectedUsers.delete(userId);
      await this.usersService.updateStatus(userId, "offline");
      this.server.emit("user:status", { userId, status: "offline" });
      console.log(`User ${userId} disconnected`);
    }
  }

  @SubscribeMessage("message:send")
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      conversationId: string;
      content: string;
      type?: string;
      mediaUrl?: string;
      replyToId?: string;
      isForwarded?: boolean;
    },
  ) {
    const userId = client.data.userId;
    try {
      const message = await this.messagesService.sendMessage(
        data.conversationId,
        userId,
        data.content,
        data.type || "text",
        {
          mediaUrl: data.mediaUrl,
          replyToId: data.replyToId,
          isForwarded: data.isForwarded,
        },
      );

      // Broadcast to all in conversation room
      this.server
        .to(`conversation:${data.conversationId}`)
        .emit("message:new", {
          conversationId: data.conversationId,
          message,
        });

      // If any recipient is currently online → mark as delivered immediately
      try {
        const conv = await this.conversationsService.getConversationById(
          data.conversationId,
          userId,
        );
        if (conv?.participants) {
          const deliveredAt = new Date().toISOString();
          const recipients = conv.participants.filter(
            (p: any) => (p.user_id || p.user?.id) !== userId,
          );
          const anyOnline = recipients.some((p: any) =>
            this.connectedUsers.has(p.user_id || p.user?.id),
          );
          if (anyOnline) {
            const senderSocketId = this.connectedUsers.get(userId);
            if (senderSocketId) {
              this.server.to(senderSocketId).emit("message:status", {
                messageId: message.id,
                status: "delivered",
                deliveredAt,
              });
            }
          }
        }
      } catch (_) {}

      return { success: true, message };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  @SubscribeMessage("message:edit")
  async handleEditMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { messageId: string; conversationId: string; content: string },
  ) {
    const userId = client.data.userId;
    try {
      const message = await this.messagesService.editMessage(
        data.messageId,
        userId,
        data.content,
      );
      this.server
        .to(`conversation:${data.conversationId}`)
        .emit("message:edited", {
          conversationId: data.conversationId,
          message,
        });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  @SubscribeMessage("message:delete")
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; conversationId: string },
  ) {
    const userId = client.data.userId;
    try {
      const message = await this.messagesService.deleteMessage(
        data.messageId,
        userId,
      );
      this.server
        .to(`conversation:${data.conversationId}`)
        .emit("message:deleted", {
          conversationId: data.conversationId,
          messageId: data.messageId,
        });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  @SubscribeMessage("message:reaction")
  async handleReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      messageId: string;
      conversationId: string;
      emoji: string;
      action: "add" | "remove";
    },
  ) {
    const userId = client.data.userId;
    try {
      if (data.action === "add") {
        await this.messagesService.addReaction(
          data.messageId,
          userId,
          data.emoji,
        );
      } else {
        await this.messagesService.removeReaction(
          data.messageId,
          userId,
          data.emoji,
        );
      }
      this.server
        .to(`conversation:${data.conversationId}`)
        .emit("message:reaction", {
          conversationId: data.conversationId,
          messageId: data.messageId,
          userId,
          emoji: data.emoji,
          action: data.action,
        });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  @SubscribeMessage("typing:start")
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data.userId;
    client.to(`conversation:${data.conversationId}`).emit("typing:start", {
      conversationId: data.conversationId,
      userId,
    });
  }

  @SubscribeMessage("typing:stop")
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data.userId;
    client.to(`conversation:${data.conversationId}`).emit("typing:stop", {
      conversationId: data.conversationId,
      userId,
    });
  }

  @SubscribeMessage("conversation:join")
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.join(`conversation:${data.conversationId}`);
    // Mark messages as read
    await this.messagesService.updateMessageStatus(
      data.conversationId,
      client.data.userId,
      "read",
    );
    return { success: true };
  }

  @SubscribeMessage("conversation:read")
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data.userId;
    const readAt = new Date().toISOString();

    await this.conversationsService.markAsRead(data.conversationId, userId);

    // Broadcast read event to all in conversation room
    this.server
      .to(`conversation:${data.conversationId}`)
      .emit("conversation:read", {
        conversationId: data.conversationId,
        userId,
      });

    // Also notify each message sender individually with per-message status update
    try {
      const supabase = (
        this.messagesService as any
      ).supabaseService?.getClient?.();
      if (supabase) {
        // Get messages in this conversation NOT sent by the reader
        const { data: msgs } = await supabase
          .from("messages")
          .select("id, sender_id")
          .eq("conversation_id", data.conversationId)
          .neq("sender_id", userId)
          .neq("status", "read");

        if (msgs && msgs.length > 0) {
          // Update status to read with read_at timestamp
          await supabase
            .from("messages")
            .update({ status: "read" })
            .eq("conversation_id", data.conversationId)
            .neq("sender_id", userId);

          // Notify each unique sender
          const senderIds = [...new Set(msgs.map((m: any) => m.sender_id))];
          senderIds.forEach((senderId: string) => {
            const senderSocketId = this.connectedUsers.get(senderId);
            if (senderSocketId) {
              const senderMsgs = msgs.filter(
                (m: any) => m.sender_id === senderId,
              );
              senderMsgs.forEach((m: any) => {
                this.server.to(senderSocketId).emit("message:status", {
                  messageId: m.id,
                  status: "read",
                  readAt,
                });
              });
            }
          });
        }
      }
    } catch (err) {
      console.error("Failed to emit message:status on read", err);
    }
  }

  // FIX #3: Notify a specific user of a new conversation AND join them to the room
  notifyNewConversation(userId: string, conversation: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      // Add the target user's socket to the conversation room
      const targetSocket = this.server.sockets.sockets.get(socketId);
      if (targetSocket) {
        targetSocket.join(`conversation:${conversation.id}`);
      }
      this.server.to(socketId).emit("conversation:new", conversation);
    }
  }

  // Helper to join a socket to a new conversation room (used after creating conversation)
  joinUserToConversation(userId: string, conversationId: string) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      const targetSocket = this.server.sockets.sockets.get(socketId);
      if (targetSocket) {
        targetSocket.join(`conversation:${conversationId}`);
      }
    }
  }
}
