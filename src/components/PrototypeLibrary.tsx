import React, { useState, useEffect } from 'react';
import { Search, Plus, Heart, Grid3X3, Upload, RefreshCw, User } from 'lucide-react';
import type { Prototype } from '../types';
import { listPrototypes, deletePrototype, toggleFavorite } from '../services/firestoreService';
import { useAuth } from '../contexts/AuthContext';
import PrototypeCard from './PrototypeCard';

interface PrototypeLibraryProps {
  onSelectPrototype: (prototype: Prototype) => void;
  onNewPrototype: () => void;
  onImport: () => void;
  onShare: (prototype: Prototype) => void;
  onEditPrototype: (prototype: Prototype) => void;
  onOpenLogin?: () => void;
}

const PrototypeLibrary: React.FC<PrototypeLibraryProps> = ({
  onSelectPrototype,
  onNewPrototype,
  onImport,
  onShare,
  onEditPrototype,
  onOpenLogin,
}) => {
  const { user, loading: authLoading, isConfigured } = useAuth();
  const [prototypes, setPrototypes] = useState<Prototype[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [error, setError] = useState('');

  const loadPrototypes = async () => {
    // Skip loading if not authenticated and Firebase is configured
    if (isConfigured && !user) {
      setPrototypes([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await listPrototypes({
        search: search || undefined,
        favoritesOnly: filter === 'favorites',
        sort: 'updatedAt',
        order: 'desc',
      });
      setPrototypes(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prototypes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadPrototypes();
    }
  }, [filter, user, authLoading]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (!authLoading) {
        loadPrototypes();
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  const handleDelete = async (id: string) => {
    try {
      await deletePrototype(id);
      setPrototypes((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const handleToggleFavorite = async (prototype: Prototype) => {
    try {
      const newFavoriteStatus = await toggleFavorite(prototype.id);
      setPrototypes((prev) =>
        prev.map((p) =>
          p.id === prototype.id ? { ...p, isFavorite: newFavoriteStatus } : p
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update favorite');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#111]">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Prototype Library</h1>
            <p className="text-sm text-gray-400 mt-1">
              {prototypes.length} prototype{prototypes.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onImport}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Import</span>
            </button>
            <button
              onClick={onNewPrototype}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Prototype</span>
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search prototypes..."
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex items-center bg-[#1a1a1a] rounded-lg p-1 border border-white/10">
            <button
              onClick={() => setFilter('all')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm transition-colors ${
                filter === 'all'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
              <span>All</span>
            </button>
            <button
              onClick={() => setFilter('favorites')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm transition-colors ${
                filter === 'favorites'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Heart className="w-4 h-4" />
              <span>Favorites</span>
            </button>
          </div>

          {/* Refresh */}
          <button
            onClick={loadPrototypes}
            disabled={isLoading}
            className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : isConfigured && !user ? (
          // Sign in prompt for non-authenticated users
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mb-6">
              <User className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">
              Sign In to View Your Projects
            </h3>
            <p className="text-sm text-gray-400 mb-6 max-w-md">
              Sign in with your Google account to save prototypes to the cloud and access them from any device.
            </p>
            <button
              onClick={onOpenLogin}
              className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium transition-all"
            >
              <User className="w-5 h-5" />
              <span>Sign In</span>
            </button>
          </div>
        ) : prototypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Grid3X3 className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              {filter === 'favorites' ? 'No favorites yet' : 'No prototypes yet'}
            </h3>
            <p className="text-sm text-gray-400 mb-6 max-w-md">
              {filter === 'favorites'
                ? 'Star your favorite prototypes to see them here'
                : 'Create your first Telly prototype or import one to get started'}
            </p>
            {filter === 'all' && (
              <button
                onClick={onNewPrototype}
                className="flex items-center space-x-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Create Prototype</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {prototypes.map((prototype) => (
              <PrototypeCard
                key={prototype.id}
                prototype={prototype}
                onSelect={() => onSelectPrototype(prototype)}
                onDelete={() => handleDelete(prototype.id)}
                onToggleFavorite={() => handleToggleFavorite(prototype)}
                onShare={() => onShare(prototype)}
                onEdit={() => onEditPrototype(prototype)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PrototypeLibrary;
