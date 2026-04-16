import { SupabaseService } from '../supabase/supabase.service';
export declare class MessagesService {
    private supabaseService;
    constructor(supabaseService: SupabaseService);
    getMessages(conversationId: string, userId: string, limit?: number, before?: string): Promise<{
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
    sendMessage(conversationId: string, senderId: string, content: string, type?: string, options?: {
        mediaUrl?: string;
        mediaThumbnail?: string;
        mediaSize?: number;
        mediaDuration?: number;
        replyToId?: string;
        isForwarded?: boolean;
    }): Promise<{
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
    editMessage(messageId: string, userId: string, content: string): Promise<any>;
    deleteMessage(messageId: string, userId: string): Promise<any>;
    addReaction(messageId: string, userId: string, emoji: string): Promise<any>;
    removeReaction(messageId: string, userId: string, emoji: string): Promise<{
        success: boolean;
    }>;
    updateMessageStatus(conversationId: string, userId: string, status: 'delivered' | 'read'): Promise<void>;
}
