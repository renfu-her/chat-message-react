export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Only used for auth checks, usually not stored in frontend state like this in real app
  avatar: string;
  isOnline: boolean;
  bio?: string;
}

export interface Room {
  id: string;
  name: string;
  isPrivate: boolean;
  password?: string;
  createdBy: string; // User ID
  description?: string;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  type: 'text' | 'image';
  timestamp: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export enum AppView {
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  CHAT = 'CHAT'
}