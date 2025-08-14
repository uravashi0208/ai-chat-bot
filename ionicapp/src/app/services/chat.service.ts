import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

export interface User {
  id: string; // Changed to string to support UUID
  username: string;
  email: string;
  online: boolean;
  lastSeen?: string;
}

export interface Message {
  id: number;
  sender_id: string; // Changed to string to support UUID
  receiver_id: string; // Changed to string to support UUID
  content: string;
  sent_at: string;
  sending?: boolean;
  read?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private socket: Socket;
  private messagesSubject = new BehaviorSubject<Message[]>([]);
  private usersSubject = new BehaviorSubject<User[]>([]);
  private selectedUserSubject = new BehaviorSubject<User | null>(null);
  
  public messages$ = this.messagesSubject.asObservable();
  public users$ = this.usersSubject.asObservable();
  public selectedUser$ = this.selectedUserSubject.asObservable();

  constructor() {
    // Use environment configuration for the server URL
    this.socket = io(environment.socketUrl);
    
    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });
    
    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });
    
    this.socket.on('receive_message', (message: Message) => {
      const currentMessages = this.messagesSubject.value;
      this.messagesSubject.next([...currentMessages, message]);
    });
    
    this.socket.on('user_list', (users: User[]) => {
      this.usersSubject.next(users);
    });
    
    this.socket.on('message_history', (messages: Message[]) => {
      this.messagesSubject.next(messages);
    });
    
    // Initialize with some mock data only for testing
    // this.initializeMockData(); // Disabled to prevent interference
  }
  
  private initializeMockData() {
    const mockUsers: User[] = [
      { id: '1', username: 'User1', email: 'user1@example.com', online: true },
      { id: '2', username: 'User2', email: 'user2@example.com', online: true },
      { id: '3', username: 'User3', email: 'user3@example.com', online: false, lastSeen: '2023-05-01T12:00:00Z' },
      { id: '4', username: 'User4', email: 'user4@example.com', online: true }
    ];

    const mockMessages: Message[] = [
      { id: 1, sender_id: '2', receiver_id: '1', content: 'Hello there!', sent_at: '2023-05-01T10:00:00Z' },
      { id: 2, sender_id: '1', receiver_id: '2', content: 'Hi! How are you?', sent_at: '2023-05-01T10:01:00Z' }
    ];
    
    this.usersSubject.next(mockUsers);
    this.messagesSubject.next(mockMessages);
  }
  
  setSelectedUser(user: User | null) {
    this.selectedUserSubject.next(user);
    
    // Request message history for the selected user
    if (user) {
      this.socket.emit('get_message_history', user.id);
    }
  }
  
  getSelectedUser(): Observable<User | null> {
    return this.selectedUser$;
  }
  
  getUsers(): Observable<User[]> {
    return this.users$;
  }
  
  getMessages(): Observable<Message[]> {
    return this.messages$;
  }
  
  sendMessage(message: Omit<Message, 'id' | 'sent_at' | 'sending'>) {
    const newMessage: Message = {
      ...message,
      id: Date.now(),
      sent_at: new Date().toISOString(),
      sending: true
    };
    
    // Add to local messages immediately
    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, newMessage]);
    
    // Emit to server
    this.socket.emit('send_message', newMessage, (response: any) => {
      if (response?.success) {
        // Update the message with the server response
        const updatedMessages = this.messagesSubject.value.map(msg =>
          msg.id === newMessage.id ? { ...response.message, sending: false } : msg
        );
        this.messagesSubject.next(updatedMessages);
      } else {
        // Handle error - remove the message or mark as failed
        const updatedMessages = this.messagesSubject.value.map(msg =>
          msg.id === newMessage.id ? { ...msg, sending: false } : msg
        );
        this.messagesSubject.next(updatedMessages);
      }
    });
  }
  
  // Request user list from server
  requestUsers() {
    this.socket.emit('get_user_list');
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}