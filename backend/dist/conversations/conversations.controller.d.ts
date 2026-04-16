import { ConversationsService } from './conversations.service';
export declare class ConversationsController {
    private conversationsService;
    constructor(conversationsService: ConversationsService);
    getUserConversations(req: any): Promise<{
        last_read_at: any;
        is_muted: any;
        is_archived: any;
        length: number;
        toString(): string;
        toLocaleString(): string;
        toLocaleString(locales: string | string[], options?: Intl.NumberFormatOptions & Intl.DateTimeFormatOptions): string;
        pop(): {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        };
        push(...items: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }[]): number;
        concat(...items: ConcatArray<{
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }>[]): {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }[];
        concat(...items: ({
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        } | ConcatArray<{
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }>)[]): {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }[];
        join(separator?: string): string;
        reverse(): {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }[];
        shift(): {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        };
        slice(start?: number, end?: number): {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }[];
        sort(compareFn?: (a: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }, b: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }) => number): {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }[];
        splice(start: number, deleteCount?: number): {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }[];
        splice(start: number, deleteCount: number, ...items: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }[]): {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }[];
        unshift(...items: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }[]): number;
        indexOf(searchElement: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }, fromIndex?: number): number;
        lastIndexOf(searchElement: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }, fromIndex?: number): number;
        every<S extends {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }>(predicate: (value: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }, index: number, array: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }[]) => value is S, thisArg?: any): this is S[];
        every(predicate: (value: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }, index: number, array: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }[]) => unknown, thisArg?: any): boolean;
        some(predicate: (value: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }, index: number, array: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }[]) => unknown, thisArg?: any): boolean;
        forEach(callbackfn: (value: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }, index: number, array: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }[]) => void, thisArg?: any): void;
        map<U>(callbackfn: (value: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }, index: number, array: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }[]) => U, thisArg?: any): U[];
        filter<S extends {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }>(predicate: (value: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }, index: number, array: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }[]) => value is S, thisArg?: any): S[];
        filter(predicate: (value: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }, index: number, array: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }[]) => unknown, thisArg?: any): {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }[];
        reduce(callbackfn: (previousValue: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }, currentValue: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }, currentIndex: number, array: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }[]) => {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }): {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        };
        reduce(callbackfn: (previousValue: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }, currentValue: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }, currentIndex: number, array: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }[]) => {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }, initialValue: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }): {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        };
        reduce<U>(callbackfn: (previousValue: U, currentValue: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }, currentIndex: number, array: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }[]) => U, initialValue: U): U;
        reduceRight(callbackfn: (previousValue: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }, currentValue: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }, currentIndex: number, array: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }[]) => {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }): {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        };
        reduceRight(callbackfn: (previousValue: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }, currentValue: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }, currentIndex: number, array: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }[]) => {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }, initialValue: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }): {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        };
        reduceRight<U>(callbackfn: (previousValue: U, currentValue: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }, currentIndex: number, array: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }[]) => U, initialValue: U): U;
        find<S extends {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }>(predicate: (value: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }, index: number, obj: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }[]) => value is S, thisArg?: any): S;
        find(predicate: (value: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }, index: number, obj: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }[]) => unknown, thisArg?: any): {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        };
        findIndex(predicate: (value: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }, index: number, obj: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }[]) => unknown, thisArg?: any): number;
        fill(value: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }, start?: number, end?: number): {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }[];
        copyWithin(target: number, start: number, end?: number): {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }[];
        entries(): ArrayIterator<[number, {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }]>;
        keys(): ArrayIterator<number>;
        values(): ArrayIterator<{
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }>;
        includes(searchElement: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }, fromIndex?: number): boolean;
        flatMap<U, This = undefined>(callback: (this: This, value: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }, index: number, array: {
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }[]) => U | readonly U[], thisArg?: This): U[];
        flat<A, D extends number = 1>(this: A, depth?: D): FlatArray<A, D>[];
        [Symbol.iterator](): ArrayIterator<{
            id: any;
            type: any;
            name: any;
            avatar_url: any;
            description: any;
            last_message_at: any;
            created_at: any;
            last_message: {
                id: any;
                content: any;
                type: any;
                sender_id: any;
                created_at: any;
            }[];
            participants: {
                user: {
                    id: any;
                    username: any;
                    full_name: any;
                    avatar_url: any;
                    status: any;
                    last_seen: any;
                }[];
            }[];
        }>;
        [Symbol.unscopables]: {
            [x: number]: boolean;
            length?: boolean;
            toString?: boolean;
            toLocaleString?: boolean;
            pop?: boolean;
            push?: boolean;
            concat?: boolean;
            join?: boolean;
            reverse?: boolean;
            shift?: boolean;
            slice?: boolean;
            sort?: boolean;
            splice?: boolean;
            unshift?: boolean;
            indexOf?: boolean;
            lastIndexOf?: boolean;
            every?: boolean;
            some?: boolean;
            forEach?: boolean;
            map?: boolean;
            filter?: boolean;
            reduce?: boolean;
            reduceRight?: boolean;
            find?: boolean;
            findIndex?: boolean;
            fill?: boolean;
            copyWithin?: boolean;
            entries?: boolean;
            keys?: boolean;
            values?: boolean;
            includes?: boolean;
            flatMap?: boolean;
            flat?: boolean;
            [Symbol.iterator]?: boolean;
            readonly [Symbol.unscopables]?: boolean;
        };
    }[]>;
    findOrCreateDirect(targetUserId: string, req: any): Promise<{
        id: any;
        type: any;
        name: any;
        avatar_url: any;
        description: any;
        last_message_at: any;
        created_at: any;
        last_message: {
            id: any;
            content: any;
            type: any;
            sender_id: any;
            created_at: any;
        }[];
        participants: {
            user: {
                id: any;
                username: any;
                full_name: any;
                avatar_url: any;
                status: any;
                last_seen: any;
            }[];
            role: any;
            last_read_at: any;
        }[];
    }>;
    createGroup(body: {
        name: string;
        participantIds: string[];
        description?: string;
    }, req: any): Promise<{
        id: any;
        type: any;
        name: any;
        avatar_url: any;
        description: any;
        last_message_at: any;
        created_at: any;
        last_message: {
            id: any;
            content: any;
            type: any;
            sender_id: any;
            created_at: any;
        }[];
        participants: {
            user: {
                id: any;
                username: any;
                full_name: any;
                avatar_url: any;
                status: any;
                last_seen: any;
            }[];
            role: any;
            last_read_at: any;
        }[];
    }>;
    getConversation(id: string, req: any): Promise<{
        id: any;
        type: any;
        name: any;
        avatar_url: any;
        description: any;
        last_message_at: any;
        created_at: any;
        last_message: {
            id: any;
            content: any;
            type: any;
            sender_id: any;
            created_at: any;
        }[];
        participants: {
            user: {
                id: any;
                username: any;
                full_name: any;
                avatar_url: any;
                status: any;
                last_seen: any;
            }[];
            role: any;
            last_read_at: any;
        }[];
    }>;
    markAsRead(id: string, req: any): Promise<{
        success: boolean;
    }>;
}
