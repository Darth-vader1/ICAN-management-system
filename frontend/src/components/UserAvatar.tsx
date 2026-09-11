import React, { useState, useEffect } from 'react';
import { getMediaUrl } from '../lib/api';

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses: Record<string, string> = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-9 h-9 text-xs',
  lg: 'w-12 h-12 text-base',
  xl: 'w-20 h-20 sm:w-24 sm:h-24 text-2xl sm:text-3xl',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name,
  email,
  size = 'md',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);
  const mediaUrl = getMediaUrl(src);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const displayName = (name || email || 'User').trim();
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'U';

  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const dimensionClass = sizeClass.replace(/text-\S+/g, '').trim();

  if (mediaUrl && !hasError) {
    return (
      <img
        src={mediaUrl}
        alt={displayName}
        onError={() => setHasError(true)}
        className={`${dimensionClass} rounded-full object-cover border border-slate-200/80 flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-slate-800 text-white font-bold flex items-center justify-center flex-shrink-0 shadow-xs ${className}`}
    >
      {initials}
    </div>
  );
};

export default UserAvatar;
