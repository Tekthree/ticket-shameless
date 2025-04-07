'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Icons } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

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

  const currentYear = new Date().getFullYear();

  return (
    <footer className='bg-black text-white' id='contact'>
      <div className='container mx-auto px-4 py-16'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-8'>
          <div className='col-span-1 md:col-span-1'>
            <Link href='/'>
              <Image
                src={logoUrl}
                alt='Shameless Productions'
                width={250}
                height={75}
                className='h-20 w-auto object-contain mb-4'
              />
            </Link>
            <p className='text-md text-muted-foreground mt-4'>
              Keeping it Weird Since 2003
            </p>
          </div>

          <div>
            <h3 className='text-xl font-semibold mb-4'>Navigation</h3>
            <ul className='space-y-3'>
              <li>
                <FooterLink href='/'>
                  <Icons.home className='mr-2 h-4 w-4' />
                  Home
                </FooterLink>
              </li>
              <li>
                <FooterLink href='/events'>
                  <Icons.calendar className='mr-2 h-4 w-4' />
                  Events
                </FooterLink>
              </li>
              <li>
                <FooterLink href='/#about'>
                  <Icons.info className='mr-2 h-4 w-4' />
                  About
                </FooterLink>
              </li>
            </ul>
          </div>

          <div>
            <h3 className='text-xl font-semibold mb-4'>Contact & Connect</h3>
            <ul className='space-y-3'>
              <li>
                <FooterLink
                  href='https://www.facebook.com/shamelessseattle'
                  external={true}>
                  <FacebookIcon className='mr-2 h-4 w-4' />
                  Facebook
                </FooterLink>
              </li>
              <li>
                <FooterLink
                  href='https://www.instagram.com/shamelessseattle'
                  external={true}>
                  <InstagramIcon className='mr-2 h-4 w-4' />
                  Instagram
                </FooterLink>
              </li>
              <li>
                <FooterLink href='mailto:info@shamelessproductions.com'>
                  <Icons.mail className='mr-2 h-4 w-4' />
                  Contact Us
                </FooterLink>
              </li>
            </ul>
          </div>

          <div>
            <h3 className='text-xl font-semibold mb-4'>Legal</h3>
            <ul className='space-y-3'>
              <li>
                <FooterLink href='/privacy'>
                  <Icons.shield className='mr-2 h-4 w-4' />
                  Privacy Policy
                </FooterLink>
              </li>
              <li>
                <FooterLink href='/terms'>
                  <Icons.fileText className='mr-2 h-4 w-4' />
                  Terms of Service
                </FooterLink>
              </li>
            </ul>
          </div>
        </div>

        <Separator className='my-8 bg-gray-800' />

        <div className='text-center'>
          <p className='text-lg text-muted-foreground'>
            &copy; {currentYear} Shameless Productions. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children, external = false }) {
  if (external) {
    return (
      <a
        href={href}
        target='_blank'
        rel='noopener noreferrer'
        className='text-lg text-muted-foreground hover:text-white transition flex items-center'>
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className='text-lg text-muted-foreground hover:text-white transition flex items-center'>
      {children}
    </Link>
  );
}

// Custom Social Media Icons
function FacebookIcon(props) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      {...props}>
      <path d='M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z' />
    </svg>
  );
}

function InstagramIcon(props) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      {...props}>
      <rect x='2' y='2' width='20' height='20' rx='5' ry='5' />
      <path d='M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z' />
      <line x1='17.5' y1='6.5' x2='17.51' y2='6.5' />
    </svg>
  );
}
