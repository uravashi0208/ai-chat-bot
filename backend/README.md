# WhatsApp Clone — Backend

Production-grade Node.js backend for a full-featured WhatsApp-style messaging application.

## Tech Stack

| Layer        | Technology                    |
| ------------ | ----------------------------- |
| Runtime      | Node.js 20+ (ES Modules)      |
| API          | Apollo Server 4 + GraphQL     |
| Real-time    | Socket.IO 4                   |
| Database     | Supabase (PostgreSQL)         |
| Auth         | JWT (jsonwebtoken) + bcryptjs |
| SMS / OTP    | Vonage (Nexmo)                |
| File Storage | Supabase Storage              |
| AI Proxy     | Groq (Llama 3)                |

---

## Project Structure

```
src/
├── config/
│   ├── env.js          # Centralised env config with validation
│   └── supabase.js     # Supabase client singleton
│
├── middleware/
│   └── auth.js         # JWT sign/verify, Apollo context builder, requireAuth guard
│
├── graphql/
│   ├── typeDefs.js     # GraphQL schema (types, queries, mutations)
│   └── resolvers.js    # Thin resolver map — delegates to services
│
├── chat/
│   └── gateway.js      # Socket.IO gateway (presence, messaging, read receipts)
│
├── services/
│   ├── auth.js         # OTP flow, register, login, logout
│   ├── users.js        # Profile, contacts, security settings, account deletion
│   ├── conversations.js# Direct + group conversation management
│   ├── messages.js     # CRUD, reactions, starring, delivery status
│   ├── broadcast.js    # Broadcast list management + fan-out delivery
│   ├── privacy.js      # Privacy settings + field-level visibility enforcement
│   ├── status.js       # WhatsApp-style 24h status stories
│   ├── userPrefs.js    # UI preferences (theme, wallpaper, font, etc.)
│   ├── device.js       # Linked device management
│   └── qr.js           # In-memory QR session store
│
├── routes/
│   └── upload.js       # REST file upload endpoints (avatar, media, status)
│
├── utils/
│   └── helpers.js      # Shared stateless utilities
│
└── index.js            # Application entry point + server bootstrap
```

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_SERVICE_KEY, JWT_SECRET
```

### 3. Start the server

```bash
# Development (auto-restart on file changes)
npm run dev

# Production
npm start
```

---

## Environment Variables

| Variable               | Required | Description                                    |
| ---------------------- | -------- | ---------------------------------------------- |
| `SUPABASE_URL`         | ✅       | Your Supabase project URL                      |
| `SUPABASE_SERVICE_KEY` | ✅       | Service role key (bypasses RLS)                |
| `JWT_SECRET`           | ✅       | Signing secret for JWTs                        |
| `JWT_EXPIRES_IN`       | —        | Token TTL (default: `7d`)                      |
| `PORT`                 | —        | HTTP port (default: `4000`)                    |
| `FRONTEND_URL`         | —        | CORS origin (default: `http://localhost:3000`) |
| `VONAGE_API_KEY`       | —        | Vonage SMS — required for OTP in production    |
| `VONAGE_API_SECRET`    | —        | Vonage SMS secret                              |
| `VONAGE_FROM`          | —        | SMS sender name (default: `ChatApp`)           |
| `GROQ_API_KEY`         | —        | Groq key for the `/api/claude` AI proxy        |

---

## API Reference

### GraphQL

**Endpoint:** `POST /graphql`  
**Auth:** `Authorization: Bearer <token>`

All queries/mutations are defined in `src/graphql/typeDefs.js`. Use the built-in Apollo Explorer at `/graphql` (available in development) to explore and test the API.

### REST Endpoints

| Method | Path                  | Description               |
| ------ | --------------------- | ------------------------- |
| `GET`  | `/health`             | Health check              |
| `POST` | `/upload/avatar`      | Upload profile photo      |
| `POST` | `/upload/media`       | Upload chat attachment    |
| `POST` | `/upload/status`      | Upload status story media |
| `POST` | `/api/claude`         | AI chat proxy (Groq)      |
| `POST` | `/api/generate-image` | AI image generation proxy |

Upload endpoints accept `multipart/form-data`. Field names: `avatar`, `media`, `status`.

### WebSocket Events

Connect to `ws://localhost:4000` with `Authorization: Bearer <token>` in the handshake.

| Event (emit)        | Payload                                                     | Description                                |
| ------------------- | ----------------------------------------------------------- | ------------------------------------------ |
| `message:send`      | `{ conversationId, content, type?, mediaUrl?, replyToId? }` | Send a message                             |
| `message:edit`      | `{ conversationId, messageId, content }`                    | Edit a message                             |
| `message:delete`    | `{ conversationId, messageId }`                             | Delete a message                           |
| `message:reaction`  | `{ conversationId, messageId, emoji, action }`              | Add/remove reaction                        |
| `typing:start`      | `{ conversationId }`                                        | Start typing indicator                     |
| `typing:stop`       | `{ conversationId }`                                        | Stop typing indicator                      |
| `conversation:join` | `{ conversationId }`                                        | Join room + mark delivered                 |
| `conversation:read` | `{ conversationId }`                                        | Mark as read                               |
| `privacy:changed`   | `{ field }`                                                 | Re-broadcast presence after privacy update |

| Event (listen)      | Payload                                                | Description                 |
| ------------------- | ------------------------------------------------------ | --------------------------- |
| `message:new`       | `{ conversationId, message }`                          | New message received        |
| `message:edited`    | `{ conversationId, message }`                          | Message was edited          |
| `message:deleted`   | `{ conversationId, messageId }`                        | Message was deleted         |
| `message:reaction`  | `{ conversationId, messageId, userId, emoji, action }` | Reaction changed            |
| `message:status`    | `{ messageId, status, deliveredAt?, readAt? }`         | Delivery/read status        |
| `user:status`       | `{ userId, status }`                                   | Presence update             |
| `conversation:new`  | `Conversation`                                         | Added to a new conversation |
| `conversation:read` | `{ conversationId, userId }`                           | Conversation marked read    |
| `typing:start`      | `{ conversationId, userId }`                           | Someone started typing      |
| `typing:stop`       | `{ conversationId, userId }`                           | Someone stopped typing      |
| `force-logout`      | —                                                      | Device was removed remotely |

---

## Architecture Notes

- **Thin resolvers, fat services** — resolvers only handle auth and arg translation; all business logic lives in `services/`.
- **Privacy by default** — every user object returned to a different user passes through `privacyService.applyPrivacyFilter`. Blocks and per-field privacy settings are enforced in one place.
- **Non-throwing auth** — an invalid JWT resolves to `user: null` in the context; resolvers that require auth call `requireAuth(user)` explicitly.
- **Circular dependency prevention** — `chatGateway` is injected into `conversationsService` at startup via `setChatGateway()`, avoiding an import cycle.
- **Soft deletes** — messages are soft-deleted (content wiped, type set to `'deleted'`); the row is preserved for read-receipt and reaction consistency.
