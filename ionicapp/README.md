# 📱 Ionic Chat App

A modern, cross-platform chat application built with **Ionic React** and **TypeScript**.

## ✨ Features

- 🔐 **Authentication** - Login/Register with JWT tokens
- 💬 **Real-time Messaging** - Socket.IO integration
- 📱 **Cross-platform** - Works on Web, iOS, and Android
- 🎨 **Modern UI** - Glass morphism design with gradients
- 🌙 **Dark/Light Mode** - Automatic theme support
- 🔄 **Offline Support** - PWA capabilities
- 🔔 **Push Notifications** - Native mobile notifications
- 📤 **File Sharing** - Send images and files
- 👥 **User Management** - Online status and user search
- ⚡ **Fast & Responsive** - Optimized performance

## 🛠️ Tech Stack

- **Framework**: Ionic React 8.x
- **Language**: TypeScript
- **UI Components**: Ionic Components
- **State Management**: React Context
- **Real-time**: Socket.IO Client
- **HTTP Client**: Axios
- **Date Handling**: date-fns
- **Mobile**: Capacitor

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Ionic CLI (`npm install -g @ionic/cli`)
- For mobile development: Android Studio or Xcode

### Installation

1. **Navigate to the Ionic app directory:**

   ```bash
   cd a:\UrviProject\chat-app\ionicapp
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your backend server URL:

   ```env
   REACT_APP_API_URL=http://localhost:5000
   ```

4. **Start the development server:**

   ```bash
   npm start
   # or
   ionic serve
   ```

5. **Open your browser:**
   - Navigate to `http://localhost:8100`

## 📱 Mobile Development

### Android

1. **Add Android platform:**

   ```bash
   ionic capacitor add android
   ```

2. **Build and sync:**

   ```bash
   ionic capacitor build android
   ionic capacitor sync android
   ```

3. **Open in Android Studio:**
   ```bash
   ionic capacitor open android
   ```

### iOS

1. **Add iOS platform:**

   ```bash
   ionic capacitor add ios
   ```

2. **Build and sync:**

   ```bash
   ionic capacitor build ios
   ionic capacitor sync ios
   ```

3. **Open in Xcode:**
   ```bash
   ionic capacitor open ios
   ```

## 📁 Project Structure

```
ionicapp/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ChatView.tsx   # Chat message interface
│   │   └── ProtectedRoute.tsx # Auth guard
│   ├── context/           # React Context providers
│   │   ├── AuthContext.tsx     # Authentication state
│   │   ├── ToastContext.tsx    # Toast notifications
│   │   └── SocketContext.tsx   # Socket.IO connection
│   ├── pages/             # Application pages
│   │   ├── Login.tsx      # Login/Register page
│   │   └── Chat.tsx       # Main chat interface
│   ├── services/          # API services
│   │   ├── authService.ts # Authentication API
│   │   └── chatService.ts # Chat API
│   ├── utils/             # Utility functions
│   │   └── tokenUtils.ts  # JWT token handling
│   ├── theme/             # Styling and themes
│   │   └── variables.css  # CSS custom properties
│   ├── App.tsx            # Main app component
│   └── index.tsx          # App entry point
├── capacitor.config.ts    # Capacitor configuration
├── ionic.config.json      # Ionic CLI configuration
└── package.json           # Dependencies and scripts
```

## 🎨 UI Components

### Authentication

- Modern glass morphism login form
- Real-time validation feedback
- Social login ready (placeholder)
- Remember me functionality

### Chat Interface

- Split-pane design for desktop
- Swipe gestures on mobile
- Real-time message updates
- Typing indicators
- Message status (sent/delivered/read)
- File attachment support
- Emoji support (placeholder)

### Responsive Design

- Adaptive layout for all screen sizes
- Native mobile navigation
- Desktop-friendly split view
- Touch-optimized interactions

## 🔧 Configuration

### Environment Variables

```env
# Backend API
REACT_APP_API_URL=http://localhost:5000

# Socket.IO (usually same as API)
REACT_APP_SOCKET_URL=http://localhost:5000
```

### Capacitor Config

Edit `capacitor.config.ts` for mobile-specific settings:

```typescript
const config: CapacitorConfig = {
  appId: "io.ionic.chatapp",
  appName: "Chat App",
  webDir: "build",
  server: {
    androidScheme: "https",
  },
};
```

## 🔐 Authentication Flow

1. **Login/Register** - User credentials validated via API
2. **JWT Storage** - Tokens stored securely in localStorage
3. **Auto-refresh** - Tokens refreshed before expiration
4. **Socket Auth** - Socket connection authenticated with JWT
5. **Route Protection** - Protected routes check auth status

## 💬 Real-time Features

- **Instant messaging** via Socket.IO
- **Online status** indicators
- **Message delivery** confirmations
- **Typing indicators** (ready to implement)
- **Push notifications** (with Capacitor)

## 🚀 Deployment

### Web (PWA)

```bash
ionic build --prod
# Deploy 'build' folder to your web server
```

### Android APK

```bash
ionic capacitor build android --prod
# Generate APK in Android Studio
```

### iOS App Store

```bash
ionic capacitor build ios --prod
# Build and archive in Xcode
```

## 🧪 Development Scripts

```bash
# Development server
npm start

# Production build
npm run build

# Run tests
npm test

# Type checking
npm run type-check

# Add mobile platform
ionic capacitor add android|ios

# Sync with mobile
ionic capacitor sync

# Open in IDE
ionic capacitor open android|ios
```

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**

   - Ensure backend has proper CORS configuration
   - Check API URL in environment variables

2. **Socket Connection Failed**

   - Verify WebSocket support on backend
   - Check network connectivity
   - Validate authentication token

3. **Mobile Build Errors**

   - Ensure Android SDK/Xcode are properly installed
   - Check Capacitor compatibility
   - Clear and rebuild: `ionic capacitor clean`

4. **TypeScript Errors**
   - Run `npm run type-check`
   - Check for missing type definitions
   - Verify import paths

## 📚 Additional Resources

- [Ionic Documentation](https://ionicframework.com/docs)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [React Documentation](https://reactjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

## 🤝 Backend Integration

This app is designed to work with the existing Node.js/Express backend in the `backend` folder. Ensure the backend is running on the configured port (default: 5000) before starting the Ionic app.

### Required Backend Endpoints

- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `GET /api/users` - Get users list
- `GET /api/chat/messages/:userId` - Get chat messages
- `POST /api/chat/send` - Send message
- `PUT /api/chat/read/:senderId` - Mark messages as read

### Socket.IO Events

- `send_message` - Send new message
- `receive_message` - Receive new message
- `user_online` - User online status
- `user_offline` - User offline status

## 📱 Platform-Specific Features

### iOS

- Native navigation bar
- Swipe gestures
- Haptic feedback
- Push notifications

### Android

- Material Design components
- Android-style navigation
- Hardware back button support
- Notification channels

### Web (PWA)

- Offline capability
- Install prompt
- Background sync
- Web notifications

---

Ready to build amazing cross-platform chat experiences! 🚀✨
