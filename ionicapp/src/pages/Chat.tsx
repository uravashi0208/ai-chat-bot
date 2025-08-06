import React, { useState, useEffect, useRef } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonBadge,
  IonSearchbar,
  IonButton,
  IonIcon,
  IonText,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonSplitPane,
  IonMenu,
  IonMenuButton,
  IonButtons
} from '@ionic/react';
import {
  chatbubbleOutline,
  personOutline,
  logOutOutline,
  searchOutline,
  ellipsisVerticalOutline,
  checkmarkCircleOutline,
  timeOutline
} from 'ionicons/icons';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { useToast } from '../hooks/useToast';
import { getUsers, getMessages, sendMessage, markMessagesAsRead } from '../services/chatService';
import type { User, Message } from '../services/chatService';
import ChatView from '../components/ChatView';

const Chat: React.FC = () => {
  const { user, logout } = useAuth();
  const { socket, isConnected, connectionError } = useSocket();
  const { success, error: showError, info } = useToast();

  // State
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Refs
  const refresherRef = useRef<HTMLIonRefresherElement>(null);

  // Fetch users
  const fetchUsers = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      
      const usersList = await getUsers();
      setUsers(usersList);
      
      console.log(`✅ Loaded ${usersList.length} users`);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      showError('Failed to load users. Please try again.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = async (event: CustomEvent) => {
    setRefreshing(true);
    await fetchUsers(false);
    setRefreshing(false);
    event.detail.complete();
  };

  // Handle user selection
  const handleUserSelect = async (selectedUser: User) => {
    setSelectedUser(selectedUser);
    
    try {
      // Mark messages as read
      await markMessagesAsRead(selectedUser.id);
      
      // Update user's unread count in the list
      setUsers(prev => 
        prev.map(u => 
          u.id === selectedUser.id 
            ? { ...u, unreadCount: 0 }
            : u
        )
      );
    } catch (err) {
      console.error('Failed to mark messages as read:', err);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      success('Successfully logged out');
    } catch (err) {
      showError('Failed to logout');
    }
  };

  // Filter users based on search
  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Initialize
  useEffect(() => {
    fetchUsers();
  }, []);

  // Socket connection status display
  const getConnectionStatus = () => {
    if (!socket) return { color: 'medium', text: 'Disconnected', icon: timeOutline };
    if (isConnected) return { color: 'success', text: 'Connected', icon: checkmarkCircleOutline };
    if (connectionError) return { color: 'danger', text: 'Error', icon: timeOutline };
    return { color: 'warning', text: 'Connecting...', icon: timeOutline };
  };

  const connectionStatus = getConnectionStatus();

  return (
    <IonPage>
      <IonSplitPane contentId="chat-content" when="md">
        {/* Sidebar */}
        <IonMenu contentId="chat-content">
          <IonContent>
            {/* User Info */}
            <div style={{ 
              padding: '1rem', 
              background: 'linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-secondary))',
              color: 'white',
              textAlign: 'center'
            }}>
              <IonAvatar style={{ margin: '0 auto 0.5rem auto', width: '60px', height: '60px' }}>
                <div className="user-avatar" style={{ width: '100%', height: '100%', fontSize: '1.5rem' }}>
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
              </IonAvatar>
              <h3 style={{ margin: '0' }}>{user?.username}</h3>
              <p style={{ margin: '0.25rem 0 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
                <IonIcon icon={connectionStatus.icon} style={{ marginRight: '4px' }} />
                {connectionStatus.text}
              </p>
            </div>

            {/* Search */}
            <div style={{ padding: '1rem 1rem 0 1rem' }}>
              <IonSearchbar
                value={searchTerm}
                onIonInput={(e) => setSearchTerm(e.detail.value!)}
                placeholder="Search users..."
                showClearButton="focus"
              />
            </div>

            {/* User List */}
            <IonList>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <IonSpinner />
                  <p>Loading users...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <IonIcon icon={personOutline} style={{ fontSize: '3rem', opacity: 0.5 }} />
                  <p>{searchTerm ? 'No users found' : 'No users available'}</p>
                </div>
              ) : (
                filteredUsers.map((userItem) => (
                  <IonItem 
                    key={userItem.id}
                    button
                    onClick={() => handleUserSelect(userItem)}
                    className={selectedUser?.id === userItem.id ? 'selected' : ''}
                  >
                    <IonAvatar slot="start">
                      <div className="user-avatar">
                        {userItem.username.charAt(0).toUpperCase()}
                      </div>
                      {userItem.online && (
                        <div className="online-indicator"></div>
                      )}
                    </IonAvatar>
                    
                    <IonLabel>
                      <h2>{userItem.username}</h2>
                      <p style={{ color: 'var(--ion-color-medium)' }}>
                        {userItem.online ? 'Online' : `Last seen ${userItem.lastSeen || 'recently'}`}
                      </p>
                    </IonLabel>
                    
                    {/* {userItem.unreadCount && userItem.unreadCount > 0 && (
                      <IonBadge color="primary" slot="end">
                        {userItem.unreadCount > 99 ? '99+' : userItem.unreadCount}
                      </IonBadge>
                    )} */}
                  </IonItem>
                ))
              )}
            </IonList>

            {/* Logout Button */}
            <div style={{ padding: '1rem', position: 'absolute', bottom: '0', width: '100%' }}>
              <IonButton 
                expand="block" 
                fill="outline" 
                color="danger"
                onClick={handleLogout}
              >
                <IonIcon icon={logOutOutline} slot="start" />
                Logout
              </IonButton>
            </div>
          </IonContent>
        </IonMenu>

        {/* Main Chat Area */}
        <div id="chat-content">
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonMenuButton />
              </IonButtons>
              
              <IonTitle>
                {selectedUser ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IonAvatar style={{ width: '32px', height: '32px' }}>
                      <div className="user-avatar" style={{ fontSize: '0.9rem' }}>
                        {selectedUser.username.charAt(0).toUpperCase()}
                      </div>
                    </IonAvatar>
                    <div>
                      <div>{selectedUser.username}</div>
                      <small style={{ opacity: 0.7 }}>
                        {selectedUser.online ? 'Online' : 'Offline'}
                      </small>
                    </div>
                  </div>
                ) : (
                  'Select a user to start chatting'
                )}
              </IonTitle>
              
              {selectedUser && (
                <IonButtons slot="end">
                  <IonButton>
                    <IonIcon icon={ellipsisVerticalOutline} />
                  </IonButton>
                </IonButtons>
              )}
            </IonToolbar>
          </IonHeader>

          <IonContent>
            <IonRefresher 
              slot="fixed" 
              ref={refresherRef}
              onIonRefresh={handleRefresh}
            >
              <IonRefresherContent />
            </IonRefresher>

            {selectedUser ? (
              <ChatView 
                selectedUser={selectedUser}
                currentUser={user!}
                socket={socket}
              />
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                padding: '2rem',
                textAlign: 'center'
              }}>
                <IonIcon 
                  icon={chatbubbleOutline} 
                  style={{ 
                    fontSize: '4rem', 
                    color: 'var(--ion-color-medium)',
                    marginBottom: '1rem'
                  }} 
                />
                <h2>Welcome to Chat App</h2>
                <p style={{ color: 'var(--ion-color-medium)' }}>
                  Select a user from the sidebar to start a conversation
                </p>
              </div>
            )}
          </IonContent>
        </div>
      </IonSplitPane>
    </IonPage>
  );
};

export default Chat;