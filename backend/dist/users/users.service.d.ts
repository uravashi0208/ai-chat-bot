import { SupabaseService } from '../supabase/supabase.service';
export declare class UsersService {
    private supabaseService;
    constructor(supabaseService: SupabaseService);
    findById(id: string): Promise<{
        id: any;
        username: any;
        full_name: any;
        email: any;
        phone: any;
        avatar_url: any;
        about: any;
        status: any;
        last_seen: any;
        created_at: any;
    }>;
    searchUsers(query: string, currentUserId: string): Promise<{
        id: any;
        username: any;
        full_name: any;
        avatar_url: any;
        about: any;
        status: any;
        last_seen: any;
    }[]>;
    updateProfile(userId: string, updates: any): Promise<{
        id: any;
        username: any;
        full_name: any;
        email: any;
        phone: any;
        avatar_url: any;
        about: any;
        status: any;
    }>;
    updateStatus(userId: string, status: 'online' | 'offline' | 'away'): Promise<void>;
    getContacts(userId: string): Promise<{
        id: any;
        nickname: any;
        is_blocked: any;
        created_at: any;
        contact: {
            id: any;
            username: any;
            full_name: any;
            avatar_url: any;
            about: any;
            status: any;
            last_seen: any;
        }[];
    }[]>;
    addContact(userId: string, contactId: string, nickname?: string): Promise<any>;
}
