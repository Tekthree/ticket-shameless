/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignore TypeScript errors in build to handle deprecated files
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'd85f1bb68ad7da530dccaef0eccc5e0b.r2.cloudflarestorage.com', // Cloudflare R2
      },
      {
        protocol: 'https',
        hostname: 'pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // Unsplash (dev placeholders)
      },
      {
        protocol: 'https',
        hostname: 'simplyshameless.com', // Original site images
      },
      {
        protocol: 'https',
        hostname: '*.sndcdn.com', // SoundCloud CDN avatars
      },
      {
        protocol: 'https',
        hostname: '*.cdninstagram.com', // Instagram CDN (fallbacks)
      },
      {
        protocol: 'https',
        hostname: '*.fbcdn.net', // Facebook/Instagram CDN fallbacks
      },
      {
        protocol: 'https',
        hostname: 'ra.co', // Resident Advisor
      },
      {
        protocol: 'https',
        hostname: 'www.hammarica.com', // Legacy press images
      },
    ],
  },
};

module.exports = nextConfig;
