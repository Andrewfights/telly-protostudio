import React, { useState } from 'react';
import { X, Youtube, Tv, Star, Search, Play, ExternalLink, Check } from 'lucide-react';
import type { VideoSourceConfig, CuratedContent } from '../types';
import { CURATED_CONTENT, CONTENT_CATEGORIES, getCuratedByCategory, searchCurated } from '../data/curatedContent';

interface VideoSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (config: VideoSourceConfig, name: string) => void;
  loop: boolean;
}

type TabId = 'youtube' | 'plutotv' | 'curated';

const VideoSourceModal: React.FC<VideoSourceModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  loop,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('curated');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [plutoChannel, setPlutoChannel] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [autoplay, setAutoplay] = useState(true);
  const [muted, setMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);

  if (!isOpen) return null;

  // Extract YouTube video ID from URL
  const extractYoutubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleYoutubeSubmit = () => {
    const videoId = extractYoutubeId(youtubeUrl);
    if (!videoId) {
      alert('Invalid YouTube URL or video ID');
      return;
    }

    onSelect({
      type: 'youtube',
      videoId,
      autoplay,
      loop,
      muted,
      controls: showControls,
    }, `YouTube: ${videoId}`);
    onClose();
  };

  const handlePlutoSubmit = () => {
    if (!plutoChannel.trim()) {
      alert('Please enter a Pluto TV channel');
      return;
    }

    onSelect({
      type: 'plutotv',
      channelSlug: plutoChannel.trim(),
      autoplay: true,
      loop: false,
      muted,
      controls: false,
    }, `Pluto TV: ${plutoChannel}`);
    onClose();
  };

  const handleCuratedSelect = (item: CuratedContent) => {
    if (item.type === 'youtube' && item.videoId) {
      onSelect({
        type: 'youtube',
        videoId: item.videoId,
        autoplay,
        loop,
        muted,
        controls: showControls,
      }, item.name);
    } else if (item.type === 'plutotv' && item.channelSlug) {
      onSelect({
        type: 'plutotv',
        channelSlug: item.channelSlug,
        autoplay: true,
        loop: false,
        muted,
        controls: false,
      }, item.name);
    }
    onClose();
  };

  // Filter curated content
  const filteredContent = searchQuery
    ? searchCurated(searchQuery)
    : selectedCategory === 'all'
    ? CURATED_CONTENT
    : getCuratedByCategory(selectedCategory);

  const tabs = [
    { id: 'curated' as TabId, label: 'Curated', icon: Star },
    { id: 'youtube' as TabId, label: 'YouTube', icon: Youtube },
    { id: 'plutotv' as TabId, label: 'Pluto TV', icon: Tv },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Add Video Source</h2>
          <button
            onClick={onClose}
            className="p-3 hover:bg-white/10 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Tabs - TV optimized with larger touch targets */}
        <div className="flex border-b border-white/10">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center space-x-3 py-5 text-lg transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500 ${
                activeTab === id
                  ? 'bg-white/10 text-white border-b-3 border-blue-500'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Curated Tab */}
          {activeTab === 'curated' && (
            <div className="space-y-5">
              {/* Search - TV optimized */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-5 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30"
                />
              </div>

              {/* Category filters - TV optimized with larger buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-5 py-3 rounded-xl text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                    selectedCategory === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/10 text-gray-400 hover:bg-white/20'
                  }`}
                >
                  All
                </button>
                {CONTENT_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-5 py-3 rounded-xl text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                      selectedCategory === cat.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/10 text-gray-400 hover:bg-white/20'
                    }`}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>

              {/* Content grid - TV optimized with larger cards */}
              <div className="grid grid-cols-2 gap-4">
                {filteredContent.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleCuratedSelect(item)}
                    className="group relative bg-white/5 rounded-xl overflow-hidden hover:bg-white/10 transition-all text-left focus:outline-none focus:ring-3 focus:ring-cyan-500 focus:scale-[1.02]"
                  >
                    {/* Thumbnail */}
                    <div className="aspect-video bg-black relative">
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {item.type === 'youtube' ? (
                            <Youtube className="w-12 h-12 text-red-500" />
                          ) : (
                            <Tv className="w-12 h-12 text-blue-500" />
                          )}
                        </div>
                      )}
                      {/* Play overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
                        <Play className="w-14 h-14 text-white" />
                      </div>
                      {/* Type badge */}
                      <div className="absolute top-3 right-3">
                        {item.type === 'youtube' ? (
                          <span className="bg-red-600 text-white text-sm px-2.5 py-1 rounded-lg font-medium">YT</span>
                        ) : (
                          <span className="bg-blue-600 text-white text-sm px-2.5 py-1 rounded-lg font-medium">Pluto</span>
                        )}
                      </div>
                    </div>
                    {/* Info */}
                    <div className="p-4">
                      <p className="text-base text-white font-semibold truncate">{item.name}</p>
                      {item.description && (
                        <p className="text-sm text-gray-500 truncate mt-1">{item.description}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {filteredContent.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">No content found</p>
                </div>
              )}
            </div>
          )}

          {/* YouTube Tab - TV optimized */}
          {activeTab === 'youtube' && (
            <div className="space-y-5">
              <div>
                <label className="block text-base text-gray-400 mb-3">
                  YouTube URL or Video ID
                </label>
                <input
                  type="text"
                  placeholder="https://youtube.com/watch?v=... or video ID"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30"
                />
              </div>

              {/* Preview */}
              {extractYoutubeId(youtubeUrl) && (
                <div className="aspect-video bg-black rounded-xl overflow-hidden">
                  <img
                    src={`https://img.youtube.com/vi/${extractYoutubeId(youtubeUrl)}/hqdefault.jpg`}
                    alt="Video thumbnail"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Options - TV optimized with larger touch targets */}
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center space-x-4 p-5 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 focus-within:ring-2 focus-within:ring-cyan-500 transition-colors">
                  <input
                    type="checkbox"
                    checked={autoplay}
                    onChange={(e) => setAutoplay(e.target.checked)}
                    className="w-6 h-6 rounded-lg border-2 border-gray-600 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-base text-gray-300 font-medium">Autoplay</span>
                </label>
                <label className="flex items-center space-x-4 p-5 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 focus-within:ring-2 focus-within:ring-cyan-500 transition-colors">
                  <input
                    type="checkbox"
                    checked={muted}
                    onChange={(e) => setMuted(e.target.checked)}
                    className="w-6 h-6 rounded-lg border-2 border-gray-600 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-base text-gray-300 font-medium">Start Muted</span>
                </label>
                <label className="flex items-center space-x-4 p-5 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 focus-within:ring-2 focus-within:ring-cyan-500 transition-colors">
                  <input
                    type="checkbox"
                    checked={showControls}
                    onChange={(e) => setShowControls(e.target.checked)}
                    className="w-6 h-6 rounded-lg border-2 border-gray-600 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-base text-gray-300 font-medium">Show Controls</span>
                </label>
              </div>

              <button
                onClick={handleYoutubeSubmit}
                disabled={!extractYoutubeId(youtubeUrl)}
                className="w-full py-5 bg-red-600 hover:bg-red-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl text-white text-lg font-semibold transition-colors flex items-center justify-center space-x-3 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-[#1a1a1a]"
              >
                <Youtube className="w-7 h-7" />
                <span>Add YouTube Video</span>
              </button>
            </div>
          )}

          {/* Pluto TV Tab - TV optimized */}
          {activeTab === 'plutotv' && (
            <div className="space-y-5">
              <div className="bg-blue-500/10 border-2 border-blue-500/20 rounded-xl p-5">
                <p className="text-base text-blue-300">
                  Pluto TV offers free streaming. Enter a channel slug or try one of the popular channels below.
                </p>
              </div>

              <div>
                <label className="block text-base text-gray-400 mb-3">
                  Channel Slug
                </label>
                <input
                  type="text"
                  placeholder="e.g., classic-tv, pluto-tv-movies"
                  value={plutoChannel}
                  onChange={(e) => setPlutoChannel(e.target.value)}
                  className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              {/* Popular channels - TV optimized */}
              <div>
                <p className="text-base text-gray-400 mb-3">Popular Channels</p>
                <div className="grid grid-cols-2 gap-3">
                  {['classic-tv', 'pluto-tv-movies', 'pluto-tv-drama', 'pluto-tv-comedy'].map((slug) => (
                    <button
                      key={slug}
                      onClick={() => setPlutoChannel(slug)}
                      className={`px-5 py-4 rounded-xl text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                        plutoChannel === slug
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      {slug}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center space-x-4 p-5 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 focus-within:ring-2 focus-within:ring-cyan-500 transition-colors">
                <input
                  type="checkbox"
                  checked={muted}
                  onChange={(e) => setMuted(e.target.checked)}
                  className="w-6 h-6 rounded-lg border-2 border-gray-600 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-base text-gray-300 font-medium">Start Muted</span>
              </label>

              <button
                onClick={handlePlutoSubmit}
                disabled={!plutoChannel.trim()}
                className="w-full py-5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl text-white text-lg font-semibold transition-colors flex items-center justify-center space-x-3 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-[#1a1a1a]"
              >
                <Tv className="w-7 h-7" />
                <span>Add Pluto TV Channel</span>
              </button>

              <a
                href="https://pluto.tv/live-tv"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-3 text-base text-gray-400 hover:text-white transition-colors py-3"
              >
                <span>Browse Pluto TV channels</span>
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>
          )}
        </div>

        {/* Footer with loop indicator - TV optimized */}
        <div className="p-5 border-t border-white/10 flex items-center justify-between text-base text-gray-500">
          <div className="flex items-center space-x-3">
            <Check className={`w-6 h-6 ${loop ? 'text-green-400' : 'text-gray-600'}`} />
            <span>Loop: {loop ? 'Enabled' : 'Disabled'}</span>
          </div>
          <span>Toggle loop in the main panel</span>
        </div>
      </div>
    </div>
  );
};

export default VideoSourceModal;
