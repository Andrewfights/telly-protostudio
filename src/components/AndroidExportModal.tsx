import React, { useState } from 'react';
import { X, Smartphone, Package, FolderArchive, AlertCircle, Check, Loader2 } from 'lucide-react';
import type { Prototype, AndroidExportConfig } from '../types';
import { downloadAndroidProject, toPackageName, toProjectName, DEFAULT_ANDROID_CONFIG } from '../utils/androidExportUtils';

interface AndroidExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  prototype: Prototype;
}

const AndroidExportModal: React.FC<AndroidExportModalProps> = ({
  isOpen,
  onClose,
  prototype,
}) => {
  const [appName, setAppName] = useState(prototype.name || 'My Telly App');
  const [packageName, setPackageName] = useState(toPackageName(prototype.name || 'My Telly App'));
  const [versionName, setVersionName] = useState('1.0.0');
  const [versionCode, setVersionCode] = useState(1);
  const [minSdk, setMinSdk] = useState(DEFAULT_ANDROID_CONFIG.minSdk || 28);
  const [targetSdk, setTargetSdk] = useState(DEFAULT_ANDROID_CONFIG.targetSdk || 33);
  const [includeMedia, setIncludeMedia] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  // Auto-update package name when app name changes
  const handleAppNameChange = (name: string) => {
    setAppName(name);
    setPackageName(toPackageName(name));
  };

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    setSuccess(false);

    try {
      const config: AndroidExportConfig = {
        prototype,
        packageName,
        appName,
        versionCode,
        versionName,
        minSdk,
        targetSdk,
        includeMedia,
      };

      await downloadAndroidProject(config);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  // Count zones with content
  const activeZones = Object.entries(prototype.zoneContent)
    .filter(([_, content]) => content && content.trim())
    .map(([zone]) => zone);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <Smartphone className="w-5 h-5 text-green-400" />
            <h2 className="text-lg font-semibold text-white">Export Android Project</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Info banner */}
          <div className="flex items-start space-x-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <Package className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <p className="text-sm text-blue-300">
                Generates an Android Studio project you can build into an APK
              </p>
              <p className="text-xs text-blue-400/70 mt-1">
                Zones: {activeZones.join(', ') || 'None'} | Target: Telly (Android TV)
              </p>
            </div>
          </div>

          {/* App Name */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">App Name</label>
            <input
              type="text"
              value={appName}
              onChange={(e) => handleAppNameChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              placeholder="My Telly App"
            />
          </div>

          {/* Package Name */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Package Name</label>
            <input
              type="text"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono text-sm"
              placeholder="com.telly.myapp"
            />
            <p className="text-xs text-gray-500 mt-1">
              Must be a valid Java package name (e.g., com.company.app)
            </p>
          </div>

          {/* Version */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Version Name</label>
              <input
                type="text"
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                placeholder="1.0.0"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Version Code</label>
              <input
                type="number"
                value={versionCode}
                onChange={(e) => setVersionCode(parseInt(e.target.value) || 1)}
                min={1}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* SDK Versions */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Min SDK</label>
              <select
                value={minSdk}
                onChange={(e) => setMinSdk(parseInt(e.target.value))}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value={26}>API 26 (Android 8.0)</option>
                <option value={28}>API 28 (Android 9.0)</option>
                <option value={29}>API 29 (Android 10)</option>
                <option value={30}>API 30 (Android 11)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Target SDK</label>
              <select
                value={targetSdk}
                onChange={(e) => setTargetSdk(parseInt(e.target.value))}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value={31}>API 31 (Android 12)</option>
                <option value={32}>API 32 (Android 12L)</option>
                <option value={33}>API 33 (Android 13)</option>
                <option value={34}>API 34 (Android 14)</option>
              </select>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-2">
            <label className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
              <input
                type="checkbox"
                checked={includeMedia}
                onChange={(e) => setIncludeMedia(e.target.checked)}
                className="w-5 h-5 rounded border-white/20 bg-white/5 text-green-500 focus:ring-green-500/50"
              />
              <div>
                <span className="text-sm text-white">Include media assets</span>
                <p className="text-xs text-gray-500">
                  Extract and bundle images/videos from zone content
                </p>
              </div>
            </label>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center space-x-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-300">
              <Check className="w-4 h-4" />
              <span className="text-sm">Project downloaded! Open in Android Studio to build.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || !appName.trim() || !packageName.trim()}
            className="flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white transition-colors"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <FolderArchive className="w-4 h-4" />
                <span>Download Project</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AndroidExportModal;
