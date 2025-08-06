import React, { useState, useEffect, useRef } from 'react';
import {
  IonContent,
  IonItem,
  IonInput,
  IonButton,
  IonIcon,
  IonList,
  IonText,
  IonSpinner,
  IonAvatar,
  IonActionSheet
} from '@ionic/react';
import {
  sendOutline,
  attachOutline,
  happyOutline,
  checkmarkOutline,
  checkmarkDoneOutline,
  timeOutline
} from 'ionicons/icons';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { Socket } from 'socket.io-client';
import { getMessages, sendMessage, markMessagesAsRead } from '../services/chatService';
import { useToast } from '../hooks/useToast';
import type { User, Message } from '../services/chatService';

interface ChatViewProps {
  selectedUser: User;
  currentUser: User;
  socket: Socket | null;
}

const ChatView: React.FC<ChatViewProps> = ({ selectedUser, currentUser, socket }) => {
  const { error: showError, success } = useToast();
  
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);

  // Refs
  const contentRef = useRef<HTMLIonContentElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Utility functions
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (dateString: string) => {
    const date = parseISO(dateString);
    return format(date, 'h:mm a');
  };

  const formatDateHeader = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, MMM d');
  };

  const shouldShowDateHeader = (message: Message, index: number) => {
    if (index === 0) return true;
    
    const currentDate = parseISO(message.sent_at).toDateString();
    const previousDate = parseISO(messages[index - 1].sent_at).toDateString();
    
    return currentDate !== previousDate;
  };

  // Fetch messages
  const fetchMessages = async () => {
    try {
      setLoading(true);
      const messagesList = await getMessages(selectedUser.id);
      setMessages(messagesList);
      
      // Mark messages as read
      await markMessagesAsRead(selectedUser.id);
      
      console.log(`✅ Loaded ${messagesList.length} messages`);
    } catch (err: any) {
      console.error('Failed to fetch messages:', err);
      showError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  // Send message
  const handleSend = async () => {
    if (!inputValue.trim() || sending) return;

    const messageContent = inputValue.trim();
    const tempId = `temp-${Date.now()}`;

    // Optimistic update
    const tempMessage: Message = {
      id: tempId,
      sender_id: currentUser.id,
      receiver_id: selectedUser.id,
      content: messageContent,
      sent_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempMessage]);
    setInputValue('');
    setSending(true);

    try {
      if (socket && socket.connected) {
        // Use socket for real-time messaging
        socket.emit('send_message', {
          receiverId: selectedUser.id,
          content: messageContent,
          tempId
        }, (response: any) => {
          if (response?.success) {
            setMessages(prev =>
              prev.map(msg =>
                msg.id === tempId ? response.message : msg
              )
            );
          } else {
            // Fallback to HTTP API
            sendViaAPI(messageContent, tempId);
          }
          setSending(false);
        });
      } else {
        // Fallback to HTTP API
        await sendViaAPI(messageContent, tempId);
      }
    } catch (err: any) {
      console.error('Failed to send message:', err);
      
      // Remove failed message
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      setInputValue(messageContent); // Restore input
      showError('Failed to send message');
      setSending(false);
    }
  };

  const sendViaAPI = async (content: string, tempId: string) => {
    try {
      const newMessage = await sendMessage({
        receiverId: selectedUser.id,
        content
      });

      setMessages(prev =>
        prev.map(msg =>
          msg.id === tempId ? newMessage : msg
        )
      );
    } catch (err) {
      throw err; // Re-throw to be caught by handleSend
    }
  };

  // Handle socket messages
  useEffect(() => {
    if (!socket || !currentUser?.id) return;

    const handleNewMessage = (message: Message) => {
      console.log('📩 Received message:', message);
      
      // Only add if it's from the selected user to current user
      if (message.sender_id === selectedUser.id && message.receiver_id === currentUser.id) {
        setMessages(prev => {
          // Check for duplicates
          if (prev.some(msg => msg.id === message.id)) {
            return prev;
          }
          
          return [...prev, message].sort((a, b) =>
            new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
          );
        });
        
        // Mark as read
        markMessagesAsRead(selectedUser.id);
      }
    };

    socket.on('receive_message', handleNewMessage);

    return () => {
      socket.off('receive_message', handleNewMessage);
    };
  }, [socket, selectedUser.id, currentUser?.id]);

  // Initialize and cleanup
  useEffect(() => {
    fetchMessages();
  }, [selectedUser.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Group messages by date
  const groupedMessages = messages.reduce((acc, message, index) => {
    if (shouldShowDateHeader(message, index)) {
      acc.push({
        type: 'date',
        content: formatDateHeader(message.sent_at),
        id: `date-${message.sent_at}`
      });
    }
    
    acc.push({
      type: 'message',
      content: message,
      id: message.id
    });
    
    return acc;
  }, [] as Array<{ type: 'date' | 'message'; content: any; id: string }>);

  return (
    <>
      <IonContent ref={contentRef} style={{ '--padding-bottom': '80px' }}>
        {loading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '200px' 
          }}>
            <IonSpinner />
          </div>
        ) : (
          <div style={{ padding: '1rem' }}>
            {groupedMessages.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem',
                color: 'var(--ion-color-medium)' 
              }}>
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              groupedMessages.map((item) => {
                if (item.type === 'date') {
                  return (
                    <div 
                      key={item.id}
                      style={{ 
                        textAlign: 'center', 
                        margin: '1rem 0',
                        color: 'var(--ion-color-medium)',
                        fontSize: '0.9rem'
                      }}
                    >
                      {item.content}
                    </div>
                  );
                }

                const message = item.content as Message;
                const isSent = message.sender_id === currentUser.id;
                
                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      justifyContent: isSent ? 'flex-end' : 'flex-start',
                      marginBottom: '0.5rem',
                      alignItems: 'flex-end',
                      gap: '8px'
                    }}
                  >
                    {!isSent && (
                      <IonAvatar style={{ width: '32px', height: '32px' }}>
                        <div className="user-avatar" style={{ fontSize: '0.9rem' }}>
                          {selectedUser.username.charAt(0).toUpperCase()}
                        </div>
                      </IonAvatar>
                    )}
                    
                    <div
                      className={`message-bubble ${isSent ? 'message-sent' : 'message-received'}`}
                      style={{ maxWidth: '70%' }}
                    >
                      <p style={{ margin: '0', wordBreak: 'break-word' }}>
                        {message.content}
                      </p>
                      
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginTop: '4px',
                        fontSize: '0.75rem',
                        opacity: 0.7
                      }}>
                        <span>{formatMessageTime(message.sent_at)}</span>
                        
                        {isSent && (
                          <IonIcon 
                            icon={message.read_at ? checkmarkDoneOutline : checkmarkOutline}
                            style={{ fontSize: '0.9rem', marginLeft: '4px' }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </IonContent>

      {/* Message Input */}
      <div style={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        background: 'var(--ion-background-color)',
        borderTop: '1px solid var(--ion-color-light)',
        padding: '0.5rem',
        zIndex: 1000
      }}>
        <IonItem>
          <IonButton 
            fill="clear" 
            slot="start"
            onClick={() => setIsActionSheetOpen(true)}
          >
            <IonIcon icon={attachOutline} />
          </IonButton>
          
          <IonInput
            value={inputValue}
            onIonInput={(e) => setInputValue(e.detail.value!)}
            placeholder={`Message ${selectedUser.username}...`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          
          <IonButton 
            fill="clear" 
            slot="end"
            onClick={handleSend}
            disabled={!inputValue.trim() || sending}
          >
            {sending ? (
              <IonSpinner name="crescent" />
            ) : (
              <IonIcon icon={sendOutline} />
            )}
          </IonButton>
        </IonItem>
      </div>

      {/* Attachment Action Sheet */}
      <IonActionSheet
        isOpen={isActionSheetOpen}
        onDidDismiss={() => setIsActionSheetOpen(false)}
        buttons={[
          {
            text: 'Photo',
            icon: 'camera-outline',
            handler: () => {
              console.log('Photo selected');
            }
          },
          {
            text: 'File',
            icon: 'document-outline',
            handler: () => {
              console.log('File selected');
            }
          },
          {
            text: 'Cancel',
            role: 'cancel'
          }
        ]}
      />
    </>
  );
};

export default ChatView;