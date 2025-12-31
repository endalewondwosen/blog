import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Editor from './pages/Editor';
import PostView from './pages/PostView';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import { User } from './types';
import { api } from './services/api';
import { ToastProvider } from './context/ToastContext';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
        try {
            const currentUser = await api.getCurrentUser();
            setUser(currentUser);
        } catch (e) {
            console.error("Auth check failed", e);
        } finally {
            setLoading(false);
        }
    };
    checkAuth();
  }, []);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
  };

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );
  }

  return (
    <HelmetProvider>
      <ToastProvider>
        <Router>
          <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-gray-900">
            <Navbar user={user} onLogout={handleLogout} />
            
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route 
                  path="/login" 
                  element={!user ? <Login onLoginSuccess={handleLogin} /> : <Navigate to="/" />} 
                />
                <Route 
                  path="/create" 
                  element={user ? <Editor user={user} /> : <Navigate to="/login" />} 
                />
                <Route 
                  path="/edit/:id" 
                  element={user ? <Editor user={user} /> : <Navigate to="/login" />} 
                />
                <Route 
                  path="/profile" 
                  element={user ? <Profile user={user} /> : <Navigate to="/login" />} 
                />
                <Route 
                  path="/admin" 
                  element={user && user.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} 
                />
                <Route path="/post/:id" element={<PostView user={user} />} />
              </Routes>
            </main>

            <footer className="bg-white border-t border-gray-100 py-10 mt-auto">
              <div className="max-w-5xl mx-auto px-4 text-center text-gray-500">
                <p className="mb-2">&copy; {new Date().getFullYear()} MyBlog. All rights reserved.</p>
                <p className="text-sm">MERN Stack • Powered by Gemini</p>
              </div>
            </footer>
          </div>
        </Router>
      </ToastProvider>
    </HelmetProvider>
  );
};

export default App;