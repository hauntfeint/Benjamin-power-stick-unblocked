/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Gamepad2, Search, X, Maximize2, ExternalLink, Shield, Heart, History, User, Settings, LogOut, Link2, BookOpen, GraduationCap, ChevronRight, ChevronDown, Send, Sparkles, Loader2, Dices } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { GoogleGenAI } from "@google/genai";
import gamesData from './games.json';

interface Game {
  id: string;
  name: string;
  url: string;
  category: string;
  mirrors: string[];
  thumbnail: string;
  description: string;
}

export default function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isPanicMode, setIsPanicMode] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [user, setUser] = useState<{ name: string; code: string } | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [lastPlayedId, setLastPlayedId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'account' | 'login'>('home');
  const [activeTab, setActiveTab] = useState<'games' | 'education'>('games');
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedQuarter, setSelectedQuarter] = useState<string | null>(null);
  const [activeUrl, setActiveUrl] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [authError, setAuthError] = useState<string | null>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setGames(gamesData);
    // Load local storage data
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));

    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
    
    const savedLastPlayed = localStorage.getItem('lastPlayed');
    if (savedLastPlayed) setLastPlayedId(savedLastPlayed);
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    if (lastPlayedId) localStorage.setItem('lastPlayed', lastPlayedId);
  }, [lastPlayedId]);

  const generateAccountCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'BP-';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const toggleFavorite = (e: React.MouseEvent, gameId: string) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(gameId) ? prev.filter(id => id !== gameId) : [...prev, gameId]
    );
  };

  const handleGameSelect = (game: Game) => {
    setSelectedGame(game);
    setActiveUrl(game.url);
    setLastPlayedId(game.id);
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const username = formData.get('username') as string;
    
    // Simple profanity filter
    const badWords = ['fuck', 'shit', 'bitch', 'cunt', 'dick', 'pussy', 'asshole', 'bastard']; 
    const lowerUsername = (username || '').toLowerCase();
    
    const containsBadWord = badWords.some(word => lowerUsername.includes(word));

    if (containsBadWord) {
      setAuthError('Inappropriate name detected. Please choose another.');
      return;
    }

    setUser({ 
      name: username || 'Guest User', 
      code: generateAccountCode() 
    });
    setCurrentView('home');
    setAuthMode('login');
  };

  const toggleFullscreen = () => {
    if (gameContainerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        gameContainerRef.current.requestFullscreen().catch((err) => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
      }
    }
  };

  const filteredGames = games.filter(game => {
    const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || game.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const playRandomGame = () => {
    if (games.length === 0) return;
    const randomIndex = Math.floor(Math.random() * games.length);
    handleGameSelect(games[randomIndex]);
  };

  const categories = ['All', ...Array.from(new Set(games.map(g => g.category)))];

  // Panic button handler (stealth mode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '`') {
        setIsPanicMode(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isPanicMode) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col z-[9999] overflow-auto">
        {/* Fake Google Docs Toolbar */}
        <div className="h-12 border-b border-gray-200 bg-white flex items-center px-4 gap-4 shrink-0">
          <button 
            onClick={() => setIsPanicMode(false)}
            className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
            title="Resume Session"
          >
            <div className="w-6 h-8 bg-blue-600 rounded-sm flex items-center justify-center">
              <div className="w-4 h-0.5 bg-white mb-1"></div>
              <div className="w-4 h-0.5 bg-white"></div>
            </div>
            <span className="font-medium text-sm">Resume Game</span>
          </button>
          <div className="h-6 w-px bg-gray-200 mx-2"></div>
          <div className="flex items-center gap-4 text-gray-600 text-sm font-medium">
            <span>File</span>
            <span>Edit</span>
            <span>View</span>
            <span>Insert</span>
            <span>Format</span>
            <span>Tools</span>
          </div>
        </div>

        <div className="flex-1 flex justify-center p-8 bg-[#F8F9FA]">
          <div className="max-w-[816px] w-full bg-white shadow-md p-[96px] font-serif text-gray-800 min-h-[1056px]">
            <h1 className="text-3xl font-bold mb-8 text-center">The Impact of Renewable Energy on Global Economics</h1>
            <p className="mb-6 leading-relaxed">
              The transition toward renewable energy sources represents one of the most significant shifts in the global economic landscape of the 21st century. As nations grapple with the dual challenges of climate change and energy security, the move away from fossil fuels has triggered a cascade of innovations and market realignments.
            </p>
            <p className="mb-6 leading-relaxed">
              Historically, the global economy has been tethered to the volatility of oil and gas markets. However, the decreasing costs of solar and wind technologies have begun to decouple economic growth from carbon emissions. Investment in green infrastructure not only mitigates environmental risks but also serves as a potent engine for job creation in emerging sectors.
            </p>
            <div className="h-4 bg-gray-100 rounded w-full mb-4"></div>
            <div className="h-4 bg-gray-100 rounded w-5/6 mb-4"></div>
            <div className="h-4 bg-gray-100 rounded w-full mb-4"></div>
            <p className="text-xs text-gray-400 mt-20 text-center italic">Document saved to Drive • Press ` to return</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 shrink-0">
            <div 
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => {
                setCurrentView('home');
                setActiveTab('games');
              }}
            >
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-white" />
              </div>
              <h1 className="font-bold text-lg tracking-tight hidden lg:block">
                Benjamin Power Stick <span className="text-blue-500">Unblocked</span>
              </h1>
            </div>
            
            <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10 ml-2">
              <button 
                onClick={() => setActiveTab('games')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'games' ? 'bg-blue-600 text-white' : 'text-white/40 hover:text-white'}`}
              >
                <Gamepad2 className="w-3.5 h-3.5" />
                Games
              </button>
              <button 
                onClick={() => setActiveTab('education')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'education' ? 'bg-blue-600 text-white' : 'text-white/40 hover:text-white'}`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                Education
              </button>
            </div>
          </div>

          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder={activeTab === 'games' ? "Search games..." : "Search subjects..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:border-blue-500/50 transition-colors text-sm"
            />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => setIsPanicMode(true)}
              className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white"
              title="Panic Button (Press `)"
            >
              <Shield className="w-4 h-4" />
            </button>
            
            {user ? (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentView('account')}
                  className={`flex items-center gap-2 border px-3 py-1.5 rounded-full transition-all group ${currentView === 'account' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white/5 hover:bg-white/10 border-white/10'}`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${currentView === 'account' ? 'bg-black/20 text-white' : 'bg-blue-600/20 border border-blue-600/30 text-blue-400'}`}>
                    {user.name[0]}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${currentView === 'account' ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>Account</span>
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setCurrentView('login')}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${currentView === 'login' ? 'bg-blue-600 text-white' : 'bg-white text-black hover:bg-blue-600 hover:text-white'}`}
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Login Modal */}
      <AnimatePresence>
        {isLoginModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          >
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
              onClick={() => setIsLoginModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl"
            >
              <button 
                onClick={() => setIsLoginModalOpen(false)}
                className="absolute top-4 right-4 p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Gamepad2 className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold">
                  {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-white/40 text-sm mt-1">
                  {authMode === 'login' 
                    ? 'Sign in to save your favorite games' 
                    : 'Join the community to track your progress'}
                </p>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Username</label>
                  <input 
                    name="username"
                    type="text" 
                    placeholder="Enter username"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-colors"
                    required
                  />
                </div>
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Email</label>
                    <input 
                      type="email" 
                      placeholder="your@email.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-colors"
                      required
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Password</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-colors"
                    required
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-500 transition-colors mt-4"
                >
                  {authMode === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </form>
              
              <p className="text-center text-xs text-white/20 mt-6">
                {authMode === 'login' ? (
                  <>
                    Don't have an account?{' '}
                    <button 
                      onClick={() => setAuthMode('signup')}
                      className="text-blue-500 hover:underline font-medium"
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button 
                      onClick={() => setAuthMode('login')}
                      className="text-blue-500 hover:underline font-medium"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login View */}
      <AnimatePresence mode="wait">
        {currentView === 'login' && !user && (
          <motion.main 
            key="login-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-md mx-auto px-4 py-20"
          >
            <div className="bg-[#111] border border-white/10 rounded-[32px] p-8 sm:p-12 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-blue-400"></div>
              
              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/20">
                  <Gamepad2 className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-black tracking-tight">
                  {authMode === 'login' ? 'Welcome Back' : 'Join the Club'}
                </h2>
                <p className="text-white/40 text-sm mt-2">
                  {authMode === 'login' 
                    ? 'Sign in to access your unique account code' 
                    : 'Create an account to save your favorite games'}
                </p>
              </div>

              <form onSubmit={handleAuth} className="space-y-5">
                {authError && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold text-center"
                  >
                    {authError}
                  </motion.div>
                )}
                <div>
                  <label className="block text-[10px] font-bold text-white/20 uppercase tracking-widest mb-2 ml-1">Username</label>
                  <input 
                    name="username"
                    type="text" 
                    placeholder="Enter your gamer tag"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-blue-500/50 transition-all text-sm placeholder:text-white/10"
                    required
                  />
                </div>
                {authMode === 'signup' && (
                  <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl mb-4">
                    <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest text-center">
                      No Email Required • Just your gamer tag
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-bold text-white/20 uppercase tracking-widest mb-2 ml-1">Password</label>
                  <input 
                    name="password"
                    type="password" 
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-blue-500/50 transition-all text-sm placeholder:text-white/10"
                    required
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-500 transform active:scale-[0.98] transition-all mt-4 shadow-lg shadow-blue-500/10"
                >
                  {authMode === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </form>
              
              <div className="mt-8 pt-8 border-t border-white/5 text-center">
                <p className="text-xs text-white/20">
                  {authMode === 'login' ? (
                    <>
                      New here?{' '}
                      <button 
                        onClick={() => setAuthMode('signup')}
                        className="text-blue-500 hover:text-blue-400 font-bold transition-colors"
                      >
                        Create an account
                      </button>
                    </>
                  ) : (
                    <>
                      Already a member?{' '}
                      <button 
                        onClick={() => setAuthMode('login')}
                        className="text-blue-500 hover:text-blue-400 font-bold transition-colors"
                      >
                        Sign in instead
                      </button>
                    </>
                  )}
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => setCurrentView('home')}
              className="mt-8 mx-auto flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm font-bold"
            >
              <Gamepad2 className="w-4 h-4" />
              Back to Games
            </button>
          </motion.main>
        )}

        {currentView === 'account' && user && (
          <motion.main 
            key="account-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-4xl mx-auto px-4 py-12"
          >
            <div className="bg-[#111] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl">
              <div className="p-8 sm:p-12 border-b border-white/10 bg-gradient-to-br from-blue-600/10 to-transparent">
                <div className="flex flex-col sm:flex-row items-center gap-8">
                  <div className="w-32 h-32 rounded-[40px] bg-blue-600 flex items-center justify-center text-white text-5xl font-black shadow-lg shadow-blue-500/20">
                    {user.name[0]}
                  </div>
                  <div className="text-center sm:text-left flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                      <h2 className="text-4xl font-black tracking-tight">{user.name}</h2>
                      <span className="px-3 py-1 bg-blue-600/10 border border-blue-600/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest rounded-full self-start sm:self-center">
                        Verified Gamer
                      </span>
                    </div>
                    <p className="text-white/40 font-medium">Level 1 Explorer • Member since March 2026</p>
                    
                    <div className="mt-6 flex flex-wrap gap-3 justify-center sm:justify-start">
                      <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
                        <span className="block text-[10px] text-white/20 uppercase font-bold tracking-widest">Account Code</span>
                        <span className="font-mono text-blue-400 font-bold">{user.code}</span>
                      </div>
                      <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
                        <span className="block text-[10px] text-white/20 uppercase font-bold tracking-widest">Games Played</span>
                        <span className="font-bold">24</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 sm:p-12 grid md:grid-cols-2 gap-12">
                <div>
                  <h3 className="text-sm font-bold text-white/20 uppercase tracking-widest mb-6">Account Settings</h3>
                  <div className="space-y-3">
                    <button className="w-full flex items-center justify-between p-5 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-blue-600/20 transition-colors">
                          <User className="w-5 h-5 text-white/40 group-hover:text-blue-400" />
                        </div>
                        <div className="text-left">
                          <span className="block text-sm font-bold">Profile Details</span>
                          <span className="text-[10px] text-white/20">Change name and avatar</span>
                        </div>
                      </div>
                      <Settings className="w-4 h-4 text-white/10" />
                    </button>
                    <button className="w-full flex items-center justify-between p-5 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-blue-600/20 transition-colors">
                          <Shield className="w-5 h-5 text-white/40 group-hover:text-blue-400" />
                        </div>
                        <div className="text-left">
                          <span className="block text-sm font-bold">Security</span>
                          <span className="text-[10px] text-white/20">Password and privacy</span>
                        </div>
                      </div>
                      <Settings className="w-4 h-4 text-white/10" />
                    </button>
                    <button 
                      onClick={() => {
                        setUser(null);
                        setCurrentView('home');
                      }}
                      className="w-full flex items-center gap-4 p-5 bg-red-500/5 hover:bg-red-500/10 text-red-500 rounded-2xl transition-all group border border-red-500/10"
                    >
                      <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                        <LogOut className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-bold">Logout Session</span>
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white/20 uppercase tracking-widest mb-6">Activity Stats</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
                      <Heart className="w-6 h-6 text-red-500 mb-4" />
                      <span className="block text-2xl font-black">{favorites.length}</span>
                      <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Favorites</span>
                    </div>
                    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
                      <Gamepad2 className="w-6 h-6 text-blue-600 mb-4" />
                      <span className="block text-2xl font-black">12h</span>
                      <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Play Time</span>
                    </div>
                  </div>
                  
                  <div className="mt-8 p-6 bg-blue-600/5 border border-blue-600/10 rounded-3xl">
                    <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">Pro Tip</h4>
                    <p className="text-xs text-white/60 leading-relaxed">
                      Use the <span className="text-white font-bold">Panic Button (`)</span> anytime to instantly hide your gaming session behind a professional document.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setCurrentView('home')}
              className="mt-8 mx-auto flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm font-bold"
            >
              <Gamepad2 className="w-4 h-4" />
              Back to Games
            </button>
          </motion.main>
        )}

        {currentView === 'home' && (
          <motion.main 
            key="home-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-7xl mx-auto px-4 py-8"
          >
            {/* Last Played Section */}
            {activeTab === 'games' && lastPlayedId && (
              <section className="mb-12">
                <div className="flex items-center gap-2 mb-6">
                  <History className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-bold">Continue Playing</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {games.filter(g => g.id === lastPlayedId).map(game => (
                    <motion.div
                      key={`last-${game.id}`}
                      onClick={() => handleGameSelect(game)}
                      className="group cursor-pointer bg-white/5 border border-white/10 rounded-3xl overflow-hidden flex items-center p-4 gap-4 hover:bg-white/10 transition-all"
                      whileHover={{ x: 4 }}
                    >
                      <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0">
                        <img src={game.thumbnail} alt={game.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-blue-400 truncate">{game.name}</h3>
                        <p className="text-xs text-white/40 line-clamp-2 mt-1">{game.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Favorites Section */}
            {activeTab === 'games' && favorites.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center gap-2 mb-6">
                  <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                  <h2 className="text-xl font-bold">Your Favorites</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {games.filter(g => favorites.includes(g.id)).map((game) => (
                    <motion.div
                      key={`fav-${game.id}`}
                      onClick={() => handleGameSelect(game)}
                      className="group cursor-pointer"
                      whileHover={{ y: -4 }}
                    >
                      <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-white/5 border border-white/10 relative mb-3">
                        <img
                          src={game.thumbnail}
                          alt={game.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
                          <div className="bg-blue-600 text-white px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 shadow-xl shadow-blue-500/20">
                            Play Now
                          </div>
                        </div>
                        <div className="absolute top-3 left-3 px-2 py-1 bg-black/50 backdrop-blur-md rounded-lg border border-white/10">
                          <span className="text-[8px] font-black text-white/60 uppercase tracking-widest">{game.category}</span>
                        </div>
                        <button 
                          onClick={(e) => toggleFavorite(e, game.id)}
                          className="absolute top-3 right-3 p-2 bg-black/50 backdrop-blur-md rounded-full text-red-500 hover:scale-110 transition-transform z-10"
                        >
                          <Heart className="w-4 h-4 fill-red-500" />
                        </button>
                      </div>
                      <h3 className="font-medium text-sm group-hover:text-blue-400 transition-colors">{game.name}</h3>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {activeTab === 'games' ? (
              <>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                  <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
                          selectedCategory === cat 
                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' 
                            : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  
                  <button 
                    onClick={playRandomGame}
                    className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 active:scale-95 shrink-0"
                  >
                    <Dices className="w-5 h-5" />
                    Play Random
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {filteredGames.map((game) => (
                    <motion.div
                      key={game.id}
                      layoutId={game.id}
                      onClick={() => handleGameSelect(game)}
                      className="group cursor-pointer"
                      whileHover={{ y: -4 }}
                    >
                      <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-white/5 border border-white/10 relative mb-3">
                        <img
                          src={game.thumbnail}
                          alt={game.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
                          <div className="bg-blue-600 text-white px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 shadow-xl shadow-blue-500/20">
                            Play Now
                          </div>
                        </div>
                        <div className="absolute top-3 left-3 px-2 py-1 bg-black/50 backdrop-blur-md rounded-lg border border-white/10">
                          <span className="text-[8px] font-black text-white/60 uppercase tracking-widest">{game.category}</span>
                        </div>
                        <button 
                          onClick={(e) => toggleFavorite(e, game.id)}
                          className={`absolute top-3 right-3 p-2 bg-black/50 backdrop-blur-md rounded-full transition-all hover:scale-110 z-10 ${favorites.includes(game.id) ? 'text-red-500' : 'text-white/40 hover:text-white'}`}
                        >
                          <Heart className={`w-4 h-4 ${favorites.includes(game.id) ? 'fill-red-500' : ''}`} />
                        </button>
                      </div>
                      <h3 className="font-medium text-sm group-hover:text-blue-400 transition-colors">{game.name}</h3>
                    </motion.div>
                  ))}
                </div>
              </>
            ) : (
              <EducationView 
                selectedGrade={selectedGrade} 
                setSelectedGrade={setSelectedGrade}
                selectedQuarter={selectedQuarter}
                setSelectedQuarter={setSelectedQuarter}
                searchQuery={searchQuery}
              />
            )}

            {filteredGames.length === 0 && (
              <div className="text-center py-20">
                <p className="text-white/40">No games found matching "{searchQuery}"</p>
              </div>
            )}
          </motion.main>
        )}
      </AnimatePresence>

      {/* Game Modal */}
      <AnimatePresence>
        {selectedGame && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
          >
            <div 
              className="absolute inset-0 bg-black/90 backdrop-blur-sm" 
              onClick={() => setSelectedGame(null)}
            />
            
            <motion.div
              layoutId={selectedGame.id}
              ref={gameContainerRef}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ 
                type: "spring", 
                damping: 25, 
                stiffness: 300,
                layout: { duration: 0.4, ease: "easeOut" }
              }}
              className="relative w-full max-w-6xl aspect-video bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col"
            >
              {/* Modal Header */}
              <motion.div 
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="h-14 bg-white/5 border-b border-white/10 flex items-center justify-between px-6 shrink-0"
              >
                <div className="flex flex-col">
                  <span className="font-bold text-blue-400 leading-tight">{selectedGame.name}</span>
                  <span className="text-[10px] text-white/40 truncate max-w-[200px] sm:max-w-md">
                    {selectedGame.description}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Mirror Selector */}
                  <div className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 mr-2">
                    <button 
                      onClick={() => setActiveUrl(selectedGame.url)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${activeUrl === selectedGame.url ? 'bg-blue-600 text-white' : 'text-white/40 hover:text-white'}`}
                    >
                      Main
                    </button>
                    {selectedGame.mirrors.map((mirror, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setActiveUrl(mirror)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${activeUrl === mirror ? 'bg-blue-600 text-white' : 'text-white/40 hover:text-white'}`}
                      >
                        Mirror {idx + 1}
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={(e) => toggleFavorite(e, selectedGame.id)}
                    className={`p-2 hover:bg-white/10 rounded-lg transition-colors ${favorites.includes(selectedGame.id) ? 'text-red-500' : 'text-white/60 hover:text-white'}`}
                    title="Favorite"
                  >
                    <Heart className={`w-5 h-5 ${favorites.includes(selectedGame.id) ? 'fill-red-500' : ''}`} />
                  </button>
                  <button 
                    onClick={toggleFullscreen}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                    title="Toggle Fullscreen"
                  >
                    <Maximize2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => window.open(selectedGame.url, '_blank')}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setSelectedGame(null)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>

              {/* Game Frame */}
              <motion.div 
                key={activeUrl}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex-1 bg-black relative"
              >
                <iframe
                  src={activeUrl}
                  className="w-full h-full border-none"
                  allow="fullscreen; autoplay; encrypted-media"
                  title={selectedGame.name}
                />
                
                {/* Mobile Mirror Switcher Overlay */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 md:hidden flex items-center gap-2 bg-black/80 backdrop-blur-md p-2 rounded-2xl border border-white/10">
                  <Link2 className="w-4 h-4 text-blue-500 ml-2" />
                  <select 
                    value={activeUrl}
                    onChange={(e) => setActiveUrl(e.target.value)}
                    className="bg-transparent text-xs font-bold focus:outline-none pr-2"
                  >
                    <option value={selectedGame.url}>Main Link</option>
                    {selectedGame.mirrors.map((mirror, idx) => (
                      <option key={idx} value={mirror}>Mirror {idx + 1}</option>
                    ))}
                  </select>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 py-12 border-t border-white/10 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-sm text-white/40">
            © 2026 Benjamin Power Stick Unblocked. All rights reserved.
          </div>
          <div className="flex items-center gap-6 text-sm text-white/40">
            <a href="#" className="hover:text-blue-500 transition-colors">Privacy</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Terms</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function EducationView({ selectedGrade, setSelectedGrade, selectedQuarter, setSelectedQuarter, searchQuery }: any) {
  const grades = [
    { id: '3', label: '3rd Grade' },
    { id: '4', label: '4th Grade' },
    { id: '5', label: '5th Grade' },
    { id: '6', label: '6th Grade' },
    { id: '7', label: '7th Grade' },
    { id: '8', label: '8th Grade' },
    { id: '9', label: '9th Grade' },
    { id: '10', label: '10th Grade' },
    { id: '11', label: '11th Grade' },
    { id: '12', label: '12th Grade' },
  ];

  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

  const subjects = [
    { name: 'Mathematics', icon: 'Σ', color: 'bg-blue-500', url: 'https://www.khanacademy.org/math', description: 'Algebra, Geometry, Calculus and more.' },
    { name: 'Science', icon: '🔬', color: 'bg-purple-500', url: 'https://www.khanacademy.org/science', description: 'Biology, Chemistry, Physics and Earth Science.' },
    { name: 'English Language Arts', icon: '📚', color: 'bg-orange-500', url: 'https://www.readworks.org/', description: 'Reading comprehension, writing, and grammar.' },
    { name: 'Social Studies', icon: '🌍', color: 'bg-blue-500', url: 'https://www.history.com/', description: 'World history, geography, and civics.' },
    { name: 'Computer Science', icon: '💻', color: 'bg-slate-700', url: 'https://code.org/', description: 'Programming, algorithms, and digital literacy.' },
    { name: 'Art & Music', icon: '🎨', color: 'bg-pink-500', url: 'https://www.google.com/culturalinstitute/beta/category/artist', description: 'Art history, music theory, and creative expression.' },
  ];

  const filteredSubjects = subjects.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold">Educational Portal</h2>
        </div>
        {searchQuery && (
          <div className="text-xs text-white/40 font-bold uppercase tracking-widest">
            Showing results for "{searchQuery}"
          </div>
        )}
      </div>

      {searchQuery ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSubjects.map((subject) => (
              <a
                key={subject.name}
                href={subject.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all flex flex-col gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${subject.color} rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-black/20 group-hover:scale-110 transition-transform`}>
                    {subject.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors">{subject.name}</h4>
                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mt-0.5">Resource</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-white/10 ml-auto group-hover:text-white transition-colors" />
                </div>
                <p className="text-xs text-white/50 leading-relaxed">
                  {subject.description}
                </p>
              </a>
            ))}
          </div>
          {filteredSubjects.length === 0 && (
            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[32px] text-white/20">
              <Search className="w-8 h-8 mb-4" />
              <p className="text-sm font-bold">No subjects found matching "{searchQuery}"</p>
            </div>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Grade Selection */}
          <div className="md:col-span-1 space-y-2">
            <h3 className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-4 ml-1">Select Grade</h3>
            {grades.map((grade) => (
              <button
                key={grade.id}
                onClick={() => {
                  setSelectedGrade(grade.id);
                  setSelectedQuarter(null);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all border ${selectedGrade === grade.id ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'}`}
              >
                <span className="text-sm font-bold">{grade.label}</span>
                <ChevronRight className={`w-4 h-4 transition-transform ${selectedGrade === grade.id ? 'rotate-90' : ''}`} />
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="md:col-span-3 space-y-8">
            {selectedGrade ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Quarter Selection */}
                <div className="flex items-center gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl w-fit">
                  {quarters.map((q) => (
                    <button
                      key={q}
                      onClick={() => setSelectedQuarter(q)}
                      className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${selectedQuarter === q ? 'bg-blue-600 text-white' : 'text-white/40 hover:text-white'}`}
                    >
                      {q}
                    </button>
                  ))}
                </div>

                {selectedQuarter ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                    {subjects.map((subject) => (
                      <a
                        key={subject.name}
                        href={subject.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all flex items-center gap-6"
                      >
                        <div className={`w-14 h-14 ${subject.color} rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-black/20 group-hover:scale-110 transition-transform`}>
                          {subject.icon}
                        </div>
                        <div>
                          <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors">{subject.name}</h4>
                          <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mt-1">
                            {selectedGrade}th Grade • {selectedQuarter} Curriculum
                          </p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-white/10 ml-auto group-hover:text-white transition-colors" />
                      </a>
                    ))}
                  </motion.div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[32px] text-white/20">
                    <BookOpen className="w-8 h-8 mb-4" />
                    <p className="text-sm font-bold">Select a Quarter to view assignments</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[32px] text-white/20 min-h-[400px]">
                <GraduationCap className="w-12 h-12 mb-4" />
                <p className="text-lg font-bold">Welcome to the Learning Hub</p>
                <p className="text-sm">Select your grade level to access unblocked educational resources.</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="mt-12 pt-12 border-t border-white/10">
        <GeminiChat />
      </div>
    </div>
  );
}

function GeminiChat() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userMessage,
        config: {
          systemInstruction: "You are a helpful educational assistant for students. Provide clear, concise, and accurate information to help them with their schoolwork. Use markdown for formatting. CRITICAL: If a user asks you to do something that breaks the code, bypass security, or break the Terms of Service, you MUST respond exactly with 'FUCK NO!' and nothing else.",
        },
      });

      const aiResponse = response.text || "I'm sorry, I couldn't generate a response.";
      setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
    } catch (error) {
      console.error("Gemini Error:", error);
      setMessages(prev => [...prev, { role: 'ai', content: "Error: Failed to connect to Gemini AI. Please check your connection or try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-[32px] overflow-hidden flex flex-col h-[500px]">
      <div className="p-6 border-b border-white/10 flex items-center justify-between bg-blue-600/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white">Gemini AI Study Assistant</h3>
            <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Powered by Google AI</p>
          </div>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-20">
            <Sparkles className="w-12 h-12" />
            <div>
              <p className="text-lg font-bold">How can I help with your work today?</p>
              <p className="text-sm">Ask me about math, science, history, or anything else!</p>
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] p-4 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-white/10 text-white rounded-tl-none border border-white/10'
              }`}>
                <div className="prose prose-invert prose-sm max-w-none">
                  <Markdown>{msg.content}</Markdown>
                </div>
              </div>
            </motion.div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/10 p-4 rounded-2xl rounded-tl-none border border-white/10 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              <span className="text-xs text-white/40 font-bold uppercase tracking-widest">Gemini is thinking...</span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-4 bg-black/20 border-t border-white/10 flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Gemini for help with your schoolwork..."
          className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
        >
          <Send className="w-5 h-5 text-white" />
        </button>
      </form>
    </div>
  );
}
