import React, { useState, useEffect } from 'react';
import { X, Image, Video, Music, Upload, Trash2, Search, Filter, HardDrive } from 'lucide-react';
import type { MediaItem, MediaType } from '../types';
import { getAllMedia, deleteMedia, getStorageUsage } from '../services/mediaService';

interface MediaLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (item: MediaItem) => void;
  filterType?: MediaType;
}

const MediaLibrary: React.FC<MediaLibraryProps> = ({
  isOpen,
  onClose,
  onSelect,
  filterType,
}) => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<MediaType | 'all'>(filterType || 'all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [storageUsage, setStorageUsage] = useState({ used: 0, available: 0, percentage: 0 });

  useEffect(() => {
    if (isOpen) {
      loadMedia();
      loadStorageUsage();
    }
  }, [isOpen]);

  const loadMedia = async () => {
    const items = await getAllMedia();
    setMedia(items);
  };

  const loadStorageUsage = async () => {
    const usage = await getStorageUsage();
    setStorageUsage(usage);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      await deleteMedia(id);
      await loadMedia();
      await loadStorageUsage();
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
    }
  };

  const handleSelect = (item: MediaItem) => {
    if (onSelect) {
      onSelect(item);
      onClose();
    } else {
      setSelectedItem(item);
    }
  };

  const filteredMedia = media.filter((item) => {
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    const matchesSource = sourceFilter === 'all' || item.generatedWith === sourceFilter;
    const matchesSearch = searchQuery === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.prompt?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSource && matchesSearch;
  });

  const getSourceLabel = (source?: string): string => {
    switch (source) {
      case 'imagen': return 'Imagen';
      case 'veo3': return 'Veo 3';
      case 'musicfx': return 'MusicFX';
      case 'upload': return 'Uploaded';
      default: return source || 'Unknown';
    }
  };

  const getSourceColor = (source?: string): string => {
    switch (source) {
      case 'imagen': return 'bg-blue-500';
      case 'veo3': return 'bg-purple-500';
      case 'musicfx': return 'bg-green-500';
      case 'upload': return 'bg-gray-500';
      default: return 'bg-gray-600';
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const uniqueSources = [...new Set(media.map(m => m.generatedWith).filter(Boolean))];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-lg w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-semibold text-white">Media Library</h2>
            <span className="text-sm text-gray-500">
              {filteredMedia.length} items
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-white/10 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name or prompt..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Type and Source filters */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-500">Type:</span>
              <div className="flex space-x-1">
                {(['all', 'image', 'video', 'audio'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      typeFilter === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {uniqueSources.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Source:</span>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Sources</option>
                  {uniqueSources.map((source) => (
                    <option key={source} value={source}>
                      {getSourceLabel(source)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Media Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {filteredMedia.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Upload className="w-12 h-12 mb-4" />
                <p className="text-lg">No media items found</p>
                <p className="text-sm mt-2">Upload files or generate content to see them here</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filteredMedia.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={`relative group cursor-pointer rounded-lg overflow-hidden bg-white/5 border-2 transition-all ${
                      selectedItem?.id === item.id
                        ? 'border-blue-500'
                        : 'border-transparent hover:border-white/20'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="aspect-video relative bg-black">
                      {item.type === 'image' && (
                        <img
                          src={item.url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                      {item.type === 'video' && (
                        <>
                          {item.thumbnail ? (
                            <img
                              src={item.thumbnail}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <video
                              src={item.url}
                              className="w-full h-full object-cover"
                              muted
                            />
                          )}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Video className="w-8 h-8 text-white/80" />
                          </div>
                        </>
                      )}
                      {item.type === 'audio' && (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-900 to-green-700">
                          <Music className="w-12 h-12 text-white/80" />
                        </div>
                      )}

                      {/* Type badge */}
                      <div className="absolute top-2 left-2">
                        <span className={`${getSourceColor(item.generatedWith)} px-2 py-0.5 rounded text-xs text-white`}>
                          {getSourceLabel(item.generatedWith)}
                        </span>
                      </div>

                      {/* Duration/Size badge */}
                      {(item.duration || item.size) && (
                        <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-0.5 rounded text-xs text-white">
                          {item.duration ? formatDuration(item.duration) : formatFileSize(item.size)}
                        </div>
                      )}

                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-red-500/80 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <Trash2 className="w-3 h-3 text-white" />
                      </button>
                    </div>

                    {/* Info */}
                    <div className="p-2">
                      <p className="text-sm text-white truncate">{item.name}</p>
                      {item.prompt && (
                        <p className="text-xs text-gray-500 truncate mt-1">{item.prompt}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview Panel */}
          {selectedItem && !onSelect && (
            <div className="w-80 border-l border-white/10 p-4 overflow-y-auto">
              <h3 className="text-white font-medium mb-4">Preview</h3>

              {/* Preview content */}
              <div className="rounded-lg overflow-hidden bg-black mb-4">
                {selectedItem.type === 'image' && (
                  <img
                    src={selectedItem.url}
                    alt={selectedItem.name}
                    className="w-full"
                  />
                )}
                {selectedItem.type === 'video' && (
                  <video
                    src={selectedItem.url}
                    controls
                    className="w-full"
                  />
                )}
                {selectedItem.type === 'audio' && (
                  <div className="p-4">
                    <div className="flex items-center justify-center mb-4">
                      <Music className="w-16 h-16 text-green-400" />
                    </div>
                    <audio src={selectedItem.url} controls className="w-full" />
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Name:</span>
                  <span className="text-white ml-2">{selectedItem.name}</span>
                </div>
                <div>
                  <span className="text-gray-500">Type:</span>
                  <span className="text-white ml-2 capitalize">{selectedItem.type}</span>
                </div>
                <div>
                  <span className="text-gray-500">Source:</span>
                  <span className="text-white ml-2">{getSourceLabel(selectedItem.generatedWith)}</span>
                </div>
                {selectedItem.size && (
                  <div>
                    <span className="text-gray-500">Size:</span>
                    <span className="text-white ml-2">{formatFileSize(selectedItem.size)}</span>
                  </div>
                )}
                {selectedItem.width && selectedItem.height && (
                  <div>
                    <span className="text-gray-500">Dimensions:</span>
                    <span className="text-white ml-2">{selectedItem.width}x{selectedItem.height}</span>
                  </div>
                )}
                {selectedItem.duration && (
                  <div>
                    <span className="text-gray-500">Duration:</span>
                    <span className="text-white ml-2">{formatDuration(selectedItem.duration)}</span>
                  </div>
                )}
                {selectedItem.prompt && (
                  <div>
                    <span className="text-gray-500">Prompt:</span>
                    <p className="text-white mt-1 text-xs bg-white/5 rounded p-2">
                      {selectedItem.prompt}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Created:</span>
                  <span className="text-white ml-2">
                    {new Date(selectedItem.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with storage info */}
        <div className="p-3 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <HardDrive className="w-4 h-4" />
            <span>Storage: {formatFileSize(storageUsage.used)} / ~5 MB ({storageUsage.percentage}%)</span>
          </div>
          {storageUsage.percentage > 80 && (
            <span className="text-yellow-500 text-sm">Storage almost full</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaLibrary;
