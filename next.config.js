/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'ynyixqpdeuglzuogeqsh.supabase.co', // Supabase project domain
      'scontent-sea1-1.xx.fbcdn.net',     // Facebook CDN domain
      'scontent.xx.fbcdn.net',            // Alternative Facebook CDN domain
      'graph.facebook.com',               // Graph API domain
      'storage.googleapis.com',           // Google Cloud Storage
      'lh3.googleusercontent.com',        // Google User Content
      'firebasestorage.googleapis.com',   // Firebase Storage
      'images.unsplash.com',              // Unsplash
      'res.cloudinary.com',               // Cloudinary
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig;
