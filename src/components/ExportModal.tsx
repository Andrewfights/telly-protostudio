import React, { useState } from 'react';
import { X, Download, FileArchive, FileCode, FileJson, Smartphone, Tv, ExternalLink } from 'lucide-react';
import type { Prototype, ZoneId } from '../types';
import { exportSingleZone, exportMultiZone, exportAsJson } from '../utils/exportUtils';
import { downloadTellyBundle } from '../utils/bundleExportUtils';
import AndroidExportModal from './AndroidExportModal';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  prototype: Prototype | null;
  selectedZone: ZoneId;
}

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  prototype,
  selectedZone,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingBundle, setIsExportingBundle] = useState(false);
  const [showAndroidExport, setShowAndroidExport] = useState(false);

  if (!isOpen || !prototype) return null;

  const handleExportTellyBundle = async () => {
    setIsExportingBundle(true);
    try {
      await downloadTellyBundle(prototype);
      onClose();
    } finally {
      setIsExportingBundle(false);
    }
  };

  const handleExportSingleZone = () => {
    exportSingleZone(prototype.zoneContent[selectedZone], selectedZone, prototype.name);
    onClose();
  };

  const handleExportZip = async () => {
    setIsExporting(true);
    try {
      await exportMultiZone(prototype);
      onClose();
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJson = () => {
    exportAsJson(prototype);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative bg-[#1a1a1a] rounded-xl border border-white/10 w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Export Prototype</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleExportSingleZone}
            className="w-full flex items-center space-x-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
          >
            <div className="p-3 rounded-lg bg-blue-500/20">
              <FileCode className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="font-medium text-white">Single Zone HTML</div>
              <div className="text-sm text-gray-400">Download Zone {selectedZone} as HTML file</div>
            </div>
          </button>

          <button
            onClick={handleExportZip}
            disabled={isExporting}
            className="w-full flex items-center space-x-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left disabled:opacity-50"
          >
            <div className="p-3 rounded-lg bg-green-500/20">
              <FileArchive className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <div className="font-medium text-white">
                {isExporting ? 'Creating ZIP...' : 'Full Project ZIP'}
              </div>
              <div className="text-sm text-gray-400">All zones + combined index.html + README</div>
            </div>
          </button>

          <button
            onClick={handleExportJson}
            className="w-full flex items-center space-x-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
          >
            <div className="p-3 rounded-lg bg-purple-500/20">
              <FileJson className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="font-medium text-white">Shareable JSON</div>
              <div className="text-sm text-gray-400">Export as .telly.json for sharing/import</div>
            </div>
          </button>

          {/* Telly Device Export Section */}
          <div className="pt-3 border-t border-white/10">
            <div className="flex items-center space-x-2 mb-3">
              <Tv className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-gray-300">Export for Telly</span>
            </div>

            {/* Telly Bundle - Primary Export */}
            <button
              onClick={handleExportTellyBundle}
              disabled={isExportingBundle}
              className="w-full flex items-center space-x-4 p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-indigo-500/10 hover:from-purple-500/20 hover:to-indigo-500/20 border border-purple-500/30 transition-colors text-left disabled:opacity-50 mb-3"
            >
              <div className="p-3 rounded-lg bg-purple-500/20">
                <Download className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-white">
                    {isExportingBundle ? 'Creating Bundle...' : 'Telly Bundle (.telly)'}
                  </span>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-purple-500/30 text-purple-300">Recommended</span>
                </div>
                <div className="text-sm text-gray-400">Ready to sideload - open in Telly Viewer app</div>
              </div>
            </button>

            {/* Link to download Viewer APK */}
            <a
              href="https://github.com/your-repo/telly-protostudio/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center space-x-4 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left mb-3"
            >
              <div className="p-2 rounded-lg bg-green-500/20">
                <Smartphone className="w-4 h-4 text-green-400" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-white text-sm">Download Telly Viewer APK</div>
                <div className="text-xs text-gray-500">One-time install to view .telly files</div>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-500" />
            </a>

            {/* Android Studio Project - Advanced */}
            <button
              onClick={() => setShowAndroidExport(true)}
              className="w-full flex items-center space-x-4 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
            >
              <div className="p-2 rounded-lg bg-gray-500/20">
                <FileCode className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <div className="font-medium text-white text-sm">Android Studio Project</div>
                <div className="text-xs text-gray-500">For developers - requires building</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Android Export Modal */}
      <AndroidExportModal
        isOpen={showAndroidExport}
        onClose={() => setShowAndroidExport(false)}
        prototype={prototype}
      />
    </div>
  );
};

export default ExportModal;
