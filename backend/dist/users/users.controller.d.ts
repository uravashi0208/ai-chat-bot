import { UsersService } from "./users.service";
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    search(query: string, req: any): Promise<{
        id: any;
        username: any;
        full_name: any;
        avatar_url: any;
        about: any;
        status: any;
        last_seen: any;
    }[]>;
    getContacts(req: any): Promise<{
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
    addContact(contactId: string, nickname: string, req: any): Promise<any>;
    updateProfile(body: any, req: any): Promise<{
        id: any;
        username: any;
        full_name: any;
        email: any;
        phone: any;
        avatar_url: any;
        about: any;
        status: any;
    }>;
    findOne(id: string): Promise<{
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
}
