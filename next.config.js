/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'ynyixqpdeuglzuogeqsh.supabase.co', // Supabase project domain
      'scontent-sea1-1.xx.fbcdn.net',     // Facebook CDN domain
      'scontent.xx.fbcdn.net',            // Alternative Facebook CDN domain
      'graph.facebook.com',               // Graph API domain
    ],
  },
};

module.exports = nextConfig;
