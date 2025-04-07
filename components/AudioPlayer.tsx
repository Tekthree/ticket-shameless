'use client';

import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import { Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

// Create a context to manage audio playback globally
type AudioContextType = {
  currentlyPlaying: string | null;
  setCurrentlyPlaying: (url: string | null) => void;
};

const AudioContext = createContext<AudioContextType>({
  currentlyPlaying: null,
  setCurrentlyPlaying: () => {}
});

// Audio Provider component to wrap around the app
export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  
  return (
    <AudioContext.Provider value={{ currentlyPlaying, setCurrentlyPlaying }}>
      {children}
    </AudioContext.Provider>
  );
}

// Helper function to get direct audio URL from various sources
function getAudioUrl(url: string): string {
  // Handle SoundCloud URLs
  if (url.includes('soundcloud.com')) {
    // For SoundCloud, we'd ideally use their API, but for now we'll just use the URL directly
    // In a production app, you would use the SoundCloud API to get the streaming URL
    return url;
  }
  
  // Handle Spotify URLs - would require Spotify API integration
  if (url.includes('spotify.com')) {
    // Spotify requires OAuth, so we can't directly play from Spotify URLs
    // In a production app, you would use the Spotify Web Playback SDK
    return url;
  }
  
  // For direct audio files and other sources, use the URL as is
  return url;
}

interface AudioPlayerProps {
  url: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  url, 
  className,
  size = 'md',
  position = 'bottom-right'
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Use the audio context to manage global playback
  const { currentlyPlaying, setCurrentlyPlaying } = useContext(AudioContext);
  
  // Check if this player is currently active
  const isActive = currentlyPlaying === url;
  
  // Create audio element on mount
  useEffect(() => {
    const audioUrl = getAudioUrl(url);
    audioRef.current = new Audio(audioUrl);
    audioRef.current.preload = 'metadata';
    
    // Clean up on unmount
    return () => {
      if (audioRef.current) {
        if (isActive) {
          setCurrentlyPlaying(null);
        }
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [url, isActive, setCurrentlyPlaying]);
  
  // Set up event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentlyPlaying(null);
    };
    
    const handlePlay = () => {
      setIsLoading(false);
      setError(null);
    };
    
    const handleError = (e: ErrorEvent) => {
      console.error('Audio playback error:', e);
      setError('Could not play audio');
      setIsPlaying(false);
      setIsLoading(false);
      setCurrentlyPlaying(null);
    };
    
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('error', handleError as EventListener);
    
    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('error', handleError as EventListener);
    };
  }, [setCurrentlyPlaying]);
  
  // Sync with global audio context
  useEffect(() => {
    if (isActive && !isPlaying) {
      setIsPlaying(true);
    } else if (!isActive && isPlaying) {
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [isActive, isPlaying]);
  
  // Handle play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isPlaying) {
      // Pause any other playing audio
      if (!isActive) {
        setCurrentlyPlaying(url);
      }
      
      setIsLoading(true);
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Error playing audio:', error);
          setIsPlaying(false);
          setIsLoading(false);
          setError('Could not play audio');
          setCurrentlyPlaying(null);
        });
      }
    } else {
      audio.pause();
      if (isActive) {
        setCurrentlyPlaying(null);
      }
    }
  }, [isPlaying, isActive, url, setCurrentlyPlaying]);
  
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  
  // Size classes
  const sizeClasses = {
    sm: {
      button: 'w-8 h-8',
      icon: 'w-4 h-4'
    },
    md: {
      button: 'w-10 h-10',
      icon: 'w-5 h-5'
    },
    lg: {
      button: 'w-12 h-12',
      icon: 'w-6 h-6'
    }
  };
  
  // Position classes
  const positionClasses = {
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2',
    'bottom-left': 'bottom-2 left-2',
    'bottom-right': 'bottom-2 right-2'
  };
  
  return (
    <button 
      onClick={togglePlayPause}
      disabled={isLoading || !!error}
      className={cn(
        'absolute flex items-center justify-center rounded-full bg-black bg-opacity-70 text-white hover:bg-opacity-90 transition-colors z-10',
        positionClasses[position],
        sizeClasses[size].button,
        (isLoading || error) && 'opacity-50 cursor-not-allowed',
        className
      )}
      aria-label={isPlaying ? 'Pause' : 'Play'}
      title={error || undefined}
    >
      {isPlaying ? (
        <Pause className={sizeClasses[size].icon} />
      ) : (
        <Play className={sizeClasses[size].icon} />
      )}
    </button>
  );
};

export default AudioPlayer;
