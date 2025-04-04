'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

export default function Footer() {
  const [logoUrl, setLogoUrl] = useState('/images/logo.png'); // Default logo
  
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('site_content')
          .select('content')
          .eq('section', 'footer')
          .eq('field', 'logo')
          .single();
          
        if (data && !error) {
          setLogoUrl(data.content);
        }
      } catch (error) {
        console.error('Error fetching logo:', error);
      }
    };
    
    fetchLogo();
  }, []);

  return (
    <footer className="bg-black text-white" id="contact">
      <div className="container mx-auto px-4 py-16"> {/* Increased padding */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <Link href="/">
              <Image
                src={logoUrl}
                alt="Shameless Productions"
                width={250} /* Increased from 150 */
                height={75} /* Increased from 45 */
                className="h-20 w-auto object-contain mb-4" /* Increased from h-10 */
              />
            </Link>
            <p className="text-md text-gray-400 mt-4"> {/* Increased from text-sm */}
              Keeping it Weird Since 2003
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-4"> {/* Increased from text-lg */}
              Navigation
            </h3>
            <ul className="space-y-3"> {/* Increased from space-y-2 */}
              <li>
                <Link href="/" className="text-lg text-gray-400 hover:text-white transition"> {/* Increased from default text size */}
                  Home
                </Link>
              </li>
              <li>
                <Link href="/events" className="text-lg text-gray-400 hover:text-white transition">
                  Events
                </Link>
              </li>
              <li>
                <Link href="/#about" className="text-lg text-gray-400 hover:text-white transition">
                  About
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-4">
              Connect
            </h3>
            <ul className="space-y-3">
              <li>
                <a 
                  href="https://www.facebook.com/shamelessseattle" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-lg text-gray-400 hover:text-white transition"
                >
                  Facebook
                </a>
              </li>
              <li>
                <a 
                  href="https://www.instagram.com/shamelessseattle" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-lg text-gray-400 hover:text-white transition"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a 
                  href="mailto:info@shamelessproductions.com"
                  className="text-lg text-gray-400 hover:text-white transition"
                >
                  Email Us
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/privacy" className="text-lg text-gray-400 hover:text-white transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-lg text-gray-400 hover:text-white transition">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8 text-center">
          <p className="text-lg text-gray-400"> {/* Increased from default text size */}
            &copy; {new Date().getFullYear()} Shameless Productions. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
