import React, { useRef, useState } from 'react';
import { Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

interface ImageUploadProps {
  images: string[];
  onUpload: (file: File) => Promise<void>;
  onRemove: (url: string) => void;
  uploading: boolean;
}

export function ImageUpload({ images, onUpload, onRemove, uploading }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = event.target.files;
    if (!files) return;

    try {
      // Convert FileList to array and process each file
      const fileArray = Array.from(files);
      
      // Validate each file before uploading
      for (const file of fileArray) {
        // Check file type
        if (!file.type.startsWith('image/')) {
          throw new Error('Please upload image files only');
        }

        // Check file size (5MB limit)
        const MAX_SIZE = 5 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
          throw new Error('Image must be less than 5MB');
        }

        // Upload the file
        await onUpload(file);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      // Clear the input
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {/* Image Grid */}
        {images.map((url, index) => (
          <div 
            key={url} 
            className="relative aspect-square group bg-gray-100 rounded-lg overflow-hidden"
          >
            <img 
              src={url}
              alt={`Property image ${index + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800';
              }}
            />
            <button
              type="button"
              onClick={() => onRemove(url)}
              className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {/* Upload Button */}
        <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
          <Button
            type="button"
            variant="ghost"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="relative w-full h-full rounded-lg hover:bg-gray-200 transition-colors"
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
            ) : (
              <>
                <ImageIcon className="w-6 h-6 text-gray-600" />
                <span className="sr-only">Upload images</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-500">
          {error}
        </div>
      )}

      {images.length === 0 && !uploading && !error && (
        <div className="text-center text-sm text-gray-500">
          No images uploaded yet
        </div>
      )}
    </div>
  );
}