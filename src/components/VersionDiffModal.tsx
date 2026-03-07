import React, { useState, useEffect } from 'react';
import { GitCompare, X, Plus, Minus, RefreshCw, ArrowLeftRight } from 'lucide-react';
import type { ZoneId } from '../types';
import { compareVersions, VersionDiff, formatVersionDate } from '../services/versionService';

interface VersionDiffModalProps {
  prototypeId: string;
  version1: number;
  version2: number;
  isOpen: boolean;
  onClose: () => void;
}

const VersionDiffModal: React.FC<VersionDiffModalProps> = ({
  prototypeId,
  version1,
  version2,
  isOpen,
  onClose,
}) => {
  const [diff, setDiff] = useState<VersionDiff | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<ZoneId | null>(null);
  const [swapped, setSwapped] = useState(false);

  const v1 = swapped ? version2 : version1;
  const v2 = swapped ? version1 : version2;

  useEffect(() => {
    if (isOpen && prototypeId) {
      loadDiff();
    }
  }, [isOpen, prototypeId, v1, v2]);

  const loadDiff = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await compareVersions(prototypeId, v1, v2);
      setDiff(data);
      // Auto-select first changed zone
      const firstChanged = Object.entries(data.changes).find(([_, change]) => change.changed);
      if (firstChanged) {
        setSelectedZone(firstChanged[0] as ZoneId);
      }
    } catch (err) {
      setError('Failed to load comparison');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getChangeIcon = (change: { changed: boolean; added: boolean; removed: boolean }) => {
    if (change.added) return <Plus className="w-3 h-3 text-green-400" />;
    if (change.removed) return <Minus className="w-3 h-3 text-red-400" />;
    if (change.changed) return <RefreshCw className="w-3 h-3 text-yellow-400" />;
    return null;
  };

  const getChangeColor = (change: { changed: boolean; added: boolean; removed: boolean }) => {
    if (change.added) return 'border-green-500/50 bg-green-500/10';
    if (change.removed) return 'border-red-500/50 bg-red-500/10';
    if (change.changed) return 'border-yellow-500/50 bg-yellow-500/10';
    return 'border-white/10 bg-white/5';
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <GitCompare className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Compare Versions</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Version headers */}
        <div className="flex border-b border-white/10">
          <div className="flex-1 p-3 bg-red-500/10 border-r border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-red-400 font-medium">Version {v1}</span>
                {diff && (
                  <p className="text-xs text-gray-500">{formatVersionDate(diff.version1.createdAt)}</p>
                )}
              </div>
              <button
                onClick={() => setSwapped(!swapped)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Swap versions"
              >
                <ArrowLeftRight className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
          <div className="flex-1 p-3 bg-green-500/10">
            <span className="text-green-400 font-medium">Version {v2}</span>
            {diff && (
              <p className="text-xs text-gray-500">{formatVersionDate(diff.version2.createdAt)}</p>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
              Loading comparison...
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-red-400">
              <p>{error}</p>
              <button
                onClick={loadDiff}
                className="mt-2 text-sm text-blue-400 hover:text-blue-300"
              >
                Try again
              </button>
            </div>
          </div>
        ) : diff ? (
          <div className="flex-1 flex overflow-hidden">
            {/* Zone selector sidebar */}
            <div className="w-48 border-r border-white/10 p-3 space-y-2 overflow-y-auto">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Zones</p>

              {/* Summary */}
              <div className="bg-white/5 rounded-lg p-2 mb-3">
                <div className="grid grid-cols-3 gap-1 text-xs">
                  <div className="text-center">
                    <p className="text-yellow-400 font-medium">{diff.summary.zonesChanged}</p>
                    <p className="text-gray-500">Changed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-green-400 font-medium">{diff.summary.zonesAdded}</p>
                    <p className="text-gray-500">Added</p>
                  </div>
                  <div className="text-center">
                    <p className="text-red-400 font-medium">{diff.summary.zonesRemoved}</p>
                    <p className="text-gray-500">Removed</p>
                  </div>
                </div>
              </div>

              {(['A', 'B', 'C', 'D', 'E', 'F'] as ZoneId[]).map(zone => {
                const change = diff.changes[zone];
                const isSelected = selectedZone === zone;

                return (
                  <button
                    key={zone}
                    onClick={() => setSelectedZone(zone)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg border transition-colors ${
                      isSelected ? 'border-blue-500 bg-blue-500/20' : getChangeColor(change)
                    }`}
                  >
                    <span className={`font-medium ${isSelected ? 'text-blue-300' : 'text-white'}`}>
                      Zone {zone}
                    </span>
                    {getChangeIcon(change)}
                  </button>
                );
              })}
            </div>

            {/* Diff content */}
            <div className="flex-1 flex overflow-hidden">
              {selectedZone ? (
                <>
                  {/* Version 1 content */}
                  <div className="flex-1 border-r border-white/10 flex flex-col overflow-hidden">
                    <div className="p-2 bg-red-500/10 border-b border-white/10">
                      <span className="text-xs text-red-400">
                        Zone {selectedZone} in v{v1}
                      </span>
                    </div>
                    <div className="flex-1 overflow-auto p-2">
                      <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono bg-black/30 p-2 rounded min-h-full">
                        {diff.version1.zoneContent[selectedZone] || '(empty)'}
                      </pre>
                    </div>
                  </div>

                  {/* Version 2 content */}
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="p-2 bg-green-500/10 border-b border-white/10">
                      <span className="text-xs text-green-400">
                        Zone {selectedZone} in v{v2}
                      </span>
                    </div>
                    <div className="flex-1 overflow-auto p-2">
                      <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono bg-black/30 p-2 rounded min-h-full">
                        {diff.version2.zoneContent[selectedZone] || '(empty)'}
                      </pre>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  Select a zone to view differences
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <div className="p-3 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default VersionDiffModal;
