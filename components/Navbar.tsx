import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PenSquare, LogOut, User as UserIcon, LogIn } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 bg-opacity-80 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg group-hover:bg-indigo-700 transition-colors">
              M
            </div>
            <span className="font-bold text-xl text-gray-900 tracking-tight">MyBlog</span>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link
                  to="/create"
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    isActive('/create')
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <PenSquare size={18} />
                  <span className="hidden sm:inline">Write</span>
                </Link>
                
                <div className="h-6 w-px bg-gray-200 mx-1"></div>

                <div className="flex items-center gap-2">
                    <Link to="/profile" className="flex items-center gap-2 hover:bg-gray-50 rounded-full py-1 px-2 pr-4 transition-colors">
                        <img 
                            src={user.avatarUrl} 
                            alt={user.username} 
                            className="w-8 h-8 rounded-full border border-gray-200"
                        />
                        <span className="text-sm font-medium text-gray-700 hidden md:block">{user.username}</span>
                    </Link>
                    <button
                        onClick={onLogout}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Logout"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-full text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md"
              >
                <LogIn size={18} />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;