import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, ArrowRight, Loader2, UserPlus, Lock, User } from 'lucide-react';
import { api } from '../services/api';
import { User as UserType } from '../types';

interface LoginProps {
  onLoginSuccess: (user: UserType) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setIsLoading(true);
    setError('');
    
    try {
        let user;
        if (isRegistering) {
            user = await api.register(username, password);
        } else {
            user = await api.login(username, password);
        }
        onLoginSuccess(user);
        navigate('/');
    } catch (err: any) {
        console.error("Auth failed", err);
        setError(err.message || "Authentication failed. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 sm:p-10 transition-all">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            {isRegistering ? <UserPlus size={32} /> : <LogIn size={32} />}
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {isRegistering ? 'Create Account' : 'Welcome back'}
          </h2>
          <p className="text-gray-500 mt-2">
            {isRegistering ? 'Join our community of writers' : 'Enter your details to access your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <User size={18} />
                    </div>
                    <input
                    type="text"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors outline-none"
                    placeholder="e.g. johndoe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Lock size={18} />
                    </div>
                    <input
                    type="password"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors outline-none"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    minLength={4}
                    />
                </div>
            </div>
          </div>

          {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center justify-center">
                  {error}
              </div>
          )}

          <button
            type="submit"
            disabled={!username.trim() || !password.trim() || isLoading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
            <span>{isLoading ? 'Processing...' : (isRegistering ? 'Sign Up' : 'Sign In')}</span>
          </button>
        </form>

        <div className="mt-6 text-center">
            <button
                onClick={() => {
                    setIsRegistering(!isRegistering);
                    setError('');
                }}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors hover:underline"
            >
                {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
        </div>
      </div>
    </div>
  );
};

export default Login;