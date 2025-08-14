# 💬 Real-Time Chat Application

A modern, full-stack real-time chat application built with Node.js, React, and Ionic. Features secure user authentication, real-time messaging with Socket.IO, and cross-platform mobile support.

![Chat App](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Node.js](https://img.shields.io/badge/Node.js-18.x-green)
![React](https://img.shields.io/badge/React-18.x-blue)
![Ionic](https://img.shields.io/badge/Ionic-8.x-lightblue)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8.x-black)

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│  Ionic Mobile   │◄──►│   Backend API   │◄──►│ React Frontend  │
│     App         │    │   (Node.js)     │    │   (Web App)     │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │                 │
                       │   Supabase      │
                       │   PostgreSQL    │
                       │                 │
                       └─────────────────┘
```

## 🚀 Features

### Core Features

- 🔐 **Secure Authentication** - JWT-based auth with bcrypt password hashing
- 💬 **Real-time Messaging** - Instant messaging with Socket.IO
- 👥 **User Management** - User registration, login, profile management
- 🌐 **Cross-platform** - Web app (React) and mobile app (Ionic)
- 📱 **Responsive Design** - Modern, dark theme UI with animations
- ⚡ **Fast & Scalable** - Optimized for performance and scalability

### Technical Features

- 🔄 **Real-time Updates** - Live user status, message delivery
- 🛡️ **Security** - Rate limiting, input validation, secure headers
- 📝 **Logging** - Comprehensive logging with Winston
- 🎯 **Error Handling** - Robust error handling and validation
- 🔒 **Environment Configuration** - Secure environment management

## 📋 Prerequisites

Before running this application, ensure you have:

- **Node.js** (v18.0.0 or higher)
- **npm** or **yarn** package manager
- **Supabase Account** (for database)
- **Git** for version control

## 🛠️ Technology Stack

### Backend

- **Runtime**: Node.js with Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT with bcrypt
- **Real-time**: Socket.IO
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Joi

### Frontend (Web)

- **Framework**: React 18 with Vite
- **Language**: JavaScript/JSX
- **Styling**: CSS3 with CSS Variables
- **HTTP Client**: Axios
- **Real-time**: Socket.IO Client
- **Routing**: React Router DOM

### Mobile App

- **Framework**: Ionic 8 with Angular
- **Language**: TypeScript
- **Styling**: SCSS with Ionic Components
- **HTTP Client**: Angular HttpClient
- **Real-time**: Socket.IO Client

## 📦 Project Structure

```
chat-app/
├── backend/                    # Node.js API Server
│   ├── config/                # Database and JWT configuration
│   ├── controllers/           # Route controllers
│   ├── middleware/            # Custom middleware
│   ├── models/                # Database models
│   ├── routes/                # API routes
│   ├── services/              # Business logic services
│   ├── utils/                 # Utility functions
│   ├── logs/                  # Application logs
│   ├── server.js              # Entry point
│   └── package.json           # Dependencies
│
├── frontend/                   # React Web Application
│   ├── public/                # Static assets
│   ├── src/
│   │   ├── api/               # API client
│   │   ├── components/        # React components
│   │   ├── context/           # React context
│   │   ├── hooks/             # Custom hooks
│   │   ├── layouts/           # Page layouts
│   │   ├── routes/            # Route configuration
│   │   ├── theme/             # Theme and styles
│   │   ├── utils/             # Utility functions
│   │   ├── views/             # Page components
│   │   └── main.jsx           # Entry point
│   └── package.json           # Dependencies
│
├── ionicapp/                   # Ionic Mobile Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── auth/          # Authentication pages
│   │   │   ├── dashboard/     # Main dashboard
│   │   │   ├── services/      # Angular services
│   │   │   └── app.module.ts  # App module
│   │   ├── assets/            # Static assets
│   │   ├── environments/      # Environment configs
│   │   └── theme/             # Global styles
│   ├── capacitor.config.ts    # Capacitor configuration
│   └── package.json           # Dependencies
│
└── README.md                   # This file
```

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd chat-app
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure your environment variables
nano .env
```

**Environment Variables (.env):**

```env
# Database Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key

# Server Configuration
PORT=5000
CLIENT_URL=http://localhost:3000
CLIENT_URL_2=http://localhost:5173
NODE_ENV=development
```

```bash
# Start the backend server
npm start

# For development with auto-reload
npm run dev
```

### 3. Frontend Setup (React Web App)

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The web application will be available at `http://localhost:5173`

### 4. Mobile App Setup (Ionic)

```bash
# Navigate to ionic app directory
cd ../ionicapp

# Install dependencies
npm install

# Start the development server
ionic serve
```

The mobile app will be available at `http://localhost:8100`

## 🔧 Development Workflow

### Backend Development

```bash
# Start with auto-reload
npm run dev

# Run tests (when available)
npm test

# Check logs
tail -f logs/combined.log
```

### Frontend Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Mobile App Development

```bash
# Serve in browser
ionic serve

# Build for production
ionic build

# Add platform (iOS/Android)
ionic capacitor add ios
ionic capacitor add android

# Run on device
ionic capacitor run ios
ionic capacitor run android
```

## 📚 API Documentation

### Authentication Endpoints

#### Register User

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

#### Login User

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

#### Refresh Token

```http
POST /api/auth/refresh-token
Cookie: refreshToken=<refresh_token>
```

#### Logout

```http
POST /api/auth/logout
Authorization: Bearer <access_token>
```

### User Endpoints

#### Get User Profile

```http
GET /api/users/profile
Authorization: Bearer <access_token>
```

#### Get All Users

```http
GET /api/users
Authorization: Bearer <access_token>
```

### Chat Endpoints

#### Get Messages

```http
GET /api/chat/messages?page=1&limit=50
Authorization: Bearer <access_token>
```

#### Send Message

```http
POST /api/chat/messages
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "content": "Hello, World!",
  "type": "text"
}
```

## 🔌 WebSocket Events

### Client to Server Events

```javascript
// Join chat room
socket.emit("join", { token: "jwt_token" });

// Send message
socket.emit("send_message", {
  content: "Hello everyone!",
  type: "text",
});

// User typing
socket.emit("typing", { isTyping: true });
```

### Server to Client Events

```javascript
// New message received
socket.on("new_message", (message) => {
  // Handle new message
});

// User joined
socket.on("user_joined", (user) => {
  // Handle user join
});

// User left
socket.on("user_left", (user) => {
  // Handle user leave
});

// User typing
socket.on("user_typing", (data) => {
  // Handle typing indicator
});
```

## 🛡️ Security Features

### Authentication & Authorization

- **JWT Tokens**: Secure authentication with access and refresh tokens
- **Password Hashing**: bcrypt with salt rounds for secure password storage
- **Token Expiration**: Automatic token refresh mechanism

### API Security

- **Rate Limiting**: Prevents API abuse and DDoS attacks
- **CORS Configuration**: Controlled cross-origin resource sharing
- **Helmet**: Security headers for Express.js
- **Input Validation**: Joi schema validation for all inputs

### Data Protection

- **Environment Variables**: Sensitive data stored in environment files
- **SQL Injection Protection**: Parameterized queries with Supabase
- **XSS Protection**: Input sanitization and validation

## 🚀 Deployment

### Backend Deployment (Heroku Example)

```bash
# Install Heroku CLI
# Login to Heroku
heroku login

# Create new app
heroku create your-chat-app-backend

# Set environment variables
heroku config:set SUPABASE_URL=your_url
heroku config:set SUPABASE_ANON_KEY=your_key
heroku config:set JWT_SECRET=your_secret

# Deploy
git subtree push --prefix backend heroku main
```

### Frontend Deployment (Netlify Example)

```bash
# Build the project
npm run build

# Deploy to Netlify (using Netlify CLI)
npx netlify deploy --prod --dir=dist
```

### Mobile App Deployment

#### iOS Deployment

```bash
# Build the project
ionic build

# Add iOS platform
ionic capacitor add ios

# Open in Xcode
ionic capacitor open ios

# Build and deploy through Xcode
```

#### Android Deployment

```bash
# Build the project
ionic build

# Add Android platform
ionic capacitor add android

# Open in Android Studio
ionic capacitor open android

# Build and deploy through Android Studio
```

## 🐛 Troubleshooting

### Common Issues

#### Backend Issues

**Port Already in Use**

```bash
# Kill process on port 5000
npx kill-port 5000

# Or use different port
PORT=5001 npm start
```

**Database Connection Error**

```bash
# Check Supabase credentials
# Verify network connectivity
# Check environment variables
```

**JWT Token Issues**

```bash
# Verify JWT_SECRET is set
# Check token expiration
# Validate token format
```

#### Frontend Issues

**CORS Errors**

```bash
# Check backend CORS configuration
# Verify CLIENT_URL in backend .env
# Use proxy in vite.config.js if needed
```

**Socket Connection Failed**

```bash
# Verify backend Socket.IO server is running
# Check socketUrl in environment
# Ensure no firewall blocking WebSocket connections
```

#### Mobile App Issues

**Build Failures**

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Ionic cache
ionic cache clear
```

**Platform Issues**

```bash
# Ensure latest Capacitor CLI
npm install -g @capacitor/cli@latest

# Sync platform files
ionic capacitor sync
```

## 📈 Performance Optimization

### Backend Optimizations

- **Connection Pooling**: Efficient database connections
- **Rate Limiting**: API protection and performance
- **Logging**: Structured logging for monitoring
- **Memory Management**: Efficient memory usage patterns

### Frontend Optimizations

- **Lazy Loading**: Code splitting for faster initial loads
- **Asset Optimization**: Compressed images and minified CSS/JS
- **Caching**: Strategic caching of API responses
- **Bundle Analysis**: Regular bundle size monitoring

### Mobile App Optimizations

- **Ahead-of-Time Compilation**: AOT for better performance
- **Lazy Loading**: Feature modules loaded on demand
- **Native Performance**: Capacitor plugins for native features
- **Memory Management**: Proper component lifecycle management

## 🧪 Testing

### Backend Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Test coverage
npm run test:coverage
```

### Frontend Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Component testing
npm run test:components
```

### Mobile App Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run e2e

# Device testing
ionic capacitor run ios --livereload
ionic capacitor run android --livereload
```

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Process

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Standards

- **ESLint**: Follow the established linting rules
- **Prettier**: Use consistent code formatting
- **TypeScript**: Use TypeScript for new features when applicable
- **Testing**: Include tests for new features
- **Documentation**: Update documentation for API changes

### Commit Convention

```
type(scope): description

feat(auth): add password reset functionality
fix(chat): resolve message ordering issue
docs(readme): update installation instructions
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Backend Developer**: Node.js, Express, Socket.IO, Database
- **Frontend Developer**: React, UI/UX, State Management
- **Mobile Developer**: Ionic, Angular, Capacitor, Native Integration
- **DevOps**: Deployment, CI/CD, Performance Monitoring

## 📞 Support

### Getting Help

- 📧 **Email**: support@chatapp.com
- 💬 **Discord**: [Join our community](https://discord.gg/chatapp)
- 🐛 **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- 📖 **Documentation**: [Full Documentation](https://docs.chatapp.com)

### FAQ

**Q: How do I reset my development environment?**
A: Delete `node_modules`, `.env` files, and reinstall dependencies.

**Q: Can I use a different database?**
A: Yes, modify the database configuration in `backend/config/db.js`.

**Q: How do I add new features?**
A: Follow the contributing guidelines and create a feature branch.

**Q: Is this production ready?**
A: Yes, but ensure proper environment configuration and security review.

---

_For more information, visit our [website](https://chatapp.com) or check out our [documentation](https://docs.chatapp.com)._
