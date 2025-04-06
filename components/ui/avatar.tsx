'use client';

import React from 'react';

interface AvatarProps {
  className?: string;
  children: React.ReactNode;
}

export function Avatar({ className = '', children }: AvatarProps) {
  return (
    <div className={`relative w-10 h-10 rounded-full overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
}

export function AvatarImage({ src, alt, className = '', ...props }: AvatarImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={`w-full h-full object-cover ${className}`}
      {...props}
    />
  );
}

interface AvatarFallbackProps {
  className?: string;
  children: React.ReactNode;
}

export function AvatarFallback({ className = '', children }: AvatarFallbackProps) {
  return (
    <div className={`w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-lg font-medium ${className}`}>
      {children}
    </div>
  );
}
