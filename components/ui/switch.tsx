'use client';

import React from 'react';

interface SwitchProps {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

export function Switch({ id, checked, onCheckedChange, className = '' }: SwitchProps) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      className={`relative inline-flex h-6 w-11 items-center rounded-full 
                  ${checked ? 'bg-blue-600' : 'bg-gray-200'} 
                  transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`}
      onClick={() => onCheckedChange(!checked)}
    >
      <span
        className={`${
          checked ? 'translate-x-6' : 'translate-x-1'
        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
      />
    </button>
  );
}
