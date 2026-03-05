import React, { useState } from 'react';
import { X, Download, FileArchive, FileCode, FileJson } from 'lucide-react';
import type { Prototype, ZoneId } from '../types';
import { exportSingleZone, exportMultiZone, exportAsJson } from '../utils/exportUtils';

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

  if (!isOpen || !prototype) return null;

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
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
