import React, { useRef, useState } from 'react';
import { Upload, X, Image, Video, Music, AlertCircle } from 'lucide-react';
import { uploadFile } from '../services/mediaService';
import type { MediaItem } from '../types';

interface MediaUploaderProps {
  onUpload: (item: MediaItem) => void;
  onClose?: () => void;
  acceptedTypes?: string; // e.g., "image/*,video/*,audio/*"
}

const MediaUploader: React.FC<MediaUploaderProps> = ({
  onUpload,
  onClose,
  acceptedTypes = "image/*,video/*,audio/*",
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    const totalFiles = files.length;
    let completed = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isAudio = file.type.startsWith('audio/');

      if (!isImage && !isVideo && !isAudio) {
        setError(`Unsupported file type: ${file.name}`);
        continue;
      }

      // Check file size (max 30MB for videos, 10MB for images/audio)
      const isVideo = file.type.startsWith('video/');
      const maxSize = isVideo ? 30 * 1024 * 1024 : 10 * 1024 * 1024; // 30MB for video, 10MB otherwise
      if (file.size > maxSize) {
        setError(`File too large (max ${isVideo ? '30MB' : '10MB'}): ${file.name}`);
        continue;
      }

      try {
        const mediaItem = await uploadFile(file);
        onUpload(mediaItem);
        completed++;
        setUploadProgress((completed / totalFiles) * 100);
      } catch (err) {
        if (err instanceof Error && err.message.includes('quota')) {
          setError('Storage full. Please delete some items.');
        } else {
          setError(`Failed to upload: ${file.name}`);
        }
      }
    }

    setIsUploading(false);
    setUploadProgress(0);

    // Close after successful upload if only one file
    if (completed === totalFiles && onClose) {
      onClose();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  return (
    <div className="p-4">
      <input
        ref={inputRef}
        type="file"
        accept={acceptedTypes}
        multiple
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Drop Zone */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200
          ${isDragging
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
          }
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        {isUploading ? (
          <div className="space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
            <p className="text-white">Uploading...</p>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-center space-x-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Image className="w-6 h-6 text-blue-400" />
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Video className="w-6 h-6 text-purple-400" />
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Music className="w-6 h-6 text-green-400" />
              </div>
            </div>

            <Upload className="w-8 h-8 mx-auto mb-3 text-gray-400" />

            <p className="text-white font-medium mb-1">
              Drop files here or click to upload
            </p>
            <p className="text-sm text-gray-500">
              Supports images, videos (max 30MB), and audio
            </p>
          </>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto p-1 hover:bg-white/10 rounded"
          >
            <X className="w-4 h-4 text-red-400" />
          </button>
        </div>
      )}

      {/* File type hints */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-gray-500">
        <div className="flex items-center space-x-1">
          <Image className="w-3 h-3" />
          <span>PNG, JPG, GIF, WebP</span>
        </div>
        <div className="flex items-center space-x-1">
          <Video className="w-3 h-3" />
          <span>MP4, WebM, MOV</span>
        </div>
        <div className="flex items-center space-x-1">
          <Music className="w-3 h-3" />
          <span>MP3, WAV, OGG</span>
        </div>
      </div>
    </div>
  );
};

export default MediaUploader;
