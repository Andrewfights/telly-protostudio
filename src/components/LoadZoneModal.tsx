import React, { useState, useEffect } from 'react';
import { X, Search, Download, Trash2, RefreshCw } from 'lucide-react';
import type { ZoneId, ZoneTemplate } from '../types';
import { getZoneTemplatesForZone, deleteZoneTemplate } from '../services/apiService';

interface LoadZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (content: string) => void;
  zoneId: ZoneId;
}

const ZONE_DESCRIPTIONS: Record<ZoneId, string> = {
  A: 'Main Screen (1920x1080)',
  B: 'Full Bottom Screen (1920x360)',
  C: 'Bottom Left Widget (1280x300)',
  D: 'Bottom Right Ad Block (640x300)',
  E: 'News Ticker (1920x60)',
  F: 'Combined C+D Area (1920x300)',
};

const LoadZoneModal: React.FC<LoadZoneModalProps> = ({
  isOpen,
  onClose,
  onLoad,
  zoneId,
}) => {
  const [templates, setTemplates] = useState<ZoneTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<ZoneTemplate | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen, zoneId]);

  const loadTemplates = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await getZoneTemplatesForZone(zoneId);
      setTemplates(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (template: ZoneTemplate) => {
    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) return;

    try {
      await deleteZoneTemplate(template.id);
      setTemplates(prev => prev.filter(t => t.id !== template.id));
      if (selectedTemplate?.id === template.id) {
        setSelectedTemplate(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template');
    }
  };

  const handleLoad = () => {
    if (selectedTemplate) {
      onLoad(selectedTemplate.content);
      onClose();
    }
  };

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1a1a1a] rounded-xl border border-white/10 w-full max-w-2xl mx-4 shadow-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-lg font-semibold text-white">Load Zone Template</h2>
            <p className="text-sm text-gray-400 mt-1">Zone {zoneId}: {ZONE_DESCRIPTIONS[zoneId]}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-2">
                {templates.length === 0
                  ? 'No templates saved for this zone yet'
                  : 'No templates match your search'}
              </div>
              {templates.length === 0 && (
                <p className="text-sm text-gray-600">
                  Save zone content as a template to reuse it later
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedTemplate?.id === template.id
                      ? 'bg-blue-500/10 border-blue-500/30'
                      : 'bg-[#0a0a0a] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate">{template.name}</h3>
                      {template.description && (
                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                          {template.description}
                        </p>
                      )}
                      <div className="text-xs text-gray-500 mt-2">
                        Created {formatDate(template.createdAt)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(template);
                      }}
                      className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {selectedTemplate?.id === template.id && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <label className="block text-xs text-gray-500 mb-2">Preview</label>
                      <pre className="text-xs text-gray-400 bg-black/30 rounded p-2 max-h-24 overflow-auto whitespace-pre-wrap break-all">
                        {template.content.substring(0, 300)}
                        {template.content.length > 300 && '...'}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex justify-between items-center gap-3 px-6 py-4 border-t border-white/10">
          <button
            onClick={loadTemplates}
            disabled={isLoading}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleLoad}
              disabled={!selectedTemplate}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span>Load Template</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadZoneModal;
