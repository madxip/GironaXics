/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'v5.airtableusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'dl.airtable.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'files.catbox.moe',
      },
      {
        protocol: 'https',
        hostname: 'tmpfiles.org',
      }
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            // Allow scripts from self and Google Analytics/GTM; images from self and allowed CDNs; connect to APIs and GA
            value: "default-src 'self'; img-src 'self' data: https://images.unsplash.com https://files.catbox.moe https://tmpfiles.org https://www.google-analytics.com; script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self' https://v5.airtableusercontent.com https://dl.airtable.com https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com; object-src 'none'; frame-ancestors 'none';"
          },
        ],
      },
    ];
  },
};

export default nextConfig;
