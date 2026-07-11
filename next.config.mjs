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
      },
      {
        protocol: 'https',
        hostname: '*.uguu.se',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      }
    ],
  },
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    
    // In development mode, Next.js requires 'unsafe-eval' for fast refresh/eval-source-maps
    // and WebSockets (ws: wss:) for Hot Module Replacement (HMR) connection.
    const cspValue = isDev
      ? "default-src 'self'; img-src 'self' data: https: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self' ws: wss: https://v5.airtableusercontent.com https://dl.airtable.com https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com; object-src 'none';"
      : "default-src 'self'; img-src 'self' data: https://images.unsplash.com https://files.catbox.moe https://tmpfiles.org https://*.uguu.se https://*.public.blob.vercel-storage.com https://v5.airtableusercontent.com https://dl.airtable.com https://www.google-analytics.com; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self' https://v5.airtableusercontent.com https://dl.airtable.com https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com; object-src 'none'; frame-ancestors 'none';";

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
            value: cspValue,
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Escacs ha passat a ser subcategoria d'Esports
      {
        source: '/activitats/escacs/:slug*',
        destination: '/activitats/esports/:slug*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
