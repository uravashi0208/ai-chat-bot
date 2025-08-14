import { Component, OnInit, ViewChild, OnDestroy, ChangeDetectorRef, AfterViewChecked } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { ChatService, User, Message } from '../services/chat.service';
import { ApiService } from '../services/api.service';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [IonicModule, FormsModule,CommonModule],
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
})
export class ChatPage implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('content', { static: false }) content!: IonContent;

  currentUser: any;
  users: User[] = [];
  filteredUsers: User[] = [];
  messages: Message[] = [];
  selectedUser: User | null = null;
  inputValue: string = '';
  searchTerm: string = '';
  connectionStatus: string = 'connecting';
  isTyping: boolean = false;
  messagesLoading: boolean = false;
  private shouldScroll: boolean = false;
  private scrollTimeout: any = null;
  
  private usersSubscription!: Subscription;
  private messagesSubscription!: Subscription;
  private selectedUserSubscription!: Subscription;

  constructor(
    private router: Router,
    public route: ActivatedRoute, // Made public for template access
    private chatService: ChatService,
    private authService: AuthService,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) { 
    console.log('🏗️  Chat component constructor called!');
  }

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    
    // Check if userId is provided in route params
    const userIdParam = this.route.snapshot.paramMap.get('userId');
    
    if (userIdParam) {
      // For direct user navigation, don't subscribe to chat service
      // Don't parseInt - UUID is a string!
      this.loadSpecificUserChat(userIdParam);
    } else {
      // If no userId, redirect to dashboard
      this.router.navigate(['/dashboard']);
    }
  }
  
  onSearchTermChange() {
    if (!this.searchTerm) {
      this.filteredUsers = this.users;
    } else {
      this.filteredUsers = this.users.filter(user =>
        user.username.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  ngOnDestroy() {
    console.log('🔚 Chat page destroyed - cleaning up');
    
    // Clear scroll timeout
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = null;
    }
    
    if (this.usersSubscription) {
      this.usersSubscription.unsubscribe();
    }
    
    if (this.messagesSubscription) {
      this.messagesSubscription.unsubscribe();
    }
    
    if (this.selectedUserSubscription) {
      this.selectedUserSubscription.unsubscribe();
    }
  }

  ionViewDidEnter() {
    console.log('🎬 ionViewDidEnter - starting scroll');
    // Simple scroll when view enters
    this.shouldScroll = true;
    
    // Just two scroll attempts - enough but not overwhelming
    setTimeout(() => this.forceScrollToBottom(), 300);
    setTimeout(() => this.forceScrollToBottom(), 800);
  }

  ngAfterViewChecked() {
    if (this.shouldScroll && this.content) {
      this.forceScrollToBottom();
      this.shouldScroll = false;
    }
  }

  selectUser(user: User | null) {
    this.chatService.setSelectedUser(user);
    if (user) {
      this.loadMessagesForUser(user.id);
    }
    this.autoScrollToBottom();
  }
  
  loadSpecificUserChat(userId: string) {
    // Clear previous data
    this.selectedUser = null;
    this.messages = [];
    this.messagesLoading = true;
    
    // First load the user details
    this.apiService.getUsersWithMessages().subscribe({
      next: (users) => {
        // String comparison for UUID
        const targetUser = users.find(user => user.id === userId);
        
        if (targetUser) {
          // Convert to the User interface expected by ChatService
          const chatUser: User = {
            id: targetUser.id,
            username: targetUser.username,
            email: targetUser.email,
            online: targetUser.online,
            lastSeen: targetUser.last_seen_at
          };
          
          // Set the selected user directly - this will trigger the UI to show chat area
          this.selectedUser = chatUser;
          
          // Force change detection to update UI
          this.cdr.detectChanges();
          
          // Load messages for this specific user immediately
          setTimeout(() => {
            this.loadMessagesForUser(userId);
          }, 100);
          
          // Simple scroll for direct user navigation
          setTimeout(() => {
            console.log('🔄 Scroll for direct navigation');
            this.forceScrollToBottom();
          }, 400);
          
          // Also set the users list for navigation if needed
          const chatUsers: User[] = users.map(user => ({
            id: user.id,
            username: user.username,
            email: user.email,
            online: user.online,
            lastSeen: user.last_seen_at
          }));
          
          this.users = chatUsers;
          this.filteredUsers = chatUsers;
        } else {
          this.messagesLoading = false;
          // Show error state
          this.selectedUser = null;
        }
      },
      error: (error) => {
        this.messagesLoading = false;
        this.selectedUser = null;
      }
    });
  }

  goBack() {
    // Check if we came from dashboard with userId parameter
    const userId = this.route.snapshot.paramMap.get('userId');
    if (userId) {
      // Navigate back to dashboard
      this.router.navigate(['/dashboard']);
    } else {
      // Just deselect user
      this.chatService.setSelectedUser(null);
    }
  }

  // Simplified auto-scroll
  autoScrollToBottom() {
    // Just one delayed scroll attempt
    setTimeout(() => this.forceScrollToBottom(), 200);
    
    // Mark for view checked scroll
    this.shouldScroll = true;
  }

  // Simplified and stable scroll method
  scrollToBottom() {
    if (this.content) {
      try {
        // Simple Ionic scroll method
        this.content.scrollToBottom(300);
      } catch (error) {
        console.log('Scroll failed:', error);
      }
    }
  }

  // Single reliable scroll attempt with throttling
  forceScrollToBottom() {
    if (!this.content) return;
    
    // Clear previous timeout to avoid multiple calls
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    
    this.scrollTimeout = setTimeout(() => {
      try {
        // Use Ionic's built-in method - most reliable
        this.content.scrollToBottom(0);
        console.log('📜 Scroll executed');
      } catch (error) {
        console.log('Force scroll failed:', error);
      }
      this.scrollTimeout = null;
    }, 50);
  }

  loadMessagesForUser(userId: string) {
    this.messagesLoading = true;
    this.messages = []; // Clear previous messages
    
    this.apiService.getMessages(userId).subscribe({
      next: (messages) => {
        this.messages = messages || [];
        this.messagesLoading = false;
        this.shouldScroll = true; // Mark for auto-scroll
        
        // Force change detection first
        this.cdr.detectChanges();
        
        // Simple scroll after messages load
        setTimeout(() => {
          console.log('📜 Scrolling to bottom after messages load');
          this.forceScrollToBottom();
        }, 300);
        
        setTimeout(() => {
          this.forceScrollToBottom();
        }, 600);
      },
      error: (error) => {
        this.messages = []; // Clear messages on error
        this.messagesLoading = false;
      }
    });
  }

  sendMessage() {
    if (!this.inputValue.trim() || !this.selectedUser) return;

    const messageContent = this.inputValue;
    this.inputValue = '';

    // Send message via API - userId is now string (UUID)
    this.apiService.sendMessage(this.selectedUser.id.toString(), messageContent).subscribe({
      next: (response) => {
        // Add the message to local messages
        this.messages = [...this.messages, response];
        this.shouldScroll = true; // Mark for auto-scroll
        this.autoScrollToBottom();
      },
      error: (error) => {
        // Restore message content on error
        this.inputValue = messageContent;
      }
    });
  }

  formatMessageTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatLastSeen(lastSeen?: string): string {
    if (!lastSeen) return 'Last seen recently';
    
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffInMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `Last seen ${Math.floor(diffInMinutes)}m ago`;
    
    const diffInHours = diffInMinutes / 60;
    if (diffInHours < 24) return `Last seen ${Math.floor(diffInHours)}h ago`;
    
    const diffInDays = diffInHours / 24;
    if (diffInDays < 7) return `Last seen ${Math.floor(diffInDays)}d ago`;
    
    return `Last seen ${lastSeenDate.toLocaleDateString()}`;
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

  // Enhanced input interaction methods
  onTyping() {
    // You can add typing indicator logic here
    // For now, just handle the input change
  }

  onInputFocus() {
    // Scroll to bottom when input is focused
    setTimeout(() => this.forceScrollToBottom(), 300);
  }

  onInputBlur() {
    // Handle input blur if needed
  }

  logout() {
    this.chatService.disconnect();
    this.router.navigate(['/login']);
  }

}