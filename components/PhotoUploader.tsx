'use client';

import { useCallback, useRef, useState } from 'react';

interface PhotoUploaderProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
}

const MAX_PHOTOS = 10;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function PhotoUploader({ photos, onPhotosChange }: PhotoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
      const remaining = MAX_PHOTOS - photos.length;
      const toProcess = imageFiles.slice(0, remaining);
      if (!toProcess.length) return;
      const dataUrls = await Promise.all(toProcess.map(fileToDataUrl));
      onPhotosChange([...photos, ...dataUrls]);
    },
    [photos, onPhotosChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  const removePhoto = (index: number) => {
    onPhotosChange(photos.filter((_, i) => i !== index));
  };

  const movePhoto = (from: number, to: number) => {
    const next = [...photos];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onPhotosChange(next);
  };

  const full = photos.length >= MAX_PHOTOS;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Photos</h2>
        <span className="text-xs text-gray-400 tabular-nums">{photos.length}/{MAX_PHOTOS}</span>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => !full && inputRef.current?.click()}
        className={`flex items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-4 transition-colors ${
          isDragging
            ? 'border-gray-500 bg-gray-50'
            : full
            ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
            : 'border-gray-300 bg-white hover:border-gray-500 cursor-pointer'
        }`}
      >
        <svg className="w-6 h-6 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <div>
          <p className="text-sm font-medium text-gray-600">
            {full ? 'Maximum atteint' : 'Glissez vos photos ici'}
          </p>
          {!full && (
            <p className="text-xs text-gray-400">ou cliquez · JPG, PNG, WebP</p>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => { if (e.target.files) { addFiles(e.target.files); e.target.value = ''; } }}
          disabled={full}
        />
      </div>

      {/* Thumbnails */}
      {photos.length > 0 && (
        <div className="grid grid-cols-5 gap-1.5">
          {photos.map((src, i) => (
            <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-transparent group-hover:bg-fuchsia-900/50 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                {i > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); movePhoto(i, i - 1); }}
                    className="w-5 h-5 bg-white rounded text-gray-800 flex items-center justify-center text-[10px] font-bold hover:bg-gray-100"
                  >←</button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); removePhoto(i); }}
                  className="w-5 h-5 bg-white rounded text-gray-800 flex items-center justify-center hover:bg-gray-100"
                >
                  <svg className="w-3 h-3" viewBox="0 0 12 12" stroke="currentColor" fill="none">
                    <path d="M9 3L3 9M3 3l6 6" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
                {i < photos.length - 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); movePhoto(i, i + 1); }}
                    className="w-5 h-5 bg-white rounded text-gray-800 flex items-center justify-center text-[10px] font-bold hover:bg-gray-100"
                  >→</button>
                )}
              </div>
              <span className="absolute top-1 left-1 bg-violet-600/80 text-white text-[9px] font-bold rounded px-1 leading-4">
                {i + 1}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
