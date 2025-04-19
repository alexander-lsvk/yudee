import React, { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import Avatar from './Avatar';

interface AvatarUploadProps {
  name: string;
  imageUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  onUpload: (file: File) => Promise<void>;
}

export function AvatarUpload({ name, imageUrl, size = 'lg', onUpload }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError(null);
      setUploading(true);
      
      const file = event.target.files?.[0];
      if (!file) return;

      // Basic validation
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file');
      }

      const MAX_SIZE = 5 * 1024 * 1024; // 5MB
      if (file.size > MAX_SIZE) {
        throw new Error('Image must be less than 5MB');
      }

      await onUpload(file);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  return (
    <div className="relative group">
      <Avatar 
        name={name} 
        imageUrl={imageUrl} 
        size={size}
        loading={uploading}
      />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
        {uploading ? (
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-white hover:text-white hover:bg-transparent"
            onClick={() => inputRef.current?.click()}
          >
            <Camera className="w-5 h-5" />
            <span className="sr-only">Upload avatar</span>
          </Button>
        )}
      </div>
      {error && (
        <div className="absolute -bottom-6 left-0 right-0 text-center">
          <span className="text-xs text-red-500">{error}</span>
        </div>
      )}
    </div>
  );
}