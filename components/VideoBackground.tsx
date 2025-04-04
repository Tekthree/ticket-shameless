'use client';

import React, { useRef, useEffect } from 'react';

interface VideoBackgroundProps {
  url: string;
}

const VideoBackground: React.FC<VideoBackgroundProps> = ({ url }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playsInline = true;
      videoRef.current.muted = true;
      videoRef.current.loop = true;
      videoRef.current.autoplay = true;
      
      // Force play (needed for some browsers)
      videoRef.current.play().catch(error => {
        console.error('Error playing video:', error);
      });
    }
  }, []);

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 w-full h-full object-cover opacity-70"
      muted
      loop
      playsInline
      autoPlay
    >
      <source src={url} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
};

export default VideoBackground;
