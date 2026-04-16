"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
const messages_service_1 = require("../messages/messages.service");
const users_service_1 = require("../users/users.service");
const conversations_service_1 = require("../conversations/conversations.service");
let ChatGateway = class ChatGateway {
    constructor(jwtService, messagesService, usersService, conversationsService) {
        this.jwtService = jwtService;
        this.messagesService = messagesService;
        this.usersService = usersService;
        this.conversationsService = conversationsService;
        this.connectedUsers = new Map();
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token ||
                client.handshake.headers?.authorization?.split(" ")[1];
            if (!token) {
                client.disconnect();
                return;
            }
            const payload = this.jwtService.verify(token);
            const userId = payload.sub;
            client.data.userId = userId;
            this.connectedUsers.set(userId, client.id);
            await this.usersService.updateStatus(userId, "online");
            client.broadcast.emit("user:status", { userId, status: "online" });
            this.connectedUsers.forEach((socketId, onlineUserId) => {
                if (onlineUserId !== userId) {
                    client.emit("user:status", {
                        userId: onlineUserId,
                        status: "online",
                    });
                }
            });
            const conversations = await this.conversationsService.getUserConversations(userId);
            conversations.forEach((conv) => {
                client.join(`conversation:${conv.id}`);
            });
            console.log(`User ${userId} connected`);
        }
        catch (err) {
            client.disconnect();
        }
    }
    async handleDisconnect(client) {
        const userId = client.data.userId;
        if (userId) {
            this.connectedUsers.delete(userId);
            await this.usersService.updateStatus(userId, "offline");
            this.server.emit("user:status", { userId, status: "offline" });
            console.log(`User ${userId} disconnected`);
        }
    }
    async handleSendMessage(client, data) {
        const userId = client.data.userId;
        try {
            const message = await this.messagesService.sendMessage(data.conversationId, userId, data.content, data.type || "text", {
                mediaUrl: data.mediaUrl,
                replyToId: data.replyToId,
                isForwarded: data.isForwarded,
            });
            this.server
                .to(`conversation:${data.conversationId}`)
                .emit("message:new", {
                conversationId: data.conversationId,
                message,
            });
            try {
                const conv = await this.conversationsService.getConversationById(data.conversationId, userId);
                if (conv?.participants) {
                    const deliveredAt = new Date().toISOString();
                    const recipients = conv.participants.filter((p) => (p.user_id || p.user?.id) !== userId);
                    const anyOnline = recipients.some((p) => this.connectedUsers.has(p.user_id || p.user?.id));
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
            }
            catch (_) { }
            return { success: true, message };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async handleEditMessage(client, data) {
        const userId = client.data.userId;
        try {
            const message = await this.messagesService.editMessage(data.messageId, userId, data.content);
            this.server
                .to(`conversation:${data.conversationId}`)
                .emit("message:edited", {
                conversationId: data.conversationId,
                message,
            });
            return { success: true };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async handleDeleteMessage(client, data) {
        const userId = client.data.userId;
        try {
            const message = await this.messagesService.deleteMessage(data.messageId, userId);
            this.server
                .to(`conversation:${data.conversationId}`)
                .emit("message:deleted", {
                conversationId: data.conversationId,
                messageId: data.messageId,
            });
            return { success: true };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async handleReaction(client, data) {
        const userId = client.data.userId;
        try {
            if (data.action === "add") {
                await this.messagesService.addReaction(data.messageId, userId, data.emoji);
            }
            else {
                await this.messagesService.removeReaction(data.messageId, userId, data.emoji);
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
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    handleTypingStart(client, data) {
        const userId = client.data.userId;
        client.to(`conversation:${data.conversationId}`).emit("typing:start", {
            conversationId: data.conversationId,
            userId,
        });
    }
    handleTypingStop(client, data) {
        const userId = client.data.userId;
        client.to(`conversation:${data.conversationId}`).emit("typing:stop", {
            conversationId: data.conversationId,
            userId,
        });
    }
    async handleJoinConversation(client, data) {
        client.join(`conversation:${data.conversationId}`);
        await this.messagesService.updateMessageStatus(data.conversationId, client.data.userId, "read");
        return { success: true };
    }
    async handleMarkRead(client, data) {
        const userId = client.data.userId;
        const readAt = new Date().toISOString();
        await this.conversationsService.markAsRead(data.conversationId, userId);
        this.server
            .to(`conversation:${data.conversationId}`)
            .emit("conversation:read", {
            conversationId: data.conversationId,
            userId,
        });
        try {
            const supabase = this.messagesService.supabaseService?.getClient?.();
            if (supabase) {
                const { data: msgs } = await supabase
                    .from("messages")
                    .select("id, sender_id")
                    .eq("conversation_id", data.conversationId)
                    .neq("sender_id", userId)
                    .neq("status", "read");
                if (msgs && msgs.length > 0) {
                    await supabase
                        .from("messages")
                        .update({ status: "read" })
                        .eq("conversation_id", data.conversationId)
                        .neq("sender_id", userId);
                    const senderIds = [...new Set(msgs.map((m) => m.sender_id))];
                    senderIds.forEach((senderId) => {
                        const senderSocketId = this.connectedUsers.get(senderId);
                        if (senderSocketId) {
                            const senderMsgs = msgs.filter((m) => m.sender_id === senderId);
                            senderMsgs.forEach((m) => {
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
        }
        catch (err) {
            console.error("Failed to emit message:status on read", err);
        }
    }
    notifyNewConversation(userId, conversation) {
        const socketId = this.connectedUsers.get(userId);
        if (socketId) {
            const targetSocket = this.server.sockets.sockets.get(socketId);
            if (targetSocket) {
                targetSocket.join(`conversation:${conversation.id}`);
            }
            this.server.to(socketId).emit("conversation:new", conversation);
        }
    }
    joinUserToConversation(userId, conversationId) {
        const socketId = this.connectedUsers.get(userId);
        if (socketId) {
            const targetSocket = this.server.sockets.sockets.get(socketId);
            if (targetSocket) {
                targetSocket.join(`conversation:${conversationId}`);
            }
        }
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)("message:send"),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleSendMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("message:edit"),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleEditMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("message:delete"),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleDeleteMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("message:reaction"),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleReaction", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("typing:start"),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleTypingStart", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("typing:stop"),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleTypingStop", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("conversation:join"),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleJoinConversation", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("conversation:read"),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleMarkRead", null);
exports.ChatGateway = ChatGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:3000",
            credentials: true,
        },
        namespace: "/",
    }),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => conversations_service_1.ConversationsService))),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        messages_service_1.MessagesService,
        users_service_1.UsersService,
        conversations_service_1.ConversationsService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map