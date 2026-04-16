# 💬 WhatsApp Clone

A full-stack real-time chat application built with **React 16**, **NestJS**, and **Supabase** — featuring the full WhatsApp Web UI/UX.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔐 **Auth** | Register / Login with JWT, bcrypt password hashing |
| 💬 **Real-time messaging** | WebSocket (Socket.IO) — instant delivery |
| 👀 **Online presence** | Live online/offline/away status |
| ✍️ **Typing indicators** | Animated typing bubbles per conversation |
| ✅ **Message status** | Sending → Sent → Delivered → Read (blue ticks) |
| 💬 **Message reactions** | 6 emoji quick reactions per message |
| ↩️ **Reply to messages** | Threaded reply previews in bubbles |
| ✏️ **Edit / Delete** | Edit your messages, delete for everyone |
| 👥 **Group chats** | Multi-participant group conversations |
| 🔍 **User search** | Search users by name or username |
| 📱 **Mobile responsive** | Slide-in chat panel on small screens |
| 🎨 **WhatsApp Dark UI** | Pixel-accurate dark theme |

---

## 🏗️ Tech Stack

```
Frontend          Backend            Database
─────────         ─────────          ─────────
React 16          NestJS (latest)    Supabase (PostgreSQL)
React Router 5    Socket.IO          Supabase Realtime
Socket.IO Client  JWT Auth           Row Level Security
Axios             Passport.js
date-fns          bcryptjs
```

---

## 🚀 Quick Start

### 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the entire `supabase-schema.sql` file
3. In Supabase Dashboard → **Database → Replication**, enable realtime on:
   - `messages`
   - `conversations`
   - `users`
   - `conversation_participants`
4. Copy your **Project URL** and **service_role key** (Settings → API)

Also add this SQL function for finding direct conversations:
```sql
CREATE OR REPLACE FUNCTION find_direct_conversation(user1_id UUID, user2_id UUID)
RETURNS TABLE(conversation_id UUID) AS $$
  SELECT cp1.conversation_id
  FROM conversation_participants cp1
  JOIN conversation_participants cp2
    ON cp1.conversation_id = cp2.conversation_id
  JOIN conversations c
    ON c.id = cp1.conversation_id
  WHERE cp1.user_id = user1_id
    AND cp2.user_id = user2_id
    AND c.type = 'direct'
  LIMIT 1;
$$ LANGUAGE sql;
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in your SUPABASE_URL, SUPABASE_SERVICE_KEY, JWT_SECRET

npm install
npm run start:dev
# Runs on http://localhost:4000
```

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env
# Fill in your REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY

npm install
npm start
# Runs on http://localhost:3000
```

### 4. Docker (Optional)

```bash
cp .env.example .env  # Fill in all vars
docker-compose up
```

---

## 📁 Project Structure

```
whatsapp-clone/
├── supabase-schema.sql          # Run this in Supabase SQL editor first
├── docker-compose.yml
│
├── backend/                     # NestJS API
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── supabase/            # Supabase client service
│       ├── auth/                # JWT auth, register, login
│       ├── users/               # User search, profile, contacts
│       ├── conversations/       # Direct & group conversations
│       ├── messages/            # CRUD, reactions, status
│       └── chat/                # WebSocket gateway (Socket.IO)
│
└── frontend/                    # React 16 app
    └── src/
        ├── App.js
        ├── context/
        │   ├── AuthContext.js   # Auth state + JWT
        │   └── ChatContext.js   # Conversations + socket events
        ├── services/
        │   ├── api.js           # Axios API calls
        │   └── socket.js        # Socket.IO helpers
        ├── utils/helpers.js     # Date formatting, conversation utils
        ├── pages/
        │   ├── LoginPage.js
        │   ├── RegisterPage.js
        │   └── ChatPage.js      # Main layout
        └── components/
            ├── common/Avatar.js
            ├── WelcomeScreen.js
            ├── Sidebar/
            │   ├── Sidebar.js
            │   ├── ConversationList.js
            │   ├── ContactSearch.js
            │   └── UserProfile.js
            └── ChatWindow/
                ├── ChatWindow.js    # Messages controller
                ├── ChatHeader.js    # Status, typing, menu
                ├── MessageList.js   # Virtualized scroll
                ├── MessageBubble.js # Individual messages
                └── MessageInput.js  # Textarea + emoji + typing
```

---

## 🔌 WebSocket Events

| Event (Client → Server) | Payload |
|---|---|
| `message:send` | `{ conversationId, content, type, replyToId }` |
| `message:edit` | `{ messageId, conversationId, content }` |
| `message:delete` | `{ messageId, conversationId }` |
| `message:reaction` | `{ messageId, conversationId, emoji, action }` |
| `typing:start` | `{ conversationId }` |
| `typing:stop` | `{ conversationId }` |
| `conversation:join` | `{ conversationId }` |
| `conversation:read` | `{ conversationId }` |

| Event (Server → Client) | Payload |
|---|---|
| `message:new` | `{ conversationId, message }` |
| `message:edited` | `{ conversationId, message }` |
| `message:deleted` | `{ conversationId, messageId }` |
| `message:reaction` | `{ conversationId, messageId, userId, emoji, action }` |
| `typing:start` | `{ conversationId, userId }` |
| `typing:stop` | `{ conversationId, userId }` |
| `user:status` | `{ userId, status }` |
| `conversation:new` | `conversation` |
| `conversation:read` | `{ conversationId, userId }` |

---

## 🔒 Environment Variables

**Backend `.env`**
```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGci...
JWT_SECRET=your-secret-key-min-32-chars
PORT=4000
FRONTEND_URL=http://localhost:3000
```

**Frontend `.env`**
```env
REACT_APP_API_URL=http://localhost:4000/api
REACT_APP_WS_URL=http://localhost:4000
REACT_APP_SUPABASE_URL=https://xxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGci...
```

---

## 🛣️ REST API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/users/search?q=name
GET    /api/users/contacts
POST   /api/users/contacts/:contactId
PUT    /api/users/profile

GET    /api/conversations
POST   /api/conversations/direct/:targetUserId
POST   /api/conversations/group
GET    /api/conversations/:id
PUT    /api/conversations/:id/read

GET    /api/conversations/:id/messages
POST   /api/conversations/:id/messages
PUT    /api/conversations/:id/messages/:msgId
DELETE /api/conversations/:id/messages/:msgId
POST   /api/conversations/:id/messages/:msgId/reactions
DELETE /api/conversations/:id/messages/:msgId/reactions/:emoji
```

---

## 📄 License

MIT — free to use, modify, and distribute.
