import { OnGatewayConnection, OnGatewayDisconnect } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { JwtService } from "@nestjs/jwt";
import { MessagesService } from "../messages/messages.service";
import { UsersService } from "../users/users.service";
import { ConversationsService } from "../conversations/conversations.service";
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private jwtService;
    private messagesService;
    private usersService;
    private conversationsService;
    server: Server;
    private connectedUsers;
    constructor(jwtService: JwtService, messagesService: MessagesService, usersService: UsersService, conversationsService: ConversationsService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): Promise<void>;
    handleSendMessage(client: Socket, data: {
        conversationId: string;
        content: string;
        type?: string;
        mediaUrl?: string;
        replyToId?: string;
        isForwarded?: boolean;
    }): Promise<{
        success: boolean;
        message: {
            id: any;
            content: any;
            type: any;
            media_url: any;
            media_thumbnail: any;
            media_size: any;
            media_duration: any;
            is_deleted: any;
            is_forwarded: any;
            edited_at: any;
            created_at: any;
            status: any;
            sender: {
                id: any;
                username: any;
                full_name: any;
                avatar_url: any;
            }[];
            reply_to: {
                id: any;
                content: any;
                type: any;
                sender: {
                    id: any;
                    username: any;
                    full_name: any;
                }[];
            }[];
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
    }>;
    handleEditMessage(client: Socket, data: {
        messageId: string;
        conversationId: string;
        content: string;
    }): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
    handleDeleteMessage(client: Socket, data: {
        messageId: string;
        conversationId: string;
    }): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
    handleReaction(client: Socket, data: {
        messageId: string;
        conversationId: string;
        emoji: string;
        action: "add" | "remove";
    }): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
    handleTypingStart(client: Socket, data: {
        conversationId: string;
    }): void;
    handleTypingStop(client: Socket, data: {
        conversationId: string;
    }): void;
    handleJoinConversation(client: Socket, data: {
        conversationId: string;
    }): Promise<{
        success: boolean;
    }>;
    handleMarkRead(client: Socket, data: {
        conversationId: string;
    }): Promise<void>;
    notifyNewConversation(userId: string, conversation: any): void;
    joinUserToConversation(userId: string, conversationId: string): void;
}
