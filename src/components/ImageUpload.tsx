import React, { useRef, useState } from 'react';
import { Image as ImageIcon, X, Loader2, Star } from 'lucide-react';
import { Button } from './ui/button';
import { useTranslation } from 'react-i18next';

interface ImageUploadProps {
  images: string[];
  mainImageIndex?: number;
  onUpload: (file: File) => Promise<void>;
  onRemove: (url: string) => void;
  onSetMainImage: (index: number) => void;
  uploading: boolean;
}

export function ImageUpload({
  images,
  mainImageIndex = 0,
  onUpload,
  onRemove,
  onSetMainImage,
  uploading
}: ImageUploadProps) {
  const { t } = useTranslation();
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
            <div className="absolute top-2 right-2 flex gap-2">
              <button
                type="button"
                onClick={() => onRemove(url)}
                className="p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onSetMainImage(index)}
                className={`p-1.5 rounded-full transition-colors ${index === mainImageIndex
                    ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                    : 'bg-black/50 text-white hover:bg-black/70'
                  }`}
                title={index === mainImageIndex ? t('propertyForm.images.mainPhoto') : t('propertyForm.images.setAsMain')}
              >
                <Star className="w-4 h-4" fill={index === mainImageIndex ? "currentColor" : "none"} />
              </button>
            </div>
            {index === mainImageIndex && (
              <div className="absolute bottom-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                {t('propertyForm.images.mainPhoto')}
              </div>
            )}
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
                <span className="sr-only">{t('propertyForm.images.upload')}</span>
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
          {t('propertyForm.images.noImages')}
        </div>
      )}
    </div>
  );
}