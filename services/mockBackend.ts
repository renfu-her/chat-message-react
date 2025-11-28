import { User, Room, Message } from '../types';

// Initial Mock Data
const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'Alice Test', email: 'user1@test.com', password: 'password123', avatar: 'https://picsum.photos/seed/u1/200', isOnline: false, bio: 'Love coding!' },
  { id: 'u2', name: 'Bob Test', email: 'user2@test.com', password: 'password123', avatar: 'https://picsum.photos/seed/u2/200', isOnline: false, bio: 'Python enthusiast' },
  { id: 'u3', name: 'Charlie Test', email: 'user3@test.com', password: 'password123', avatar: 'https://picsum.photos/seed/u3/200', isOnline: false },
  { id: 'u4', name: 'Dave Test', email: 'user4@test.com', password: 'password123', avatar: 'https://picsum.photos/seed/u4/200', isOnline: false },
  { id: 'u5', name: 'Eve Test', email: 'user5@test.com', password: 'password123', avatar: 'https://picsum.photos/seed/u5/200', isOnline: false },
];

const INITIAL_ROOMS: Room[] = [
  { id: 'r1', name: 'General Lobby', isPrivate: false, createdBy: 'system', description: 'Welcome everyone!' },
  { id: 'r2', name: 'Python Devs', isPrivate: false, createdBy: 'system', description: 'Talk about FastAPI' },
  { id: 'r3', name: 'Secret Club', isPrivate: true, password: '123', createdBy: 'u1', description: 'Shhh... Password is 123' },
];

// Helper to get data from local storage or init
const getStorage = <T>(key: string, init: T): T => {
  const stored = localStorage.getItem(key);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(key, JSON.stringify(init));
  return init;
};

const setStorage = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Simulation of WebSocket Events
type Listener = (data: any) => void;
const listeners: Set<Listener> = new Set();

export const subscribeToSocket = (callback: Listener) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};

const broadcast = (type: string, payload: any) => {
  // Simulate network delay
  setTimeout(() => {
    listeners.forEach(l => l({ type, payload }));
  }, 100);
};

export const mockBackend = {
  // Auth
  login: async (email: string, password: string): Promise<User> => {
    await new Promise(r => setTimeout(r, 500)); // Simulate latency
    const users = getStorage<User[]>('chat_users', INITIAL_USERS);
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) throw new Error('Invalid credentials');
    
    // Set online
    user.isOnline = true;
    const updatedUsers = users.map(u => u.id === user.id ? user : u);
    setStorage('chat_users', updatedUsers);
    broadcast('USER_UPDATE', user);
    return user;
  },

  register: async (name: string, email: string, password: string): Promise<User> => {
    await new Promise(r => setTimeout(r, 500));
    const users = getStorage<User[]>('chat_users', INITIAL_USERS);
    if (users.find(u => u.email === email)) throw new Error('Email already exists');
    
    const newUser: User = {
      id: `u${Date.now()}`,
      name,
      email,
      password,
      avatar: `https://picsum.photos/seed/${Date.now()}/200`,
      isOnline: true
    };
    
    const updatedUsers = [...users, newUser];
    setStorage('chat_users', updatedUsers);
    broadcast('USER_JOINED', newUser);
    return newUser;
  },

  logout: async (userId: string) => {
    const users = getStorage<User[]>('chat_users', INITIAL_USERS);
    const updatedUsers = users.map(u => {
      if (u.id === userId) return { ...u, isOnline: false };
      return u;
    });
    setStorage('chat_users', updatedUsers);
    broadcast('USER_LEFT', { userId });
  },

  updateProfile: async (userId: string, updates: Partial<User>) => {
    const users = getStorage<User[]>('chat_users', INITIAL_USERS);
    let updatedUser: User | undefined;
    const newUsers = users.map(u => {
        if(u.id === userId) {
            updatedUser = { ...u, ...updates };
            return updatedUser;
        }
        return u;
    });
    setStorage('chat_users', newUsers);
    if (updatedUser) broadcast('USER_UPDATE', updatedUser);
    return updatedUser;
  },

  // Rooms
  getRooms: async (): Promise<Room[]> => {
    return getStorage<Room[]>('chat_rooms', INITIAL_ROOMS);
  },

  createRoom: async (room: Omit<Room, 'id'>): Promise<Room> => {
    const rooms = getStorage<Room[]>('chat_rooms', INITIAL_ROOMS);
    const newRoom = { ...room, id: `r${Date.now()}` };
    setStorage('chat_rooms', [...rooms, newRoom]);
    broadcast('ROOM_CREATED', newRoom);
    return newRoom;
  },

  deleteRoom: async (roomId: string): Promise<void> => {
    const rooms = getStorage<Room[]>('chat_rooms', INITIAL_ROOMS);
    const updatedRooms = rooms.filter(r => r.id !== roomId);
    setStorage('chat_rooms', updatedRooms);
    broadcast('ROOM_DELETED', { roomId });
  },

  // Users
  getUsers: async (): Promise<User[]> => {
    return getStorage<User[]>('chat_users', INITIAL_USERS);
  },

  // Messages
  getMessages: async (roomId: string): Promise<Message[]> => {
    const allMessages = getStorage<Message[]>('chat_messages', []);
    return allMessages.filter(m => m.roomId === roomId);
  },

  sendMessage: async (message: Omit<Message, 'id' | 'timestamp'>): Promise<Message> => {
    const allMessages = getStorage<Message[]>('chat_messages', []);
    const newMessage: Message = {
      ...message,
      id: `m${Date.now()}`,
      timestamp: Date.now()
    };
    setStorage('chat_messages', [...allMessages, newMessage]);
    broadcast('NEW_MESSAGE', newMessage);
    return newMessage;
  }
};