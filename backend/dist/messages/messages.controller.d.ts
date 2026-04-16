import { MessagesService } from './messages.service';
export declare class MessagesController {
    private messagesService;
    constructor(messagesService: MessagesService);
    getMessages(conversationId: string, limit: string, before: string, req: any): Promise<{
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
        reactions: {
            id: any;
            emoji: any;
            user_id: any;
        }[];
    }[]>;
    sendMessage(conversationId: string, body: {
        content: string;
        type?: string;
        mediaUrl?: string;
        mediaThumbnail?: string;
        mediaSize?: number;
        mediaDuration?: number;
        replyToId?: string;
        isForwarded?: boolean;
    }, req: any): Promise<{
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
    }>;
    editMessage(messageId: string, content: string, req: any): Promise<any>;
    deleteMessage(messageId: string, req: any): Promise<any>;
    addReaction(messageId: string, emoji: string, req: any): Promise<any>;
    removeReaction(messageId: string, emoji: string, req: any): Promise<{
        success: boolean;
    }>;
}
