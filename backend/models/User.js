const supabase = require('../config/db');

module.exports = {
  async create({ username, email, password_hash }) {
    const { data, error } = await supabase
      .from('users')
      .insert([{ username, email, password_hash }])
      .select('id, username, email, created_at');
    
    if (error) throw error;
    return data[0];
  },

  async findByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) throw error;
    return data;
  },

  async findById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, created_at, last_seen_at,online')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async findByEmailOrUsername(email, username) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq.${email},username.eq.${username}`)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  async findAllExcept(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, last_seen_at,online')
      .neq('id', userId);
    
    if (error) throw error;
    return data;
  },

  async updateLastSeen(userId) {
    const { error } = await supabase
      .from('users')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', userId);
    
    if (error) throw error;
  },

  async updateOnlineStatus(id, online) {
    const { data, error } = await supabase
      .from('users')
      .update({ online })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },

};