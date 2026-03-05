import React, { useState, useRef } from 'react';
import { X, Upload, FileJson, AlertCircle } from 'lucide-react';
import { parseImportedJson, type ImportedPrototype } from '../utils/exportUtils';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: ImportedPrototype) => Promise<void>;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<ImportedPrototype | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    setError('');
    setPreview(null);

    if (!file.name.endsWith('.json') && !file.name.endsWith('.telly.json')) {
      setError('Please select a .json or .telly.json file');
      return;
    }

    try {
      const text = await file.text();
      const parsed = parseImportedJson(text);
      setPreview(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleImport = async () => {
    if (!preview) return;

    setIsImporting(true);
    setError('');

    try {
      await onImport(preview);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import prototype');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative bg-[#1a1a1a] rounded-xl border border-white/10 w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Import Prototype</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!preview ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-white/20 hover:border-white/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.telly.json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="p-4 rounded-full bg-white/5 w-fit mx-auto mb-4">
              <Upload className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-white font-medium mb-1">Drop your .telly.json file here</p>
            <p className="text-sm text-gray-400">or click to browse</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <FileJson className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <div className="font-medium text-white">{preview.name}</div>
                  <div className="text-xs text-gray-400">
                    {preview.description || 'No description'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2 mt-4">
                {(['A', 'B', 'C', 'D', 'E'] as const).map((zone) => (
                  <div
                    key={zone}
                    className={`h-8 rounded flex items-center justify-center text-xs font-medium ${
                      preview.zoneContent[zone]
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-white/5 text-gray-500'
                    }`}
                  >
                    {zone}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Green zones have content
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setPreview(null)}
                className="flex-1 px-4 py-3 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 transition-colors"
              >
                Choose Different File
              </button>
              <button
                onClick={handleImport}
                disabled={isImporting}
                className="flex-1 px-4 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
              >
                {isImporting ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center space-x-2 mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportModal;
