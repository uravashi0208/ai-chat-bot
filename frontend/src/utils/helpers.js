import { format, isToday, isYesterday, formatDistanceToNow, differenceInMinutes } from 'date-fns';

export const formatMessageTime = (dateStr) => {
  const date = new Date(dateStr);
  return format(date, 'HH:mm');
};

export const formatConversationTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isToday(date)) return format(date, 'HH:mm');
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'dd/MM/yyyy');
};

export const formatLastSeen = (dateStr, isOnline) => {
  if (isOnline) return 'online';
  if (!dateStr) return 'last seen recently';
  const date = new Date(dateStr);
  if (isToday(date)) return `last seen today at ${format(date, 'HH:mm')}`;
  if (isYesterday(date)) return `last seen yesterday at ${format(date, 'HH:mm')}`;
  return `last seen ${format(date, 'dd/MM/yyyy')}`;
};

export const formatDateDivider = (dateStr) => {
  const date = new Date(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d, yyyy');
};

export const shouldShowDateDivider = (prev, current) => {
  if (!prev) return true;
  const prevDate = new Date(prev.created_at);
  const currDate = new Date(current.created_at);
  return (
    prevDate.getDate() !== currDate.getDate() ||
    prevDate.getMonth() !== currDate.getMonth() ||
    prevDate.getFullYear() !== currDate.getFullYear()
  );
};

export const getConversationName = (conversation, currentUserId) => {
  if (conversation.type === 'group') return conversation.name;
  const other = conversation.participants?.find(
    (p) => p.user?.id !== currentUserId
  );
  return other?.user?.full_name || other?.user?.username || 'Unknown';
};

export const getConversationAvatar = (conversation, currentUserId) => {
  if (conversation.type === 'group') return conversation.avatar_url;
  const other = conversation.participants?.find(
    (p) => p.user?.id !== currentUserId
  );
  return other?.user?.avatar_url;
};

export const getOtherParticipant = (conversation, currentUserId) => {
  if (!conversation?.participants) return null;
  return conversation.participants.find((p) => p.user?.id !== currentUserId);
};

export const getUnreadCount = (conversation, currentUserId) => {
  // This would need server-side calculation, placeholder
  return 0;
};
