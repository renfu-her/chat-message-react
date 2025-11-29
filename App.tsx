import React, { useState, useEffect } from 'react';
import ChatApp from './components/ChatApp';
import { User } from './types';
import { mockBackend } from './services/mockBackend';
import { MessageSquare, Mail, Lock, User as UserIcon, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Captcha State
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, operator: '+' });
  const [captchaInput, setCaptchaInput] = useState('');

  const generateCaptcha = () => {
    const operators = ['+', '-', '*', '/'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    let num1 = 0;
    let num2 = 0;

    switch (operator) {
        case '+':
            num1 = Math.floor(Math.random() * 20) + 1;
            num2 = Math.floor(Math.random() * 20) + 1;
            break;
        case '-':
            num1 = Math.floor(Math.random() * 20) + 1;
            num2 = Math.floor(Math.random() * 20) + 1;
            // Ensure positive result for better UX
            if (num1 < num2) {
                const temp = num1;
                num1 = num2;
                num2 = temp;
            }
            break;
        case '*':
            // Keep numbers small for multiplication
            num1 = Math.floor(Math.random() * 9) + 1;
            num2 = Math.floor(Math.random() * 9) + 1;
            break;
        case '/':
            // Ensure integer division result
            num2 = Math.floor(Math.random() * 9) + 1; // divisor 1-9
            const result = Math.floor(Math.random() * 9) + 1; // quotient 1-9
            num1 = num2 * result; // dividend
            break;
    }

    setCaptcha({ num1, num2, operator });
    setCaptchaInput('');
  };

  // Check for persistent session simulation
  useEffect(() => {
    const savedUser = localStorage.getItem('chat_current_user');
    if (savedUser) {
        setUser(JSON.parse(savedUser));
    }
    
    // Set initial theme on body if stored
    const storedTheme = localStorage.getItem('chat_theme') || 'dark';
    document.documentElement.className = storedTheme;
    
    generateCaptcha();
  }, []);

  // Regenerate captcha when switching views
  useEffect(() => {
    generateCaptcha();
    setError('');
  }, [view]);

  const calculateExpectedResult = () => {
      const { num1, num2, operator } = captcha;
      switch (operator) {
          case '+': return num1 + num2;
          case '-': return num1 - num2;
          case '*': return num1 * num2;
          case '/': return num1 / num2;
          default: return 0;
      }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Captcha Validation
    const expected = calculateExpectedResult();
    if (parseInt(captchaInput) !== expected) {
        setError('Incorrect verification code');
        generateCaptcha();
        return;
    }

    setLoading(true);
    setError('');
    try {
      const loggedInUser = await mockBackend.login(email, password);
      setUser(loggedInUser);
      localStorage.setItem('chat_current_user', JSON.stringify(loggedInUser));
    } catch (err: any) {
      setError(err.message || 'Login failed');
      generateCaptcha();
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
    setCaptchaInput('');
    generateCaptcha();
    setView('LOGIN');
  };

  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('chat_current_user', JSON.stringify(updatedUser));
  };

  if (user) {
    return <ChatApp currentUser={user} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />;
  }

  return (
    <div className="min-h-screen bg-darker flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-md bg-paper border border-border-base p-8 rounded-2xl shadow-2xl">
        <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                <MessageSquare size={32} className="text-primary" />
            </div>
        </div>
        
        <h2 className="text-3xl font-bold text-center text-txt-main mb-2">
            {view === 'LOGIN' ? 'Welcome Back' : 'Join Us'}
        </h2>
        <p className="text-txt-muted text-center mb-8">
            {view === 'LOGIN' ? 'Sign in to continue chatting' : 'Create an account to get started'}
        </p>

        {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg text-sm text-center">
                {error}
            </div>
        )}

        <form onSubmit={view === 'LOGIN' ? handleLogin : handleRegister} className="space-y-4">
          {view === 'REGISTER' && (
             <div className="relative">
                <UserIcon className="absolute left-3 top-3.5 text-txt-muted" size={20} />
                <input
                    type="text"
                    placeholder="Display Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-input-bg border border-border-base text-txt-main rounded-lg pl-10 pr-4 py-3 focus:border-primary focus:outline-none"
                    required
                />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 text-txt-muted" size={20} />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-input-bg border border-border-base text-txt-main rounded-lg pl-10 pr-4 py-3 focus:border-primary focus:outline-none"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-txt-muted" size={20} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-input-bg border border-border-base text-txt-main rounded-lg pl-10 pr-4 py-3 focus:border-primary focus:outline-none"
              required
            />
          </div>

          {/* CAPTCHA for Login Only */}
          {view === 'LOGIN' && (
             <div className="flex gap-2">
                <div className="flex-1 bg-darker border border-border-base rounded-lg flex items-center justify-center text-txt-main font-mono text-lg font-bold select-none">
                    {captcha.num1} {captcha.operator} {captcha.num2} = ?
                </div>
                <input
                    type="number"
                    placeholder="Code"
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    className="w-24 bg-input-bg border border-border-base text-txt-main rounded-lg px-3 py-3 focus:border-primary focus:outline-none text-center font-bold"
                    required
                />
                <button 
                    type="button" 
                    onClick={generateCaptcha}
                    className="p-3 bg-hover text-txt-muted hover:text-primary rounded-lg transition"
                >
                    <RefreshCw size={20} />
                </button>
             </div>
          )}

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
                onClick={() => {
                    setView(view === 'LOGIN' ? 'REGISTER' : 'LOGIN');
                    setError('');
                }}
                className="text-primary hover:underline text-sm"
            >
                {view === 'LOGIN' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default App;