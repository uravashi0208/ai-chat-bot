# Ionic Chat App

This is a chat application built with Ionic and Angular that replicates the functionality of the React chat application.

## Features

- User authentication (login/register)
- Real-time chat with WebSocket integration
- User list with search functionality
- Message history
- Responsive design for mobile and desktop

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   ionic serve
   ```

## Folder Structure

- `src/app/auth/` - Authentication pages (login/register)
- `src/app/dashboard/` - Dashboard page
- `src/app/chat/` - Chat page and components
- `src/app/services/` - Services for authentication, chat, and API calls
- `src/app/guards/` - Route guards for authentication
- `src/environments/` - Environment configuration

## Architecture

The application follows a modular structure with:
- Separate modules for each feature (auth, dashboard, chat)
- Services for handling business logic
- Guards for route protection
- Environment files for configuration

## Technologies Used

- Ionic Framework
- Angular
- TypeScript
- Socket.IO Client
- RxJS

## Testing

To test the application:

1. Start the development server:
   ```bash
   ionic serve
   ```

2. Open your browser to http://localhost:8100

3. Register a new user or login with existing credentials

4. Navigate to the chat page to test messaging functionality

## Deployment

To build for production:
```bash
ionic build --prod
```

The built files will be in the `www/` directory.