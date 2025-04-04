/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'unsplash.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'pub-3626123a908647a7980f57fbd34oef12.r2.dev',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'scontent-sea1-1.xx.fbcdn.net',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: '**.xx.fbcdn.net',
        pathname: '**',
      }
    ]
  },
}

module.exports = nextConfig