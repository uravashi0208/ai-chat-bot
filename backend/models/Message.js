const supabase = require('../config/db');

module.exports = {
  async create({ sender_id, receiver_id, content }) {
    const { data, error } = await supabase
      .from('messages')
      .insert([{ 
        sender_id, 
        receiver_id, 
        content 
      }])
      .select('*'); // Make sure to select the created record

    if (error) {
      console.error('Database error:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      throw new Error('Failed to create message');
    }

    return data[0];
  },

  async getConversation(user1Id, user2Id) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${user1Id},receiver_id.eq.${user2Id}),` +
        `and(sender_id.eq.${user2Id},receiver_id.eq.${user1Id})`
      )
      .order('sent_at', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async markAsRead(messageId, userId) {
    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('receiver_id', userId);
    
    if (error) throw error;
  },

  async markAsDelivered(messageId) {
    const { error } = await supabase
      .from('messages')
      .update({ delivered_at: new Date().toISOString() })
      .eq('id', messageId);
    
    if (error) throw error;
  }
};