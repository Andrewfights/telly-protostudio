import React, { useState, useEffect } from 'react';
import { History, RotateCcw, Eye, GitCompare, Clock, ChevronDown, ChevronUp, X } from 'lucide-react';
import type { PrototypeVersion, Prototype } from '../types';
import { listVersions, rollbackToVersion, getRelativeTime, formatVersionDate } from '../services/versionService';

interface VersionHistoryPanelProps {
  prototype: Prototype;
  isOpen: boolean;
  onClose: () => void;
  onPreviewVersion: (version: PrototypeVersion) => void;
  onRollback: (prototype: Prototype) => void;
  onCompare: (v1: number, v2: number) => void;
}

const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({
  prototype,
  isOpen,
  onClose,
  onPreviewVersion,
  onRollback,
  onCompare,
}) => {
  const [versions, setVersions] = useState<PrototypeVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null);
  const [selectedForCompare, setSelectedForCompare] = useState<number | null>(null);
  const [rollingBack, setRollingBack] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && prototype.id) {
      loadVersions();
    }
  }, [isOpen, prototype.id]);

  const loadVersions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listVersions(prototype.id);
      setVersions(data);
    } catch (err) {
      setError('Failed to load version history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async (versionNumber: number) => {
    if (!confirm(`Are you sure you want to rollback to version ${versionNumber}? This will replace the current prototype content.`)) {
      return;
    }

    setRollingBack(versionNumber);
    try {
      const result = await rollbackToVersion(prototype.id, versionNumber);
      onRollback(result.prototype);
      // Reload versions to show updated state
      await loadVersions();
    } catch (err) {
      setError('Failed to rollback');
      console.error(err);
    } finally {
      setRollingBack(null);
    }
  };

  const handleCompareClick = (versionNumber: number) => {
    if (selectedForCompare === null) {
      setSelectedForCompare(versionNumber);
    } else if (selectedForCompare === versionNumber) {
      setSelectedForCompare(null);
    } else {
      onCompare(selectedForCompare, versionNumber);
      setSelectedForCompare(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Version History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Prototype info */}
        <div className="px-4 py-3 bg-white/5 border-b border-white/10">
          <p className="text-white font-medium">{prototype.name}</p>
          <p className="text-sm text-gray-400">
            {prototype.totalVersions || 1} version{(prototype.totalVersions || 1) !== 1 ? 's' : ''} &middot;
            Current: v{prototype.currentVersion || 1}
          </p>
        </div>

        {/* Compare mode indicator */}
        {selectedForCompare !== null && (
          <div className="px-4 py-2 bg-blue-500/20 border-b border-blue-500/30 flex items-center justify-between">
            <p className="text-sm text-blue-300">
              Select another version to compare with v{selectedForCompare}
            </p>
            <button
              onClick={() => setSelectedForCompare(null)}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Version list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="text-center py-8 text-gray-400">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
              Loading versions...
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-400">
              <p>{error}</p>
              <button
                onClick={loadVersions}
                className="mt-2 text-sm text-blue-400 hover:text-blue-300"
              >
                Try again
              </button>
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No version history available</p>
              <p className="text-sm mt-1">Save your prototype to create the first version</p>
            </div>
          ) : (
            versions.map((version, index) => {
              const isLatest = index === 0;
              const isCurrent = version.versionNumber === prototype.currentVersion;
              const isExpanded = expandedVersion === version.versionNumber;
              const isSelectedForCompare = selectedForCompare === version.versionNumber;

              return (
                <div
                  key={version.id}
                  className={`rounded-lg border transition-colors ${
                    isSelectedForCompare
                      ? 'border-blue-500 bg-blue-500/10'
                      : isCurrent
                      ? 'border-green-500/50 bg-green-500/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {/* Version header */}
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer"
                    onClick={() => setExpandedVersion(isExpanded ? null : version.versionNumber)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        isCurrent ? 'bg-green-500 text-white' : 'bg-white/20 text-gray-300'
                      }`}>
                        v{version.versionNumber}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-medium">{version.name}</span>
                          {isLatest && (
                            <span className="text-xs bg-blue-500/30 text-blue-300 px-1.5 py-0.5 rounded">
                              Latest
                            </span>
                          )}
                          {isCurrent && (
                            <span className="text-xs bg-green-500/30 text-green-300 px-1.5 py-0.5 rounded">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span title={formatVersionDate(version.createdAt)}>
                            {getRelativeTime(version.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="px-3 pb-3 border-t border-white/10 pt-3">
                      {version.commitMessage && (
                        <p className="text-sm text-gray-300 mb-3 bg-black/20 p-2 rounded">
                          "{version.commitMessage}"
                        </p>
                      )}

                      {/* Zone preview */}
                      <div className="grid grid-cols-6 gap-1 mb-3">
                        {(['A', 'B', 'C', 'D', 'E', 'F'] as const).map(zone => {
                          const hasContent = !!version.zoneContent[zone];
                          return (
                            <div
                              key={zone}
                              className={`h-6 rounded flex items-center justify-center text-xs ${
                                hasContent ? 'bg-blue-500/30 text-blue-300' : 'bg-white/10 text-gray-600'
                              }`}
                              title={`Zone ${zone}: ${hasContent ? 'Has content' : 'Empty'}`}
                            >
                              {zone}
                            </div>
                          );
                        })}
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPreviewVersion(version);
                          }}
                          className="flex-1 flex items-center justify-center space-x-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Preview</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCompareClick(version.versionNumber);
                          }}
                          className={`flex-1 flex items-center justify-center space-x-1 py-2 rounded-lg text-sm transition-colors ${
                            isSelectedForCompare
                              ? 'bg-blue-500 text-white'
                              : 'bg-white/10 hover:bg-white/20 text-white'
                          }`}
                        >
                          <GitCompare className="w-4 h-4" />
                          <span>Compare</span>
                        </button>

                        {!isCurrent && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRollback(version.versionNumber);
                            }}
                            disabled={rollingBack === version.versionNumber}
                            className="flex-1 flex items-center justify-center space-x-1 py-2 bg-orange-500/20 hover:bg-orange-500/30 rounded-lg text-sm text-orange-300 transition-colors disabled:opacity-50"
                          >
                            <RotateCcw className={`w-4 h-4 ${rollingBack === version.versionNumber ? 'animate-spin' : ''}`} />
                            <span>{rollingBack === version.versionNumber ? 'Rolling...' : 'Restore'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 text-center">
          <p className="text-xs text-gray-500">
            Versions are created when you save with "Create new version" enabled
          </p>
        </div>
      </div>
    </div>
  );
};

export default VersionHistoryPanel;
