import React, { useState, useRef, useEffect } from 'react';
import { LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface UserMenuProps {
  onOpenSettings?: () => void;
  onOpenLogin?: () => void;
}

export default function UserMenu({ onOpenSettings, onOpenLogin }: UserMenuProps) {
  const { user, userProfile, loading, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
    );
  }

  // Not logged in
  if (!user) {
    return (
      <button
        onClick={onOpenLogin}
        className="h-7 px-3 rounded-lg flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-medium transition-all"
      >
        <User className="w-3.5 h-3.5" />
        <span>Sign In</span>
      </button>
    );
  }

  // Logged in - show avatar and menu
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-1 rounded-lg hover:bg-white/10 transition-colors"
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'User'}
            className="w-7 h-7 rounded-full border border-white/20"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
            {(user.displayName || user.email || 'U')[0].toUpperCase()}
          </div>
        )}
        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-[#1a1a1a] rounded-xl border border-white/10 shadow-xl overflow-hidden z-50">
          {/* User info */}
          <div className="p-3 border-b border-white/10">
            <p className="text-sm font-medium text-white truncate">
              {user.displayName || 'User'}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {user.email}
            </p>
          </div>

          {/* Menu items */}
          <div className="p-1">
            {onOpenSettings && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenSettings();
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-colors text-sm"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
