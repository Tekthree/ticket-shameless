'use client';

import { Facebook, Twitter, Linkedin, Share2, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface SocialShareButtonsProps {
  url: string;
  title: string;
  className?: string;
}

export default function SocialShareButtons({ url, title, className }: SocialShareButtonsProps) {
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  // Encode the URL and title for sharing
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  
  // Share URLs
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
  const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  
  // Function to copy the URL to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL: ', err);
    }
  };
  
  // Function to open share URLs in a popup window
  const openShareWindow = (shareUrl: string) => {
    window.open(
      shareUrl,
      'share-dialog',
      'width=600,height=600,location=yes,toolbar=no,menubar=no'
    );
  };
  
  // Toggle the share menu
  const toggleShareMenu = () => {
    setIsShareMenuOpen(!isShareMenuOpen);
  };
  
  return (
    <div className={cn("relative", className)}>
      <button 
        onClick={toggleShareMenu}
        className="flex items-center justify-center bg-gray-900 hover:bg-gray-800 text-white p-2 rounded-full transition-colors"
        aria-label="Share this event"
      >
        <Share2 className="w-5 h-5" />
      </button>
      
      {isShareMenuOpen && (
        <div className="absolute top-full right-0 mt-2 bg-gray-900 border border-gray-800 rounded-lg shadow-xl p-2 z-30 w-48 animate-in fade-in slide-in-from-top-5 duration-200">
          <div className="flex flex-col space-y-1">
            <button
              onClick={() => openShareWindow(facebookShareUrl)}
              className="flex items-center p-2 hover:bg-gray-800 rounded-md transition-colors"
            >
              <Facebook className="w-4 h-4 mr-2 text-blue-500" />
              <span className="text-sm">Facebook</span>
            </button>
            
            <button
              onClick={() => openShareWindow(twitterShareUrl)}
              className="flex items-center p-2 hover:bg-gray-800 rounded-md transition-colors"
            >
              <Twitter className="w-4 h-4 mr-2 text-sky-500" />
              <span className="text-sm">Twitter</span>
            </button>
            
            <button
              onClick={() => openShareWindow(linkedinShareUrl)}
              className="flex items-center p-2 hover:bg-gray-800 rounded-md transition-colors"
            >
              <Linkedin className="w-4 h-4 mr-2 text-blue-700" />
              <span className="text-sm">LinkedIn</span>
            </button>
            
            <hr className="border-gray-800 my-1" />
            
            <button
              onClick={copyToClipboard}
              className="flex items-center p-2 hover:bg-gray-800 rounded-md transition-colors"
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-green-500" />
                  <span className="text-sm">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="text-sm">Copy link</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
