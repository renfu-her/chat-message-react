import React, { useState, useEffect } from 'react';
import ChatApp from './components/ChatApp';
import { User } from './types';
import { mockBackend } from './services/mockBackend';
import { MessageSquare, Mail, Lock, User as UserIcon } from 'lucide-react';

// Pre-defined test accounts for the "Tip" section
const TEST_ACCOUNTS = [
    { u: 'user1@test.com', p: 'password123' },
    { u: 'user2@test.com', p: 'password123' },
    { u: 'user3@test.com', p: 'password123' },
    { u: 'user4@test.com', p: 'password123' },
    { u: 'user5@test.com', p: 'password123' },
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check for persistent session simulation
  useEffect(() => {
    const savedUser = localStorage.getItem('chat_current_user');
    if (savedUser) {
        setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const loggedInUser = await mockBackend.login(email, password);
      setUser(loggedInUser);
      localStorage.setItem('chat_current_user', JSON.stringify(loggedInUser));
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const newUser = await mockBackend.register(name, email, password);
      setUser(newUser);
      localStorage.setItem('chat_current_user', JSON.stringify(newUser));
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (user) {
        mockBackend.logout(user.id);
    }
    setUser(null);
    localStorage.removeItem('chat_current_user');
    setEmail('');
    setPassword('');
  };

  if (user) {
    return <ChatApp currentUser={user} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-darker flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-paper border border-slate-800 p-8 rounded-2xl shadow-2xl">
        <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                <MessageSquare size={32} className="text-primary" />
            </div>
        </div>
        
        <h2 className="text-3xl font-bold text-center text-white mb-2">
            {view === 'LOGIN' ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-slate-400 text-center mb-8">
            {view === 'LOGIN' ? 'Enter your credentials to access the chat' : 'Join the community today'}
        </p>

        {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg text-sm text-center">
                {error}
            </div>
        )}

        <form onSubmit={view === 'LOGIN' ? handleLogin : handleRegister} className="space-y-4">
          {view === 'REGISTER' && (
             <div className="relative">
                <UserIcon className="absolute left-3 top-3.5 text-slate-500" size={20} />
                <input
                    type="text"
                    placeholder="Display Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg pl-10 pr-4 py-3 focus:border-primary focus:outline-none"
                    required
                />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 text-slate-500" size={20} />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg pl-10 pr-4 py-3 focus:border-primary focus:outline-none"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-slate-500" size={20} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg pl-10 pr-4 py-3 focus:border-primary focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition transform active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Processing...' : (view === 'LOGIN' ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="mt-6 text-center">
            <button 
                onClick={() => setView(view === 'LOGIN' ? 'REGISTER' : 'LOGIN')}
                className="text-primary hover:underline text-sm"
            >
                {view === 'LOGIN' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
        </div>
      </div>
        
      {/* Helper Section for Test Accounts */}
      {view === 'LOGIN' && (
          <div className="mt-8 p-4 bg-slate-900/50 rounded-xl border border-slate-800 max-w-md w-full">
              <h4 className="text-slate-400 text-sm font-semibold mb-2 uppercase tracking-wider">Test Accounts</h4>
              <div className="grid grid-cols-2 gap-2">
                  {TEST_ACCOUNTS.map((acc, i) => (
                      <button 
                        key={i}
                        onClick={() => { setEmail(acc.u); setPassword(acc.p); }}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 px-3 rounded transition text-left truncate"
                      >
                        {acc.u}
                      </button>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
};

export default App;