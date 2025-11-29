export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Only used for auth checks
  avatar: string;
  isOnline: boolean;
  bio?: string;
  favorites: string[]; // List of User IDs
  blocked: string[];   // List of User IDs
}

export interface Room {
  id: string;
  name: string;
  isPrivate: boolean;
  password?: string;
  createdBy: string;
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