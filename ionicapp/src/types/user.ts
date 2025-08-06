// Shared user type definitions for the Ionic Chat App

export interface User {
  id: string;
  username: string;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
  lastSeen?: string;
  online?: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  signal?: AbortSignal;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  signal?: AbortSignal;
}