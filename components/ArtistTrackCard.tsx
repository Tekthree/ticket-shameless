'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Play, Pause, X } from 'lucide-react';
import AudioPlayer from './AudioPlayer';

interface ArtistTrackCardProps {
  artist: {
    name: string;
    image?: string;
    mix_url: string;
  };
}

const ArtistTrackCard = ({ artist }: ArtistTrackCardProps) => {
  const [showEmbed, setShowEmbed] = useState(false);
  
  // Helper function to create embed URL for various platforms
  const getEmbedUrl = (url: string): string => {
    // Handle SoundCloud URLs
    if (url.includes('soundcloud.com')) {
      // Convert to embed URL
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=true&hide_related=false&show_comments=false&show_user=true&show_reposts=false&show_teaser=true`;
    }
    
    // Handle Mixcloud URLs
    if (url.includes('mixcloud.com')) {
      // Convert to embed URL
      return `https://www.mixcloud.com/widget/iframe/?hide_cover=1&mini=1&autoplay=1&feed=${encodeURIComponent(url.split('mixcloud.com')[1])}`;
    }
    
    // Return empty for unsupported platforms
    return '';
  };
  
  // Check if URL is embeddable
  const isEmbeddable = (url: string): boolean => {
    return url.includes('soundcloud.com') || url.includes('mixcloud.com');
  };
  
  const toggleEmbed = () => {
    setShowEmbed(!showEmbed);
  };
  
  return (
    <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg border border-gray-800 overflow-hidden">
      {/* Artist info and play button */}
      <div className="p-4 flex items-center">
        <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden flex-shrink-0 mr-3">
          {artist.image ? (
            <Image
              src={artist.image}
              alt={artist.name}
              width={40}
              height={40}
              className="object-cover w-full h-full"
              unoptimized
            />
          ) : (
            <Image
              src="/images/default-artist.png"
              alt={artist.name}
              width={40}
              height={40}
              className="object-cover w-full h-full"
              unoptimized
            />
          )}
        </div>
        <div className="flex-grow">
          <p className="font-bold">{artist.name}</p>
          <p className="text-sm text-gray-400">Listen to mix</p>
        </div>
        <button
          onClick={toggleEmbed}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-black bg-opacity-70 text-white hover:bg-opacity-90 transition-colors"
        >
          {showEmbed ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
      </div>
      
      {/* Embedded Player */}
      {showEmbed && isEmbeddable(artist.mix_url) && (
        <div className="w-full border-t border-gray-800 relative">
          <button
            onClick={toggleEmbed}
            className="absolute -top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black bg-opacity-70 text-white hover:bg-opacity-90 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
          <iframe 
            src={getEmbedUrl(artist.mix_url)}
            width="100%"
            height="180"
            frameBorder="0"
            allow="autoplay"
            className="w-full"
          ></iframe>
        </div>
      )}
    </div>
  );
};

export default ArtistTrackCard;
