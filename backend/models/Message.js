const supabase = require('../config/db');
const logger = require('../utils/logger');

module.exports = {
  async create({ sender_id, receiver_id, content }) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{ 
          sender_id, 
          receiver_id, 
          content: content.trim(),
          sent_at: new Date().toISOString()
        }])
        .select('*');

      if (error) {
        logger.error('Database error creating message:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        throw new Error('Failed to create message - no data returned');
      }

      return data[0];
    } catch (error) {
      logger.error('Error in Message.create:', error);
      throw error;
    }
  },

  async getConversation(user1Id, user2Id, limit = 50, offset = 0) {
    try {
      const query = supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${user1Id},receiver_id.eq.${user2Id}),` +
          `and(sender_id.eq.${user2Id},receiver_id.eq.${user1Id})`
        )
        .order('sent_at', { ascending: true });
      
      // Add pagination if needed
      if (limit && offset !== undefined) {
        query.range(offset, offset + limit - 1);
      }
      
      const { data, error } = await query;
      
      if (error) {
        logger.error('Database error getting conversation:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      logger.error('Error in Message.getConversation:', error);
      throw error;
    }
  },

  async markAsRead(messageId, userId) {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId)
        .eq('receiver_id', userId);
      
      if (error) {
        logger.error('Database error marking message as read:', error);
        throw error;
      }
    } catch (error) {
      logger.error('Error in Message.markAsRead:', error);
      throw error;
    }
  },

  async markAsDelivered(messageId) {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ delivered_at: new Date().toISOString() })
        .eq('id', messageId);
      
      if (error) {
        logger.error('Database error marking message as delivered:', error);
        throw error;
      }
    } catch (error) {
      logger.error('Error in Message.markAsDelivered:', error);
      throw error;
    }
  },

  async getUnreadCount(userId, fromUserId = null) {
    try {
      let query = supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .eq('receiver_id', userId)
        .is('read_at', null);
      
      if (fromUserId) {
        query = query.eq('sender_id', fromUserId);
      }
      
      const { count, error } = await query;
      
      if (error) {
        logger.error('Database error getting unread count:', error);
        throw error;
      }
      
      return count || 0;
    } catch (error) {
      logger.error('Error in Message.getUnreadCount:', error);
      throw error;
    }
  },

  async getLastMessage(user1Id, user2Id) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${user1Id},receiver_id.eq.${user2Id}),` +
          `and(sender_id.eq.${user2Id},receiver_id.eq.${user1Id})`
        )
        .order('sent_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
        logger.error('Database error getting last message:', error);
        throw error;
      }
      
      return data || null;
    } catch (error) {
      logger.error('Error in Message.getLastMessage:', error);
      throw error;
    }
  },

  async markConversationAsRead(user1Id, user2Id) {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('sender_id', user2Id)
        .eq('receiver_id', user1Id)
        .is('read_at', null);
      
      if (error) {
        logger.error('Database error marking conversation as read:', error);
        throw error;
      }
    } catch (error) {
      logger.error('Error in Message.markConversationAsRead:', error);
      throw error;
    }
  }
};