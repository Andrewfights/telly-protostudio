import React, { useState, useEffect } from 'react';
import { X, Save, History, GitBranch, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string, options: { createVersion: boolean; commitMessage: string }) => Promise<void>;
  onOpenLogin?: () => void;
  initialName?: string;
  initialDescription?: string;
  isUpdate?: boolean;
  currentVersion?: number;
  totalVersions?: number;
}

const SaveModal: React.FC<SaveModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onOpenLogin,
  initialName = '',
  initialDescription = '',
  isUpdate = false,
  currentVersion = 1,
  totalVersions = 1,
}) => {
  const { user, loading, isConfigured } = useAuth();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [createVersion, setCreateVersion] = useState(true);
  const [commitMessage, setCommitMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Reset form when opening with new initial values
  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setDescription(initialDescription);
      setCommitMessage('');
      setError('');
    }
  }, [isOpen, initialName, initialDescription]);

  if (!isOpen) return null;

  // Show sign-in prompt if Firebase is configured but user is not logged in
  if (isConfigured && !loading && !user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/80" onClick={onClose} />
        <div className="relative bg-[#1a1a1a] rounded-xl border border-white/10 w-full max-w-md p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Save Prototype</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Sign In Required</h3>
            <p className="text-gray-400 text-sm mb-6">
              Sign in to save your prototypes to the cloud and access them from any device.
            </p>
            <button
              onClick={() => {
                onClose();
                onOpenLogin?.();
              }}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium transition-all"
            >
              <User className="w-4 h-4" />
              <span>Sign In to Save</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await onSave(name.trim(), description.trim(), {
        createVersion: isUpdate && createVersion,
        commitMessage: commitMessage.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative bg-[#1a1a1a] rounded-xl border border-white/10 w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">
            {isUpdate ? 'Update Prototype' : 'Save Prototype'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Version info for updates */}
        {isUpdate && (
          <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center space-x-3">
            <History className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-sm text-blue-300">
                Current: Version {currentVersion} of {totalVersions}
              </p>
              <p className="text-xs text-blue-400/70">
                {createVersion ? `Will create version ${totalVersions + 1}` : 'Will update in place'}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Prototype"
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={2}
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
            />
          </div>

          {/* Version control options (only for updates) */}
          {isUpdate && (
            <>
              <div className="border-t border-white/10 pt-4">
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={createVersion}
                    onChange={(e) => setCreateVersion(e.target.checked)}
                    className="w-5 h-5 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50"
                  />
                  <div className="flex items-center space-x-2">
                    <GitBranch className="w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                      Save as new version
                    </span>
                  </div>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-8">
                  Creates a snapshot you can rollback to later
                </p>
              </div>

              {createVersion && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Version Note (optional)
                  </label>
                  <input
                    type="text"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    placeholder="e.g., Updated header design, fixed ticker..."
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              )}
            </>
          )}

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <div className="flex space-x-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : isUpdate ? 'Update' : 'Save'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaveModal;
