import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

export interface UserWithMessages {
  id: string; // Changed to string for UUID support
  username: string;
  email: string;
  online: boolean;
  last_seen_at: string;
  lastMessage?: {
    id: number;
    content: string;
    sent_at: string;
    sender_id: string; // Changed to string for UUID support
    receiver_id: string; // Changed to string for UUID support
  };
  unreadCount: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [IonicModule, CommonModule],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit {
  currentUser: any;
  users: UserWithMessages[] = [];
  loading = false;
  error = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private apiService: ApiService
  ) { }

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.loadUsers();
  }

  loadUsers(event?: any) {
    if (!event) {
      this.loading = true;
    }
    this.error = '';
    
    this.apiService.getUsersWithMessages().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
        if (event) {
          event.target.complete();
        }
      },
      error: (error) => {
        this.error = 'Failed to load users';
        this.loading = false;
        if (event) {
          event.target.complete();
        }
      }
    });
  }

  openChat(user: UserWithMessages) {
    
    this.router.navigate(['/chat', user.id]).then(
      (success) => console.log('✅ Navigation successful:', success),
      (error) => console.error('❌ Navigation failed:', error)
    ).catch(err => console.error('🚨 Navigation error:', err));
  }

  formatLastMessageTime(timestamp: string): string {
    if (!timestamp) return '';
    
    const messageDate = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes <= 1 ? 'now' : `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d`;
    }
  }

  getLastMessagePreview(user: UserWithMessages): string {
    if (!user.lastMessage) return 'No messages yet';
    
    // Convert both to string for UUID comparison
    const isFromMe = user.lastMessage.sender_id === this.currentUser?.id?.toString();
    const prefix = isFromMe ? 'You: ' : '';
    const content = user.lastMessage.content;
    
    return prefix + (content.length > 35 ? content.substring(0, 35) + '...' : content);
  }

  // Get total unread messages count
  getTotalUnreadCount(): number {
    return this.users.reduce((total, user) => total + (user.unreadCount || 0), 0);
  }

  // Generate dynamic avatar gradients based on username
  getAvatarGradient(username: string): string {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    ];
    
    // Simple hash function to consistently assign gradient
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  }

  // Format last seen time for user status
  formatLastSeen(timestamp: string): string {
    if (!timestamp) return 'Last seen unknown';
    
    const lastSeenDate = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${Math.floor(diffInMinutes)}m ago`;
    
    const diffInHours = diffInMinutes / 60;
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    
    const diffInDays = diffInHours / 24;
    if (diffInDays < 7) return `${Math.floor(diffInDays)}d ago`;
    
    return lastSeenDate.toLocaleDateString();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}