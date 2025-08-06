import { api } from './authService';

// Import shared types
import type { User } from '../types/user';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  sent_at: string;
  read_at?: string;
  edited_at?: string;
  message_type?: 'text' | 'image' | 'file';
  file_url?: string;
  file_name?: string;
  file_size?: number;
}

export interface SendMessageRequest {
  receiverId: string;
  content: string;
  messageType?: 'text' | 'image' | 'file';
  fileData?: FormData;
}

export interface Conversation {
  user: User;
  lastMessage?: Message;
  unreadCount: number;
}

// Export the User type for other components to use
export type { User };

// Chat API functions
export const getUsers = async (): Promise<User[]> => {
  try {
    console.log('👥 Fetching users list');
    
    const response = await api.get('/users');
    
    console.log(`✅ Retrieved ${response.data.length} users`);
    return response.data;
  } catch (error: any) {
    console.error('❌ Failed to fetch users:', error.response?.data || error.message);
    throw error;
  }
};

export const getMessages = async (userId: string, limit: number = 50, offset: number = 0): Promise<Message[]> => {
  try {
    console.log(`💬 Fetching messages with user ${userId}`);
    
    const response = await api.get(`/chat/messages/${userId}`, {
      params: { limit, offset }
    });
    
    console.log(`✅ Retrieved ${response.data.length} messages`);
    return response.data;
  } catch (error: any) {
    console.error('❌ Failed to fetch messages:', error.response?.data || error.message);
    throw error;
  }
};

export const sendMessage = async ({ receiverId, content, messageType = 'text', fileData }: SendMessageRequest): Promise<Message> => {
  try {
    console.log(`📤 Sending message to user ${receiverId}`);
    
    let response;
    
    if (messageType === 'text') {
      response = await api.post('/chat/send', {
        receiverId,
        content,
        messageType
      });
    } else {
      // Handle file uploads
      const formData = fileData || new FormData();
      if (!fileData) {
        formData.append('receiverId', receiverId);
        formData.append('content', content);
        formData.append('messageType', messageType);
      }
      
      response = await api.post('/chat/send', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    
    console.log('✅ Message sent successfully');
    return response.data;
  } catch (error: any) {
    console.error('❌ Failed to send message:', error.response?.data || error.message);
    throw error;
  }
};

export const markMessagesAsRead = async (senderId: string): Promise<void> => {
  try {
    console.log(`👁️ Marking messages as read from user ${senderId}`);
    
    await api.put(`/chat/read/${senderId}`);
    
    console.log('✅ Messages marked as read');
  } catch (error: any) {
    console.error('❌ Failed to mark messages as read:', error.response?.data || error.message);
    throw error;
  }
};

export const getConversations = async (): Promise<Conversation[]> => {
  try {
    console.log('💬 Fetching conversations');
    
    const response = await api.get('/chat/conversations');
    
    console.log(`✅ Retrieved ${response.data.length} conversations`);
    return response.data;
  } catch (error: any) {
    console.error('❌ Failed to fetch conversations:', error.response?.data || error.message);
    throw error;
  }
};

export const searchMessages = async (query: string, userId?: string): Promise<Message[]> => {
  try {
    console.log('🔍 Searching messages:', query);
    
    const response = await api.get('/chat/search', {
      params: { q: query, userId }
    });
    
    console.log(`✅ Found ${response.data.length} matching messages`);
    return response.data;
  } catch (error: any) {
    console.error('❌ Message search failed:', error.response?.data || error.message);
    throw error;
  }
};

export const deleteMessage = async (messageId: string): Promise<void> => {
  try {
    console.log(`🗑️ Deleting message ${messageId}`);
    
    await api.delete(`/chat/message/${messageId}`);
    
    console.log('✅ Message deleted successfully');
  } catch (error: any) {
    console.error('❌ Failed to delete message:', error.response?.data || error.message);
    throw error;
  }
};

export const editMessage = async (messageId: string, newContent: string): Promise<Message> => {
  try {
    console.log(`✏️ Editing message ${messageId}`);
    
    const response = await api.put(`/chat/message/${messageId}`, {
      content: newContent
    });
    
    console.log('✅ Message edited successfully');
    return response.data;
  } catch (error: any) {
    console.error('❌ Failed to edit message:', error.response?.data || error.message);
    throw error;
  }
};

export const uploadFile = async (file: File, receiverId: string): Promise<Message> => {
  try {
    console.log('📎 Uploading file:', file.name);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('receiverId', receiverId);
    formData.append('messageType', file.type.startsWith('image/') ? 'image' : 'file');
    formData.append('content', file.name);
    
    const response = await api.post('/chat/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('✅ File uploaded successfully');
    return response.data;
  } catch (error: any) {
    console.error('❌ File upload failed:', error.response?.data || error.message);
    throw error;
  }
};

export const getUnreadCount = async (): Promise<number> => {
  try {
    console.log('🔢 Fetching unread message count');
    
    const response = await api.get('/chat/unread-count');
    
    console.log(`✅ Unread count: ${response.data.count}`);
    return response.data.count;
  } catch (error: any) {
    console.error('❌ Failed to fetch unread count:', error.response?.data || error.message);
    throw error;
  }
};

export const getUserStatus = async (userId: string): Promise<{ online: boolean; lastSeen?: string }> => {
  try {
    console.log(`📡 Checking status for user ${userId}`);
    
    const response = await api.get(`/users/${userId}/status`);
    
    console.log(`✅ User status: ${response.data.online ? 'online' : 'offline'}`);
    return response.data;
  } catch (error: any) {
    console.error('❌ Failed to fetch user status:', error.response?.data || error.message);
    throw error;
  }
};

// Export types for use in components
export type { User, Message, SendMessageRequest, Conversation };