/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ynyixqpdeuglzuogeqsh.supabase.co', // Supabase project domain
      },
      {
        protocol: 'https',
        hostname: '*.fbcdn.net', // Facebook CDN domains
      },
      {
        protocol: 'https',
        hostname: 'graph.facebook.com', // Graph API domain
      },
      {
        protocol: 'https',
        hostname: '*.googleapis.com', // Google domains
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // Unsplash
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com', // Cloudinary
      },
    ],
  },
};

module.exports = nextConfig;
