import React, { useState, useEffect } from 'react';
import { X, Key, Check, AlertCircle, Eye, EyeOff, ExternalLink, Trash2, Shield, Clock } from 'lucide-react';
import { getStoredApiKey, saveApiKey, clearApiKey, hasApiKey, getStorageMode, setStorageMode, type ApiKeyStorageMode } from '../services/aiService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [storageMode, setStorageModeState] = useState<ApiKeyStorageMode>('session');

  useEffect(() => {
    if (isOpen) {
      const storedKey = getStoredApiKey();
      setHasKey(!!storedKey);
      setStorageModeState(getStorageMode());
      // Show masked version if key exists
      if (storedKey) {
        setApiKey(storedKey);
      } else {
        setApiKey('');
      }
      setSaved(false);
      setError('');
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!apiKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    // Basic validation - Gemini keys start with 'AI'
    if (!apiKey.startsWith('AI')) {
      setError('Invalid API key format. Gemini API keys start with "AI"');
      return;
    }

    saveApiKey(apiKey.trim(), storageMode);
    setHasKey(true);
    setSaved(true);
    setError('');

    // Auto-close after a moment
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const handleClear = () => {
    clearApiKey();
    setApiKey('');
    setHasKey(false);
    setSaved(false);
  };

  const handleStorageModeChange = (mode: ApiKeyStorageMode) => {
    setStorageModeState(mode);
    // If we have a key, migrate it to the new storage mode
    if (hasKey && apiKey) {
      setStorageMode(mode);
    }
  };

  const maskKey = (key: string): string => {
    if (key.length <= 8) return key;
    return key.substring(0, 4) + '•'.repeat(key.length - 8) + key.substring(key.length - 4);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-lg overflow-hidden border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl">
              <Key className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-3 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6">
          {/* API Key Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-base font-medium text-white">Gemini API Key</label>
              {hasKey && (
                <span className="text-sm text-green-400 flex items-center space-x-1">
                  <Check className="w-4 h-4" />
                  <span>Configured</span>
                </span>
              )}
            </div>

            <p className="text-sm text-gray-400">
              Your API key is stored only in your browser and never sent to any server.
            </p>

            {/* API Key Input */}
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={showKey ? apiKey : (hasKey && apiKey ? maskKey(apiKey) : apiKey)}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setError('');
                  setSaved(false);
                }}
                placeholder="Enter your Gemini API key..."
                className="w-full px-5 py-4 pr-12 bg-white/5 border-2 border-white/10 rounded-xl text-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white transition-colors"
              >
                {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Storage Mode Toggle */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Storage Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleStorageModeChange('session')}
                  className={`flex items-center space-x-2 p-3 rounded-lg border-2 transition-all ${
                    storageMode === 'session'
                      ? 'border-green-500 bg-green-500/10 text-green-400'
                      : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <div className="text-left">
                    <div className="text-sm font-medium">Session Only</div>
                    <div className="text-xs opacity-70">Clears on tab close</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleStorageModeChange('persistent')}
                  className={`flex items-center space-x-2 p-3 rounded-lg border-2 transition-all ${
                    storageMode === 'persistent'
                      ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                      : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <div className="text-left">
                    <div className="text-sm font-medium">Remember</div>
                    <div className="text-xs opacity-70">Persists across sessions</div>
                  </div>
                </button>
              </div>
              <p className="text-xs text-gray-500">
                {storageMode === 'session'
                  ? '🔒 Most secure: Key is cleared when you close the browser tab.'
                  : '⚠️ Convenient but less secure: Key stays in browser storage.'}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {saved && (
              <div className="flex items-center space-x-2 text-green-400 text-sm">
                <Check className="w-4 h-4" />
                <span>API key saved successfully!</span>
              </div>
            )}

            {/* Get API Key Link */}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              <span>Get a free Gemini API key from Google AI Studio</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              disabled={!apiKey.trim() || saved}
              className="flex-1 flex items-center justify-center space-x-2 px-5 py-4 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl text-white text-base font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {saved ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Key className="w-5 h-5" />
                  <span>Save API Key</span>
                </>
              )}
            </button>

            {hasKey && (
              <button
                onClick={handleClear}
                className="px-5 py-4 bg-white/5 hover:bg-red-500/20 hover:text-red-400 rounded-xl text-gray-400 text-base transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                title="Remove API Key"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="px-5 py-4 bg-white/5 border-t border-white/10">
          <p className="text-xs text-gray-500 text-center">
            Powered by Google Gemini AI. Your API key enables AI code generation, images, and planning features.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
