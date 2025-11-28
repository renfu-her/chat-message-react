import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { 
  LogOut, Send, Image as ImageIcon, Plus, 
  Lock, Hash, MoreVertical, X, User as UserIcon, Settings, Menu, MessageSquare, Trash2,
  Sun, Moon
} from 'lucide-react';
import { User, Room, Message, AppView } from '../types';
import { mockBackend, subscribeToSocket } from '../services/mockBackend';
import { convertImageToWebP } from '../services/imageUtils';

interface ChatAppProps {
  currentUser: User;
  onLogout: () => void;
  onUserUpdate: (user: User) => void;
}

const ChatApp: React.FC<ChatAppProps> = ({ currentUser, onLogout, onUserUpdate }) => {
  // State
  const [rooms, setRooms] = useState<Room[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  
  // UI State
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar
  const [userListOpen, setUserListOpen] = useState(false); // Mobile user list
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  
  // Private Room Join State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingRoom, setPendingRoom] = useState<Room | null>(null);
  const [joinPassword, setJoinPassword] = useState('');
  const [joinError, setJoinError] = useState('');

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeRoomIdRef = useRef<string | null>(null);

  // Form State for Room Creation
  const [newRoomName, setNewRoomName] = useState('');
  const [isNewRoomPrivate, setIsNewRoomPrivate] = useState(false);
  const [newRoomPassword, setNewRoomPassword] = useState('');

  // Sync activeRoomId to Ref for socket listeners
  useEffect(() => {
    activeRoomIdRef.current = activeRoomId;
  }, [activeRoomId]);

  // Initialize Theme
  useEffect(() => {
      const savedTheme = localStorage.getItem('chat_theme') as 'light' | 'dark' | null;
      const initialTheme = savedTheme || 'dark';
      setTheme(initialTheme);
      document.documentElement.className = initialTheme;
  }, []);

  const toggleTheme = () => {
      const newTheme = theme === 'dark' ? 'light' : 'dark';
      setTheme(newTheme);
      localStorage.setItem('chat_theme', newTheme);
      document.documentElement.className = newTheme;
  };

  // Initial Data Load & Socket Subscription
  useEffect(() => {
    const loadData = async () => {
      const [loadedRooms, loadedUsers] = await Promise.all([
        mockBackend.getRooms(),
        mockBackend.getUsers()
      ]);
      setRooms(loadedRooms);
      setUsers(loadedUsers);
    };
    loadData();

    // Socket Subscription
    const unsubscribe = subscribeToSocket((event) => {
      // Use ref to get current room ID without triggering effect re-run
      const currentRoomId = activeRoomIdRef.current;
      
      switch (event.type) {
        case 'NEW_MESSAGE':
          setMessages(prev => {
             // Only add if it belongs to current room
             if (event.payload.roomId === currentRoomId) {
                return [...prev, event.payload];
             }
             return prev;
          });
          break;
        case 'ROOM_CREATED':
          setRooms(prev => [...prev, event.payload]);
          break;
        case 'ROOM_DELETED':
          setRooms(prev => prev.filter(r => r.id !== event.payload.roomId));
          // If the current user is in the deleted room, boot them out
          if (currentRoomId === event.payload.roomId) {
            setActiveRoomId(null);
            alert("The room you were in has been deleted.");
          }
          break;
        case 'USER_UPDATE':
          setUsers(prev => prev.map(u => u.id === event.payload.id ? event.payload : u));
          if (event.payload.id === currentUser.id) {
            onUserUpdate(event.payload);
          }
          break;
        case 'USER_JOINED':
          setUsers(prev => {
            // Check for duplicates before adding
            if (prev.some(u => u.id === event.payload.id)) return prev;
            return [...prev, event.payload];
          });
          break;
        case 'USER_LEFT':
          setUsers(prev => prev.map(u => u.id === event.payload.userId ? { ...u, isOnline: false } : u));
          break;
      }
    });

    return () => { unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.id]); // Add currentUser.id to deps just in case, though usually stable

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleJoinRoom = async (room: Room) => {
    if (room.id === activeRoomId) return;

    if (room.isPrivate) {
      setPendingRoom(room);
      setJoinPassword('');
      setJoinError('');
      setShowPasswordModal(true);
      return;
    }

    await executeJoinRoom(room.id);
  };

  const executeJoinRoom = async (roomId: string) => {
    setActiveRoomId(roomId);
    const msgs = await mockBackend.getMessages(roomId);
    setMessages(msgs);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleJoinPrivateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!pendingRoom) return;

    if (joinPassword === pendingRoom.password) {
      await executeJoinRoom(pendingRoom.id);
      closePasswordModal();
    } else {
      setJoinError('Incorrect password');
    }
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPendingRoom(null);
    setJoinPassword('');
    setJoinError('');
  };

  const handleSendMessage = async (e?: FormEvent) => {
    e?.preventDefault();
    if ((!inputMessage.trim() && !fileInputRef.current?.files?.length) || !activeRoomId) return;

    try {
        await mockBackend.sendMessage({
          roomId: activeRoomId,
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderAvatar: currentUser.avatar,
          content: inputMessage,
          type: 'text'
        });
        setInputMessage('');
    } catch (err) {
        console.error(err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeRoomId) return;

    try {
      // Requirement: Convert to WebP
      const webpBase64 = await convertImageToWebP(file);
      
      await mockBackend.sendMessage({
        roomId: activeRoomId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar,
        content: webpBase64,
        type: 'image'
      });
    } catch (err) {
      console.error("Image upload failed", err);
      alert("Failed to process image");
    } finally {
        if(fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const createRoom = async (e: FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    
    try {
      await mockBackend.createRoom({
        name: newRoomName,
        isPrivate: isNewRoomPrivate,
        password: isNewRoomPrivate ? newRoomPassword : undefined,
        createdBy: currentUser.id,
        description: 'New custom room'
      });
      setShowCreateRoom(false);
      setNewRoomName('');
      setNewRoomPassword('');
      setIsNewRoomPrivate(false);
    } catch (err) {
      alert("Failed to create room");
    }
  };
  
  const handleDeleteRoom = async (roomId: string) => {
    if (!window.confirm("Are you sure you want to delete this room? This action cannot be undone.")) return;
    try {
        await mockBackend.deleteRoom(roomId);
    } catch (error) {
        console.error("Failed to delete room", error);
        alert("Could not delete room");
    }
  };

  const maskEmail = (email: string) => {
    const [name] = email.split('@');
    return `${name}@*****`;
  };

  return (
    <div className="flex h-screen w-full bg-darker justify-center transition-colors duration-300">
      <div className="flex h-full w-full max-w-[1440px] bg-darker overflow-hidden relative shadow-2xl">
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full h-14 bg-paper border-b border-border-base flex items-center justify-between px-4 z-20">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-txt-main">
            <Menu size={24} />
        </button>
        <h1 className="font-bold text-txt-main truncate">
            {rooms.find(r => r.id === activeRoomId)?.name || 'Select Room'}
        </h1>
        <button onClick={() => setUserListOpen(!userListOpen)} className="text-txt-main">
            <UserIcon size={24} />
        </button>
      </div>

      {/* LEFT: Room List Sidebar */}
      <aside className={`
        fixed md:relative z-30 w-72 h-full bg-paper border-r border-border-base flex flex-col transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4 border-b border-border-base flex justify-between items-center">
          <h2 className="text-xl font-bold text-primary">Rooms</h2>
          <button 
            onClick={() => setShowCreateRoom(true)}
            className="p-2 bg-hover hover:bg-opacity-80 rounded-full transition text-txt-main"
          >
            <Plus size={18} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scroll p-2 space-y-2">
          {rooms.map(room => (
            <button
              key={room.id}
              onClick={() => handleJoinRoom(room)}
              className={`w-full p-3 rounded-lg flex items-center justify-between transition group
                ${activeRoomId === room.id ? 'bg-primary/20 border border-primary/50 text-txt-main' : 'hover:bg-hover text-txt-muted hover:text-txt-main'}
              `}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {room.isPrivate ? <Lock size={16} className="text-amber-500 flex-shrink-0" /> : <Hash size={16} className="text-txt-muted flex-shrink-0" />}
                <div className="text-left overflow-hidden">
                    <span className="block font-medium truncate">{room.name}</span>
                    <span className="text-xs opacity-60 truncate block">{room.description}</span>
                </div>
              </div>

              {currentUser.id === room.createdBy && (
                 <div
                    role="button"
                    title="Delete Room"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRoom(room.id);
                    }}
                    className="ml-2 p-1.5 text-txt-muted hover:text-red-400 hover:bg-red-500/10 rounded-md transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                 >
                    <Trash2 size={16} />
                 </div>
              )}
            </button>
          ))}
        </div>

        {/* Current User footer */}
        <div className="p-4 border-t border-border-base bg-darker/50 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShowProfile(true)}>
                <img src={currentUser.avatar} alt="Me" className="w-8 h-8 rounded-full bg-slate-600 object-cover" />
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-txt-main">{currentUser.name}</span>
                    <span className="text-xs text-txt-muted">{maskEmail(currentUser.email)}</span>
                </div>
            </div>
            <div className="flex items-center gap-1">
                <button 
                    onClick={toggleTheme}
                    className="p-2 text-txt-muted hover:text-primary rounded-full hover:bg-hover transition"
                    title="Toggle Theme"
                >
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <button onClick={onLogout} className="p-2 text-txt-muted hover:text-red-400 rounded-full hover:bg-hover transition" title="Logout">
                    <LogOut size={18} />
                </button>
            </div>
        </div>
      </aside>

      {/* CENTER: Chat Area */}
      <main className="flex-1 flex flex-col h-full relative pt-14 md:pt-0 bg-dark">
        
        {!activeRoomId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-txt-muted bg-dark p-8 text-center">
            <div className="w-20 h-20 bg-paper rounded-full flex items-center justify-center mb-6 shadow-sm">
                <MessageSquare size={40} className="text-txt-muted" />
            </div>
            <h3 className="text-2xl font-bold text-txt-main mb-2">Welcome, {currentUser.name}!</h3>
            <p className="max-w-md">Please select a room from the sidebar to start chatting. Private rooms require a password to enter.</p>
          </div>
        ) : (
          <>
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scroll bg-dark">
              {messages.map((msg, idx) => {
                const isMe = msg.senderId === currentUser.id;
                return (
                  <div key={msg.id || idx} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    <img 
                        src={msg.senderAvatar} 
                        alt={msg.senderName} 
                        className="w-8 h-8 rounded-full object-cover mt-1 flex-shrink-0" 
                    />
                    <div className={`max-w-[75%] md:max-w-[60%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-txt-muted">{msg.senderName}</span>
                        <span className="text-xs text-txt-muted opacity-80">
                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      
                      {msg.type === 'text' ? (
                        <div className={`
                            px-4 py-2 rounded-2xl text-sm leading-relaxed
                            ${isMe ? 'bg-primary text-white rounded-tr-sm' : 'bg-msg-received text-txt-main border border-border-base rounded-tl-sm'}
                        `}>
                            {msg.content}
                        </div>
                      ) : (
                        <div className={`
                            p-1 rounded-lg overflow-hidden border border-border-base
                            ${isMe ? 'bg-primary/20' : 'bg-paper'}
                        `}>
                            <img src={msg.content} alt="Shared" className="max-w-full rounded h-auto max-h-64 object-contain" />
                            <div className="text-[10px] text-center w-full text-txt-muted mt-1 uppercase tracking-wider">WEBP Generated</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-paper border-t border-border-base">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <div className="relative">
                        <input 
                            type="file" 
                            accept="image/*" 
                            ref={fileInputRef}
                            className="hidden" 
                            onChange={handleFileUpload}
                        />
                        <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-3 text-txt-muted hover:text-primary hover:bg-hover rounded-full transition"
                        >
                            <ImageIcon size={20} />
                        </button>
                    </div>
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder={`Message #${rooms.find(r => r.id === activeRoomId)?.name || '...'}`}
                        className="flex-1 bg-input-bg border border-border-base text-txt-main rounded-full px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition placeholder-txt-muted"
                    />
                    <button 
                        type="submit"
                        className="p-3 bg-primary hover:bg-blue-600 text-white rounded-full transition shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!inputMessage.trim() && !activeRoomId}
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>
          </>
        )}
      </main>

      {/* RIGHT: User List Sidebar (Collapsible) */}
      <aside className={`
        fixed md:relative z-30 right-0 w-64 h-full bg-paper border-l border-border-base flex flex-col transition-transform duration-300
        ${userListOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
         <div className="p-4 border-b border-border-base flex justify-between items-center">
            <h2 className="font-bold text-txt-main">Online Users</h2>
            <button className="md:hidden text-txt-muted" onClick={() => setUserListOpen(false)}>
                <X size={18} />
            </button>
         </div>
         <div className="flex-1 overflow-y-auto custom-scroll p-2">
             {users.map(u => (
                 <div key={u.id} className="flex items-center gap-3 p-2 hover:bg-hover rounded-lg transition opacity-90 hover:opacity-100">
                     <div className="relative">
                         <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover bg-slate-700" />
                         {u.isOnline && (
                             <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-paper rounded-full"></span>
                         )}
                     </div>
                     <div className="flex flex-col overflow-hidden">
                         <span className="text-sm font-medium text-txt-main truncate">{u.name}</span>
                         <span className="text-xs text-txt-muted truncate">{maskEmail(u.email)}</span>
                     </div>
                 </div>
             ))}
         </div>
      </aside>

      {/* Overlay for mobile sidebars */}
      {(sidebarOpen || userListOpen) && (
        <div 
            className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm"
            onClick={() => { setSidebarOpen(false); setUserListOpen(false); }}
        />
      )}

      {/* Create Room Modal */}
      {showCreateRoom && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-paper border border-border-base p-6 rounded-2xl w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-txt-main">Create New Room</h3>
                    <button onClick={() => setShowCreateRoom(false)} className="text-txt-muted hover:text-txt-main">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={createRoom} className="space-y-4">
                    <div>
                        <label className="block text-sm text-txt-muted mb-1">Room Name</label>
                        <input 
                            required
                            type="text" 
                            className="w-full bg-input-bg border border-border-base rounded-lg p-3 text-txt-main focus:border-primary focus:outline-none"
                            value={newRoomName}
                            onChange={e => setNewRoomName(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="isPrivate"
                            checked={isNewRoomPrivate}
                            onChange={e => setIsNewRoomPrivate(e.target.checked)}
                            className="w-4 h-4 rounded border-border-base bg-input-bg text-primary focus:ring-offset-0"
                        />
                        <label htmlFor="isPrivate" className="text-sm text-txt-main">Private Room (Requires Password)</label>
                    </div>
                    {isNewRoomPrivate && (
                         <div>
                            <label className="block text-sm text-txt-muted mb-1">Room Password</label>
                            <input 
                                required={isNewRoomPrivate}
                                type="password" 
                                className="w-full bg-input-bg border border-border-base rounded-lg p-3 text-txt-main focus:border-primary focus:outline-none"
                                value={newRoomPassword}
                                onChange={e => setNewRoomPassword(e.target.value)}
                            />
                        </div>
                    )}
                    <button type="submit" className="w-full py-3 bg-primary hover:bg-blue-600 rounded-lg font-bold text-white transition mt-2">
                        Create Room
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* Join Private Room Modal */}
      {showPasswordModal && pendingRoom && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-paper border border-border-base p-6 rounded-2xl w-full max-w-sm shadow-2xl">
             <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <Lock className="text-amber-500" size={24} />
                    <h3 className="text-xl font-bold text-txt-main">Private Room</h3>
                </div>
                <button onClick={closePasswordModal} className="text-txt-muted hover:text-txt-main">
                    <X size={20} />
                </button>
            </div>
            <p className="text-txt-muted mb-4">
                Enter password to join <span className="text-txt-main font-medium">{pendingRoom.name}</span>
            </p>
            <form onSubmit={handleJoinPrivateSubmit}>
                <input 
                    autoFocus
                    type="password"
                    placeholder="Room Password"
                    className={`w-full bg-input-bg border ${joinError ? 'border-red-500' : 'border-border-base'} rounded-lg p-3 text-txt-main focus:border-primary focus:outline-none mb-2`}
                    value={joinPassword}
                    onChange={e => { setJoinPassword(e.target.value); setJoinError(''); }}
                />
                {joinError && <p className="text-red-400 text-xs mb-4">{joinError}</p>}
                
                <div className="flex gap-3 mt-4">
                    <button type="button" onClick={closePasswordModal} className="flex-1 py-2 bg-hover hover:bg-opacity-80 rounded-lg text-txt-main font-medium transition">
                        Cancel
                    </button>
                    <button type="submit" className="flex-1 py-2 bg-primary hover:bg-blue-600 rounded-lg text-white font-bold transition">
                        Join
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <UserProfileModal user={currentUser} onClose={() => setShowProfile(false)} />
        </div>
      )}

      </div>
    </div>
  );
};

// Profile Modal Sub-component
const UserProfileModal: React.FC<{ user: User, onClose: () => void }> = ({ user, onClose }) => {
    const [name, setName] = useState(user.name);
    const [avatar, setAvatar] = useState(user.avatar);
    // Initialize password as empty. User must type to change it.
    const [password, setPassword] = useState('');
    
    const handleSave = async (e: FormEvent) => {
        e.preventDefault();
        try {
            // Prepare updates. Only include password if user typed something.
            const updates: Partial<User> = { name, avatar };
            if (password.trim()) {
                updates.password = password;
            }

            await mockBackend.updateProfile(user.id, updates);
            onClose();
        } catch (error) {
            alert('Failed to update profile');
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const webp = await convertImageToWebP(file);
                setAvatar(webp);
            } catch(e) {
                alert("Failed to process avatar image");
            }
        }
    };

    return (
        <div className="bg-paper border border-border-base p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
             <button onClick={onClose} className="absolute top-4 right-4 text-txt-muted hover:text-txt-main">
                <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-txt-main mb-6">Edit Profile</h3>
            
            <form onSubmit={handleSave} className="space-y-4">
                <div className="flex flex-col items-center mb-4">
                    <div className="relative group cursor-pointer w-24 h-24 mb-2">
                        <img src={avatar} alt="Profile" className="w-full h-full rounded-full object-cover border-2 border-primary" />
                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                            <ImageIcon size={24} className="text-white" />
                        </div>
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleAvatarUpload} />
                    </div>
                    <span className="text-xs text-txt-muted">Click to change avatar (WebP)</span>
                </div>

                <div>
                    <label className="block text-sm text-txt-muted mb-1">Display Name</label>
                    <input 
                        required type="text" value={name} onChange={e => setName(e.target.value)}
                        className="w-full bg-input-bg border border-border-base rounded-lg p-3 text-txt-main focus:border-primary focus:outline-none"
                    />
                </div>
                 <div>
                    <label className="block text-sm text-txt-muted mb-1">Email (Read Only)</label>
                    <input 
                        readOnly type="email" value={user.email}
                        className="w-full bg-darker border border-border-base rounded-lg p-3 text-txt-muted cursor-not-allowed"
                    />
                </div>
                 <div>
                    <label className="block text-sm text-txt-muted mb-1">New Password</label>
                    <input 
                        type="password" 
                        placeholder="Leave blank to keep unchanged"
                        value={password} 
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-input-bg border border-border-base rounded-lg p-3 text-txt-main focus:border-primary focus:outline-none"
                    />
                </div>
                <button type="submit" className="w-full py-3 bg-primary hover:bg-blue-600 rounded-lg font-bold text-white transition mt-4">
                    Save Changes
                </button>
            </form>
        </div>
    );
}

export default ChatApp;