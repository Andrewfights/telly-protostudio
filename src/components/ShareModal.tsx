import React, { useState } from 'react';
import { X, Link2, Copy, Check, FileJson } from 'lucide-react';
import type { Prototype } from '../types';
import { createShareLink } from '../services/apiService';
import { exportAsJson } from '../utils/exportUtils';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  prototype: Prototype | null;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, prototype }) => {
  const [shareUrl, setShareUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !prototype) return null;

  const handleCreateLink = async () => {
    setIsCreating(true);
    setError('');

    try {
      const result = await createShareLink(prototype.id);
      const fullUrl = `${window.location.origin}${result.data.shareUrl}`;
      setShareUrl(fullUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create share link');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportJson = () => {
    exportAsJson(prototype);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative bg-[#1a1a1a] rounded-xl border border-white/10 w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Share Prototype</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Generate Link Section */}
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Link2 className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <div className="font-medium text-white">Shareable Link</div>
                <div className="text-xs text-gray-400">Generate a unique URL to share</div>
              </div>
            </div>

            {shareUrl ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300"
                />
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            ) : (
              <button
                onClick={handleCreateLink}
                disabled={isCreating}
                className="w-full py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 transition-colors text-sm"
              >
                {isCreating ? 'Creating...' : 'Generate Share Link'}
              </button>
            )}
          </div>

          {/* Export JSON Section */}
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <FileJson className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <div className="font-medium text-white">Export as File</div>
                <div className="text-xs text-gray-400">Download JSON that others can import</div>
              </div>
            </div>

            <button
              onClick={handleExportJson}
              className="w-full py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors text-sm"
            >
              Download .telly.json
            </button>
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
