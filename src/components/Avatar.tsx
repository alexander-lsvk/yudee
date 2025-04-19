import React from 'react';
import { Loader2 } from 'lucide-react';

interface AvatarProps {
  name: string;
  imageUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({ name, imageUrl, size = 'md', loading = false }) => {
  const sizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-16 h-16 text-xl',
  };

  // Get the first letter of each word and join them
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Generate a consistent color based on the name
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-teal-500'
  ];
  
  const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  const bgColor = colors[colorIndex];

  if (loading) {
    return (
      <div 
        className={`${sizes[size]} rounded-full overflow-hidden bg-gray-200 flex items-center justify-center`}
        title={name}
      >
        <Loader2 className="w-1/2 h-1/2 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (imageUrl) {
    return (
      <div 
        className={`${sizes[size]} rounded-full overflow-hidden bg-gray-200`}
        title={name}
      >
        <img 
          src={imageUrl} 
          alt={name}
          className="w-full h-full object-cover"
          loading="lazy" // Enable lazy loading
          decoding="async" // Enable async decoding
          onError={(e) => {
            // Fallback to initials on error
            e.currentTarget.style.display = 'none';
            e.currentTarget.parentElement?.classList.add(bgColor);
            e.currentTarget.parentElement?.setAttribute('data-initials', initials);
            e.currentTarget.parentElement?.setAttribute('data-content', initials);
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizes[size]} ${bgColor} rounded-full flex items-center justify-center text-white font-semibold`}
      title={name}
    >
      {initials}
    </div>
  );
};

export default Avatar;